import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Regime } from './useDashboardYTD';

export interface ProjectionMonth {
  month: number;
  receitaPrevista: number;   // valor (competência) — total esperado do mês
  receitaRealizada: number;  // PAGO no mês (caixa) ou esperado (competência)
  despesaPrevista: number;
  despesaRealizada: number;
  resultadoPrevisto: number;
  resultadoRealizado: number;
}

export interface YoYMonth {
  month: number;
  receitaAtual: number;
  receitaAnterior: number;
  despesaAtual: number;
  despesaAnterior: number;
}

export interface CashForecastMonth {
  month: number;
  saldoProjetado: number;     // saldo acumulado projetado (a partir de hoje)
  entradasPrevistas: number;
  saidasPrevistas: number;
}

export interface ProjectionsData {
  monthly: ProjectionMonth[];
  yoy: YoYMonth[];
  cashForecast: CashForecastMonth[];
  // Run-rate: receita média dos últimos 3 meses x 12
  receitaRunRateAnual: number;
  despesaRunRateAnual: number;
  resultadoRunRateAnual: number;
  // YTD acuracia (realizado/previsto até hoje)
  acuraciaReceita: number; // %
  acuraciaDespesa: number;
}

const PAGE = 1000;

async function fetchYears(years: number[]) {
  const out: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('transactions')
      .select('tipo_movimento,natureza,status,valor,valor_pago,data_vencimento,data_pagamento,competencia_mes,competencia_ano')
      .in('competencia_ano', years)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

export function useProjections(year: number, currentBalance: number) {
  return useQuery<ProjectionsData>({
    queryKey: ['dashboard-projections', year, currentBalance],
    queryFn: async () => {
      const rows = await fetchYears([year, year - 1]);
      const today = new Date();
      const isCurrentYear = today.getFullYear() === year;
      const currentMonth = isCurrentYear ? today.getMonth() + 1 : 12;
      const todayStr = today.toISOString().split('T')[0];

      const empty = <T extends object>(extra: () => T): T[] =>
        Array.from({ length: 12 }, (_, i) => ({ month: i + 1, ...extra() } as any));

      const monthly: ProjectionMonth[] = empty(() => ({
        receitaPrevista: 0, receitaRealizada: 0,
        despesaPrevista: 0, despesaRealizada: 0,
        resultadoPrevisto: 0, resultadoRealizado: 0,
      }));
      const yoy: YoYMonth[] = empty(() => ({
        receitaAtual: 0, receitaAnterior: 0,
        despesaAtual: 0, despesaAnterior: 0,
      }));

      for (const t of rows) {
        const valor = Number(t.valor) || 0;
        const pago = Number(t.valor_pago ?? t.valor) || 0;
        const isPago = t.status === 'PAGO';
        const ym = t.competencia_ano;
        const mm = t.competencia_mes;
        if (!mm) continue;

        if (ym === year) {
          const slot = monthly[mm - 1];
          if (t.tipo_movimento === 'ENTRADA') {
            slot.receitaPrevista += valor;
            if (isPago) slot.receitaRealizada += pago;
          } else if (t.tipo_movimento === 'SAIDA') {
            slot.despesaPrevista += valor;
            if (isPago) slot.despesaRealizada += pago;
          }
          const y = yoy[mm - 1];
          if (t.tipo_movimento === 'ENTRADA') y.receitaAtual += valor;
          else if (t.tipo_movimento === 'SAIDA') y.despesaAtual += valor;
        } else if (ym === year - 1) {
          const y = yoy[mm - 1];
          if (t.tipo_movimento === 'ENTRADA') y.receitaAnterior += valor;
          else if (t.tipo_movimento === 'SAIDA') y.despesaAnterior += valor;
        }
      }

      monthly.forEach(m => {
        m.resultadoPrevisto = m.receitaPrevista - m.despesaPrevista;
        m.resultadoRealizado = m.receitaRealizada - m.despesaRealizada;
      });

      // Run-rate: média dos últimos 3 meses fechados (anteriores ao mês corrente)
      const lastClosed = Math.max(0, currentMonth - 1);
      const start = Math.max(0, lastClosed - 3);
      const slice = monthly.slice(start, lastClosed);
      const avgReceita = slice.length ? slice.reduce((s, m) => s + m.receitaRealizada, 0) / slice.length : 0;
      const avgDespesa = slice.length ? slice.reduce((s, m) => s + m.despesaRealizada, 0) / slice.length : 0;

      // Cash forecast: a partir do mês atual, projeta saldo usando previsto não realizado + run-rate
      const cashForecast: CashForecastMonth[] = [];
      let saldo = currentBalance;
      for (let m = currentMonth; m <= 12; m++) {
        const slot = monthly[m - 1];
        // entradas previstas: usa o maior entre previsto e run-rate (estimativa otimista do que está mapeado)
        const entradas = Math.max(slot.receitaPrevista, m === currentMonth ? slot.receitaPrevista : avgReceita);
        const saidas = Math.max(slot.despesaPrevista, m === currentMonth ? slot.despesaPrevista : avgDespesa);
        // Para o mês corrente, descontamos o que já foi realizado
        const entradasNet = m === currentMonth ? Math.max(0, entradas - slot.receitaRealizada) : entradas;
        const saidasNet = m === currentMonth ? Math.max(0, saidas - slot.despesaRealizada) : saidas;
        saldo = saldo + entradasNet - saidasNet;
        cashForecast.push({
          month: m,
          saldoProjetado: saldo,
          entradasPrevistas: entradasNet,
          saidasPrevistas: saidasNet,
        });
      }

      // Acurácia YTD: realizado/previsto (até mês corrente)
      const ytdSlice = monthly.slice(0, currentMonth);
      const recPrev = ytdSlice.reduce((s, m) => s + m.receitaPrevista, 0);
      const recReal = ytdSlice.reduce((s, m) => s + m.receitaRealizada, 0);
      const desPrev = ytdSlice.reduce((s, m) => s + m.despesaPrevista, 0);
      const desReal = ytdSlice.reduce((s, m) => s + m.despesaRealizada, 0);

      return {
        monthly,
        yoy,
        cashForecast,
        receitaRunRateAnual: avgReceita * 12,
        despesaRunRateAnual: avgDespesa * 12,
        resultadoRunRateAnual: (avgReceita - avgDespesa) * 12,
        acuraciaReceita: recPrev > 0 ? (recReal / recPrev) * 100 : 0,
        acuraciaDespesa: desPrev > 0 ? (desReal / desPrev) * 100 : 0,
      };
    },
    staleTime: 60_000,
  });
}
