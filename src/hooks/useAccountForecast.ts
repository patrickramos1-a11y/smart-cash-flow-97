import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllPaginated } from '@/lib/financial/aggregates';

export interface ForecastMonth {
  month: number;
  realBalance: number; // saldo a partir de pagos + transferências executadas
  forecastBalance: number; // realBalance + ocorrências planejadas (líquido)
  plannedIn: number;
  plannedOut: number;
}

export interface AccountForecastData {
  months: ForecastMonth[];
  openingBalance: number;
}

/**
 * Projeta saldo da conta combinando movimentações pagas, transferências executadas
 * e ocorrências de transferências planejadas (não executadas) por mês do ano.
 */
export function useAccountForecast(accountId: string | null, year: number) {
  return useQuery({
    queryKey: ['account-forecast', accountId, year],
    enabled: !!accountId,
    queryFn: async (): Promise<AccountForecastData> => {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;

      const [txs, transfersRes, plannedOccRes, plannedRes, accRes, priorTxs, priorTr] =
        await Promise.all([
          fetchAllPaginated<any>((q) =>
            q
              .select('tipo_movimento, valor, valor_pago, data_pagamento, status')
              .eq('account_id', accountId!)
              .eq('status', 'PAGO')
              .gte('data_pagamento', start)
              .lte('data_pagamento', end),
          ),
          supabase
            .from('account_transfers')
            .select('from_account_id, to_account_id, amount, transfer_date')
            .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
            .gte('transfer_date', start)
            .lte('transfer_date', end),
          supabase
            .from('planned_transfer_occurrences' as any)
            .select('id, scheduled_date, expected_amount, status, planned_transfer_id')
            .gte('scheduled_date', start)
            .lte('scheduled_date', end)
            .neq('status', 'EXECUTADA')
            .neq('status', 'CANCELADA'),
          supabase
            .from('planned_transfers' as any)
            .select('id, from_account_id, to_account_id, status'),
          supabase.from('accounts').select('initial_balance').eq('id', accountId!).single(),
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

      let opening = Number((accRes.data as any)?.initial_balance) || 0;
      for (const t of priorTxs) {
        const v = Number(t.valor_pago ?? t.valor) || 0;
        opening += t.tipo_movimento === 'ENTRADA' ? v : -v;
      }
      for (const tr of priorTr.data || []) {
        const amt = Number(tr.amount) || 0;
        if (tr.to_account_id === accountId) opening += amt;
        if (tr.from_account_id === accountId) opening -= amt;
      }

      const months: ForecastMonth[] = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        realBalance: 0,
        forecastBalance: 0,
        plannedIn: 0,
        plannedOut: 0,
      }));

      const realDelta = Array(12).fill(0) as number[];
      for (const t of txs) {
        const dp = t.data_pagamento as string | null;
        if (!dp) continue;
        const m = Number(dp.slice(5, 7));
        if (!m) continue;
        const v = Number(t.valor_pago ?? t.valor) || 0;
        realDelta[m - 1] += t.tipo_movimento === 'ENTRADA' ? v : -v;
      }
      for (const tr of transfersRes.data || []) {
        const m = Number(tr.transfer_date.slice(5, 7));
        if (!m) continue;
        const amt = Number(tr.amount) || 0;
        if (tr.to_account_id === accountId) realDelta[m - 1] += amt;
        if (tr.from_account_id === accountId) realDelta[m - 1] -= amt;
      }

      const plannedMap = new Map<string, any>();
      (plannedRes.data || []).forEach((p: any) => plannedMap.set(p.id, p));

      for (const occ of (plannedOccRes.data || []) as any[]) {
        const pt = plannedMap.get(occ.planned_transfer_id);
        if (!pt || pt.status !== 'ATIVO') continue;
        const m = Number(occ.scheduled_date.slice(5, 7));
        if (!m) continue;
        const amt = Number(occ.expected_amount) || 0;
        if (pt.to_account_id === accountId) months[m - 1].plannedIn += amt;
        if (pt.from_account_id === accountId) months[m - 1].plannedOut += amt;
      }

      let real = opening;
      let forecast = opening;
      months.forEach((m, i) => {
        real += realDelta[i];
        forecast += realDelta[i] + m.plannedIn - m.plannedOut;
        m.realBalance = real;
        m.forecastBalance = forecast;
      });

      return { months, openingBalance: opening };
    },
    staleTime: 30_000,
  });
}
