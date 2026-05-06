import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllPaginated } from '@/lib/financial/aggregates';

export interface AccountTx {
  id: string;
  data_pagamento: string | null;
  data_vencimento: string;
  descricao: string | null;
  tipo_movimento: 'ENTRADA' | 'SAIDA';
  valor: number;
  valor_pago: number | null;
  status: string;
  natureza: string;
  origem: string;
  transaction_category_id: string | null;
  category_name?: string;
  category_color?: string;
}

export interface AccountTransfer {
  id: string;
  transfer_date: string;
  amount: number;
  notes: string | null;
  direction: 'IN' | 'OUT';
  counterparty_id: string;
  counterparty_name?: string;
}

export interface AccountDetailData {
  paid: AccountTx[];
  open: AccountTx[];
  transfers: AccountTransfer[];
  byCategory: { id: string; name: string; color: string; total: number }[];
}

const lastDay = (y: number, m: number) => {
  const d = new Date(y, m, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const firstDay = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}-01`;

export function useAccountDetail(accountId: string | null, year: number, month: number) {
  return useQuery({
    queryKey: ['account-detail', accountId, year, month],
    enabled: !!accountId,
    queryFn: async (): Promise<AccountDetailData> => {
      const start = firstDay(year, month);
      const end = lastDay(year, month);

      const [txsRaw, transfersRaw, cats, accs] = await Promise.all([
        fetchAllPaginated<any>((q) =>
          q
            .select(
              'id, data_pagamento, data_vencimento, descricao, tipo_movimento, valor, valor_pago, status, natureza, origem, transaction_category_id',
            )
            .eq('account_id', accountId!)
            .or(
              `and(status.eq.PAGO,data_pagamento.gte.${start},data_pagamento.lte.${end}),and(status.neq.PAGO,data_vencimento.gte.${start},data_vencimento.lte.${end})`,
            ),
        ),
        supabase
          .from('account_transfers')
          .select('id, transfer_date, amount, notes, from_account_id, to_account_id')
          .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
          .gte('transfer_date', start)
          .lte('transfer_date', end),
        supabase.from('transaction_categories').select('id, name, color'),
        supabase.from('accounts').select('id, name'),
      ]);

      const catMap = new Map<string, { name: string; color: string }>();
      (cats.data || []).forEach((c: any) =>
        catMap.set(c.id, { name: c.name, color: c.color || '#6366f1' }),
      );
      const accMap = new Map<string, string>();
      (accs.data || []).forEach((a: any) => accMap.set(a.id, a.name));

      const decorated: AccountTx[] = (txsRaw || []).map((t: any) => ({
        ...t,
        valor: Number(t.valor) || 0,
        valor_pago: t.valor_pago != null ? Number(t.valor_pago) : null,
        category_name: t.transaction_category_id
          ? catMap.get(t.transaction_category_id)?.name
          : undefined,
        category_color: t.transaction_category_id
          ? catMap.get(t.transaction_category_id)?.color
          : undefined,
      }));

      const paid = decorated
        .filter((t) => t.status === 'PAGO')
        .sort((a, b) => (b.data_pagamento || '').localeCompare(a.data_pagamento || ''));
      const open = decorated
        .filter((t) => t.status !== 'PAGO')
        .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento));

      const transfers: AccountTransfer[] = (transfersRaw.data || []).map((t: any) => {
        const isOut = t.from_account_id === accountId;
        const counterparty_id = isOut ? t.to_account_id : t.from_account_id;
        return {
          id: t.id,
          transfer_date: t.transfer_date,
          amount: Number(t.amount) || 0,
          notes: t.notes,
          direction: isOut ? 'OUT' : 'IN',
          counterparty_id,
          counterparty_name: accMap.get(counterparty_id) || '—',
        };
      });

      // composition by category (paid in period)
      const compMap = new Map<string, { id: string; name: string; color: string; total: number }>();
      paid.forEach((t) => {
        const id = t.transaction_category_id || 'sem-categoria';
        const name = t.category_name || 'Sem categoria';
        const color = t.category_color || '#94a3b8';
        const v = (t.valor_pago ?? t.valor) || 0;
        const cur = compMap.get(id);
        const signed = t.tipo_movimento === 'ENTRADA' ? v : -v;
        if (cur) cur.total += signed;
        else compMap.set(id, { id, name, color, total: signed });
      });
      const byCategory = Array.from(compMap.values()).sort(
        (a, b) => Math.abs(b.total) - Math.abs(a.total),
      );

      return { paid, open, transfers, byCategory };
    },
    staleTime: 30_000,
  });
}
