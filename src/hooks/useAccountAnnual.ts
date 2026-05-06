import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllPaginated } from '@/lib/financial/aggregates';

export type AnnualPeriodMode = 'competencia' | 'caixa';

export interface AnnualMonthRow {
  month: number;
  byCategory: Record<string, { in: number; out: number }>;
  totalIn: number;
  totalOut: number;
  transferIn: number;
  transferOut: number;
  endBalance: number;
}

export interface AnnualCategoryMeta {
  id: string;
  name: string;
  color: string;
  type: 'ENTRADA' | 'SAIDA';
  total: number;
}

export interface AccountAnnualData {
  months: AnnualMonthRow[];
  categories: AnnualCategoryMeta[];
  openingBalance: number;
  totals: {
    in: number;
    out: number;
    transferIn: number;
    transferOut: number;
  };
  mode: AnnualPeriodMode;
}

export function useAccountAnnual(
  accountId: string | null,
  year: number,
  mode: AnnualPeriodMode = 'competencia',
) {
  return useQuery({
    queryKey: ['account-annual-v3', accountId, year, mode],
    enabled: !!accountId,
    queryFn: async (): Promise<AccountAnnualData> => {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;

      // === fetch transações do ano (competência ou caixa) ===
      const txsPromise =
        mode === 'competencia'
          ? fetchAllPaginated<any>((q) =>
              q
                .select(
                  'id, tipo_movimento, valor, valor_pago, data_pagamento, transaction_category_id, status, competencia_mes, competencia_ano',
                )
                .eq('account_id', accountId!)
                .eq('competencia_ano', year),
            )
          : fetchAllPaginated<any>((q) =>
              q
                .select(
                  'id, tipo_movimento, valor, valor_pago, data_pagamento, transaction_category_id, status, competencia_mes, competencia_ano',
                )
                .eq('account_id', accountId!)
                .eq('status', 'PAGO')
                .gte('data_pagamento', start)
                .lte('data_pagamento', end),
            );

      const [txs, transfersRes, catsRes, accRes, priorTxs, priorTransfersRes] = await Promise.all([
        txsPromise,
        supabase
          .from('account_transfers')
          .select('from_account_id, to_account_id, amount, transfer_date')
          .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
          .gte('transfer_date', start)
          .lte('transfer_date', end),
        supabase.from('transaction_categories').select('id, name, color, type'),
        supabase.from('accounts').select('id, initial_balance').eq('id', accountId!).single(),
        // saldo de abertura sempre por caixa real (movimentos pagos antes de 01/jan)
        fetchAllPaginated<any>((q) =>
          q
            .select('tipo_movimento, valor, valor_pago')
            .eq('account_id', accountId!)
            .eq('status', 'PAGO')
            .lt('data_pagamento', start),
        ),
        supabase
          .from('account_transfers')
          .select('from_account_id, to_account_id, amount')
          .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
          .lt('transfer_date', start),
      ]);

      const catMap = new Map<string, { name: string; color: string; type: 'ENTRADA' | 'SAIDA' }>();
      (catsRes.data || []).forEach((c: any) =>
        catMap.set(c.id, { name: c.name, color: c.color || '#94a3b8', type: c.type }),
      );

      let opening = Number((accRes.data as any)?.initial_balance) || 0;
      for (const t of priorTxs) {
        const v = Number(t.valor_pago ?? t.valor) || 0;
        opening += t.tipo_movimento === 'ENTRADA' ? v : -v;
      }
      for (const tr of priorTransfersRes.data || []) {
        const amt = Number(tr.amount) || 0;
        if (tr.to_account_id === accountId) opening += amt;
        if (tr.from_account_id === accountId) opening -= amt;
      }

      const months: AnnualMonthRow[] = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        byCategory: {},
        totalIn: 0,
        totalOut: 0,
        transferIn: 0,
        transferOut: 0,
        endBalance: 0,
      }));

      const catTotals = new Map<string, number>();

      for (const t of txs) {
        let m: number | null = null;
        if (mode === 'competencia') {
          m = Number(t.competencia_mes);
        } else {
          const dp = t.data_pagamento as string | null;
          if (dp) m = Number(dp.slice(5, 7));
        }
        if (!m) continue;
        const v = Number(t.valor_pago ?? t.valor) || 0;
        const cid = t.transaction_category_id || 'sem-categoria';
        const row = months[m - 1];
        if (!row.byCategory[cid]) row.byCategory[cid] = { in: 0, out: 0 };
        if (t.tipo_movimento === 'ENTRADA') {
          row.byCategory[cid].in += v;
          row.totalIn += v;
        } else {
          row.byCategory[cid].out += v;
          row.totalOut += v;
        }
        catTotals.set(cid, (catTotals.get(cid) || 0) + v);
      }

      for (const tr of transfersRes.data || []) {
        const m = Number(tr.transfer_date.slice(5, 7));
        if (!m) continue;
        const amt = Number(tr.amount) || 0;
        if (tr.to_account_id === accountId) months[m - 1].transferIn += amt;
        if (tr.from_account_id === accountId) months[m - 1].transferOut += amt;
      }

      let running = opening;
      months.forEach((m) => {
        running += m.totalIn - m.totalOut + m.transferIn - m.transferOut;
        m.endBalance = running;
      });

      const categories: AnnualCategoryMeta[] = Array.from(catTotals.entries())
        .map(([id, total]) => {
          const meta = catMap.get(id);
          return {
            id,
            name: meta?.name || 'Sem categoria',
            color: meta?.color || '#94a3b8',
            type: meta?.type || 'SAIDA',
            total,
          };
        })
        .sort((a, b) => b.total - a.total);

      const totals = months.reduce(
        (acc, m) => ({
          in: acc.in + m.totalIn,
          out: acc.out + m.totalOut,
          transferIn: acc.transferIn + m.transferIn,
          transferOut: acc.transferOut + m.transferOut,
        }),
        { in: 0, out: 0, transferIn: 0, transferOut: 0 },
      );

      return { months, categories, openingBalance: opening, totals, mode };
    },
    staleTime: 30_000,
  });
}
