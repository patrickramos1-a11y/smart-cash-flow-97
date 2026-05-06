import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllPaginated } from '@/lib/financial/aggregates';

export interface EvolutionPoint {
  label: string; // "jan/25"
  year: number;
  month: number; // 1..12
  total: number;
  byAccount: Record<string, number>;
}

interface PaidTx {
  account_id: string | null;
  tipo_movimento: 'ENTRADA' | 'SAIDA';
  valor: number | string;
  valor_pago: number | string | null;
  data_pagamento: string | null;
}
interface Transfer {
  from_account_id: string;
  to_account_id: string;
  amount: number | string;
  transfer_date: string;
}

const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const lastDay = (y: number, m: number) => {
  const d = new Date(y, m, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Evolução de saldo dos últimos 12 meses (incluindo o mês de referência).
 * Calcula saldo de fim de cada mês para todas as contas ativas.
 */
export function useAccountsEvolution(refYear: number, refMonth: number) {
  return useQuery({
    queryKey: ['accounts-evolution', refYear, refMonth],
    queryFn: async (): Promise<EvolutionPoint[]> => {
      // Build 12-month window ending at refYear/refMonth
      const months: { year: number; month: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(refYear, refMonth - 1 - i, 1);
        months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
      }
      const endOfWindow = lastDay(months[months.length - 1].year, months[months.length - 1].month);

      const [{ data: accounts }, txs, transfers] = await Promise.all([
        supabase.from('accounts').select('id, name, initial_balance').eq('active', true),
        fetchAllPaginated<PaidTx>((q) =>
          q
            .select('account_id, tipo_movimento, valor, valor_pago, data_pagamento')
            .eq('status', 'PAGO')
            .not('account_id', 'is', null)
            .lte('data_pagamento', endOfWindow),
        ),
        (async () => {
          const { data } = await supabase
            .from('account_transfers')
            .select('from_account_id, to_account_id, amount, transfer_date')
            .lte('transfer_date', endOfWindow);
          return (data || []) as Transfer[];
        })(),
      ]);

      const accIds = (accounts || []).map((a: any) => a.id as string);
      const initial: Record<string, number> = {};
      (accounts || []).forEach((a: any) => {
        initial[a.id] = Number(a.initial_balance) || 0;
      });

      return months.map(({ year, month }) => {
        const cutoff = lastDay(year, month);
        const byAccount: Record<string, number> = { ...initial };

        for (const t of txs) {
          if (!t.account_id || !(t.account_id in byAccount)) continue;
          if (!t.data_pagamento || t.data_pagamento > cutoff) continue;
          const v = Number(t.valor_pago ?? t.valor) || 0;
          byAccount[t.account_id] += t.tipo_movimento === 'ENTRADA' ? v : -v;
        }
        for (const tr of transfers) {
          if (tr.transfer_date > cutoff) continue;
          const amt = Number(tr.amount) || 0;
          if (tr.to_account_id in byAccount) byAccount[tr.to_account_id] += amt;
          if (tr.from_account_id in byAccount) byAccount[tr.from_account_id] -= amt;
        }

        const total = accIds.reduce((s, id) => s + (byAccount[id] || 0), 0);
        return {
          label: `${MONTH_LABELS[month - 1]}/${String(year).slice(-2)}`,
          year,
          month,
          total,
          byAccount,
        };
      });
    },
    staleTime: 60_000,
  });
}
