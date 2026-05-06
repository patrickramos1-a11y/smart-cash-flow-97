import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Regime = 'competencia' | 'caixa';

export interface MonthBucket {
  month: number;
  receita: number;
  despesa: number;
  resultado: number;
}

export interface DashboardYTD {
  // YTD totals (current year, up to current month inclusive)
  receitaYTD: number;
  despesaYTD: number;
  resultadoYTD: number;
  // Same-period last year (Jan..currentMonth)
  receitaYTDPrev: number;
  despesaYTDPrev: number;
  resultadoYTDPrev: number;
  // Variations (%)
  receitaYoY: number;
  despesaYoY: number;
  resultadoYoY: number;
  // Series (12 months) — current year
  monthly: MonthBucket[];
  monthlyPrev: MonthBucket[];
  // Splits (current YTD)
  receitaRecorrente: number;
  receitaAvulsa: number;
  despesaFixa: number;
  despesaVariavel: number;
  // Operational
  aReceber: number;
  aPagar: number;
  atrasados: number;
  // Other
  ticketMedio: number;
  burnRateMensal: number; // average monthly expense YTD
}

const PAGE = 1000;

async function fetchAll(year: number, regime: Regime) {
  // Fetch all transactions for the year (and previous year) in two paginated calls
  const out: any[] = [];
  let from = 0;
  while (true) {
    const q = supabase
      .from('transactions')
      .select('id,tipo_movimento,natureza,status,valor,valor_pago,data_vencimento,data_pagamento,competencia_mes,competencia_ano')
      .in('competencia_ano', [year, year - 1])
      .range(from, from + PAGE - 1);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

function pickMonth(t: any, regime: Regime): { year: number; month: number } | null {
  if (regime === 'competencia') {
    return { year: t.competencia_ano, month: t.competencia_mes };
  }
  if (t.status !== 'PAGO' || !t.data_pagamento) return null;
  const [y, m] = t.data_pagamento.split('-').map(Number);
  return { year: y, month: m };
}

function pickValue(t: any, regime: Regime): number {
  if (regime === 'caixa') return Number(t.valor_pago ?? t.valor) || 0;
  return Number(t.valor) || 0;
}

export function useDashboardYTD(year: number, regime: Regime = 'competencia') {
  return useQuery<DashboardYTD>({
    queryKey: ['dashboard-ytd', year, regime],
    queryFn: async () => {
      const rows = await fetchAll(year, regime);
      const today = new Date();
      const currentMonth = today.getFullYear() === year ? today.getMonth() + 1 : 12;

      const empty = (): MonthBucket[] =>
        Array.from({ length: 12 }, (_, i) => ({
          month: i + 1, receita: 0, despesa: 0, resultado: 0,
        }));
      const monthly = empty();
      const monthlyPrev = empty();

      let receitaRecorrente = 0, receitaAvulsa = 0;
      let despesaFixa = 0, despesaVariavel = 0;
      let aReceber = 0, aPagar = 0, atrasados = 0;
      let entradaCount = 0, entradaSoma = 0;

      const todayStr = today.toISOString().split('T')[0];

      for (const t of rows) {
        const bucket = pickMonth(t, regime);
        if (!bucket) continue;
        const value = pickValue(t, regime);
        const target = bucket.year === year ? monthly : bucket.year === year - 1 ? monthlyPrev : null;
        if (!target) continue;
        const slot = target[bucket.month - 1];
        if (t.tipo_movimento === 'ENTRADA') {
          slot.receita += value;
          if (bucket.year === year) {
            if (t.natureza === 'RECORRENTE') receitaRecorrente += value;
            else receitaAvulsa += value;
            entradaCount += 1;
            entradaSoma += value;
          }
        } else {
          slot.despesa += value;
          if (bucket.year === year) {
            if (t.natureza === 'RECORRENTE') despesaFixa += value;
            else despesaVariavel += value;
          }
        }
        slot.resultado = slot.receita - slot.despesa;

        // Operational pendings (only current year)
        if (bucket.year === year && t.status !== 'PAGO') {
          if (t.tipo_movimento === 'ENTRADA') aReceber += Number(t.valor) || 0;
          else aPagar += Number(t.valor) || 0;
          if (t.data_vencimento && t.data_vencimento < todayStr) {
            atrasados += Number(t.valor) || 0;
          }
        }
      }

      const sumYTD = (arr: MonthBucket[], k: keyof MonthBucket) =>
        arr.slice(0, currentMonth).reduce((s, m) => s + (m[k] as number), 0);

      const receitaYTD = sumYTD(monthly, 'receita');
      const despesaYTD = sumYTD(monthly, 'despesa');
      const resultadoYTD = receitaYTD - despesaYTD;
      const receitaYTDPrev = sumYTD(monthlyPrev, 'receita');
      const despesaYTDPrev = sumYTD(monthlyPrev, 'despesa');
      const resultadoYTDPrev = receitaYTDPrev - despesaYTDPrev;

      const yoy = (cur: number, prev: number) =>
        prev === 0 ? (cur === 0 ? 0 : 100) : ((cur - prev) / Math.abs(prev)) * 100;

      return {
        receitaYTD, despesaYTD, resultadoYTD,
        receitaYTDPrev, despesaYTDPrev, resultadoYTDPrev,
        receitaYoY: yoy(receitaYTD, receitaYTDPrev),
        despesaYoY: yoy(despesaYTD, despesaYTDPrev),
        resultadoYoY: yoy(resultadoYTD, resultadoYTDPrev),
        monthly,
        monthlyPrev,
        receitaRecorrente, receitaAvulsa,
        despesaFixa, despesaVariavel,
        aReceber, aPagar, atrasados,
        ticketMedio: entradaCount > 0 ? entradaSoma / entradaCount : 0,
        burnRateMensal: currentMonth > 0 ? despesaYTD / currentMonth : 0,
      };
    },
    staleTime: 60_000,
  });
}
