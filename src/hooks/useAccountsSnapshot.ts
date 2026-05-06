import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllPaginated } from '@/lib/financial/aggregates';

export interface AccountSnapshot {
  account_id: string;
  saldo_inicio_mes: number;
  saldo_fim_mes: number;
  entradas_mes: number;
  saidas_mes: number;
  transferencias_in: number;
  transferencias_out: number;
  variacao: number;
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

const lastDayOfMonth = (year: number, month: number) => {
  // month = 1..12
  const d = new Date(year, month, 0); // day 0 of next month
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const firstDayOfMonth = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}-01`;

/**
 * Snapshot histórico de saldo por conta no FINAL do mês informado.
 * Saldo = initial_balance + Σ entradas pagas até fim_do_mes − Σ saídas pagas até fim_do_mes
 *       + Σ transferências recebidas até fim_do_mes − Σ transferências enviadas até fim_do_mes
 */
export function useAccountsSnapshot(year: number, month: number) {
  return useQuery({
    queryKey: ['accounts-snapshot', year, month],
    queryFn: async (): Promise<Record<string, AccountSnapshot>> => {
      const endOfMonth = lastDayOfMonth(year, month);
      const startOfMonth = firstDayOfMonth(year, month);
      const endOfPrevMonth = (() => {
        const py = month === 1 ? year - 1 : year;
        const pm = month === 1 ? 12 : month - 1;
        return lastDayOfMonth(py, pm);
      })();

      const [{ data: accounts }, txs, transfersAll] = await Promise.all([
        supabase.from('accounts').select('id, initial_balance').eq('active', true),
        fetchAllPaginated<PaidTx>((q) =>
          q
            .select('account_id, tipo_movimento, valor, valor_pago, data_pagamento')
            .eq('status', 'PAGO')
            .not('account_id', 'is', null)
            .lte('data_pagamento', endOfMonth),
        ),
        (async () => {
          const { data } = await supabase
            .from('account_transfers')
            .select('from_account_id, to_account_id, amount, transfer_date')
            .lte('transfer_date', endOfMonth);
          return (data || []) as Transfer[];
        })(),
      ]);

      const result: Record<string, AccountSnapshot> = {};
      (accounts || []).forEach((a: any) => {
        result[a.id] = {
          account_id: a.id,
          saldo_inicio_mes: Number(a.initial_balance) || 0,
          saldo_fim_mes: Number(a.initial_balance) || 0,
          entradas_mes: 0,
          saidas_mes: 0,
          transferencias_in: 0,
          transferencias_out: 0,
          variacao: 0,
        };
      });

      // Apply paid transactions up to end of month
      for (const t of txs) {
        if (!t.account_id || !result[t.account_id]) continue;
        const v = Number(t.valor_pago ?? t.valor) || 0;
        const sign = t.tipo_movimento === 'ENTRADA' ? 1 : -1;
        result[t.account_id].saldo_fim_mes += sign * v;

        // Within the selected month?
        if (t.data_pagamento && t.data_pagamento >= startOfMonth && t.data_pagamento <= endOfMonth) {
          if (t.tipo_movimento === 'ENTRADA') result[t.account_id].entradas_mes += v;
          else result[t.account_id].saidas_mes += v;
        }
      }

      // Apply transfers up to end of month
      for (const tr of transfersAll) {
        const amt = Number(tr.amount) || 0;
        if (result[tr.to_account_id]) {
          result[tr.to_account_id].saldo_fim_mes += amt;
          if (tr.transfer_date >= startOfMonth && tr.transfer_date <= endOfMonth) {
            result[tr.to_account_id].transferencias_in += amt;
          }
        }
        if (result[tr.from_account_id]) {
          result[tr.from_account_id].saldo_fim_mes -= amt;
          if (tr.transfer_date >= startOfMonth && tr.transfer_date <= endOfMonth) {
            result[tr.from_account_id].transferencias_out += amt;
          }
        }
      }

      // Saldo início do mês = saldo fim do mês anterior; calculamos refazendo a passada com cutoff anterior
      // Otimização: derivar saldo_inicio = saldo_fim_mes - movimentação do mês
      Object.values(result).forEach((r) => {
        const movimentacaoMes =
          r.entradas_mes - r.saidas_mes + r.transferencias_in - r.transferencias_out;
        r.saldo_inicio_mes = r.saldo_fim_mes - movimentacaoMes;
        r.variacao = movimentacaoMes;
      });

      return result;
    },
    staleTime: 30_000,
  });
}
