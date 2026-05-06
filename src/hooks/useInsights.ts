import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type InsightSeverity = 'info' | 'success' | 'warning' | 'critical';
export type InsightCategory = 'receita' | 'despesa' | 'caixa' | 'cliente' | 'operacional';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  category: InsightCategory;
  title: string;
  description: string;
  metric?: string;
  delta?: number; // percent
}

const PAGE = 1000;

async function fetchYears(years: number[]) {
  const out: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        tipo_movimento,natureza,status,valor,valor_pago,data_vencimento,data_pagamento,
        competencia_mes,competencia_ano,cliente_id,transaction_category_id,
        transaction_categories(name),
        recurring_clients(name)
      `)
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

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export function useInsights(year: number) {
  return useQuery<Insight[]>({
    queryKey: ['dashboard-insights', year],
    queryFn: async () => {
      const rows = await fetchYears([year, year - 1]);
      const today = new Date();
      const isCY = today.getFullYear() === year;
      const currentMonth = isCY ? today.getMonth() + 1 : 12;
      const prevMonth = currentMonth - 1;
      const insights: Insight[] = [];

      // Buckets
      const receitaMes = Array(13).fill(0);
      const despesaMes = Array(13).fill(0);
      const catMes: Record<string, number[]> = {};
      const clienteMes: Record<string, { name: string; values: number[] }> = {};

      let aReceber = 0, aPagar = 0, atrasados = 0, atrasadosCount = 0;
      const todayStr = today.toISOString().split('T')[0];

      for (const t of rows as any[]) {
        if (t.competencia_ano !== year) continue;
        const m = t.competencia_mes;
        if (!m) continue;
        const v = Number(t.valor) || 0;

        if (t.tipo_movimento === 'ENTRADA') {
          receitaMes[m] += v;
          if (t.cliente_id) {
            const id = t.cliente_id;
            if (!clienteMes[id]) clienteMes[id] = { name: t.recurring_clients?.name || 'Cliente', values: Array(13).fill(0) };
            clienteMes[id].values[m] += v;
          }
        } else if (t.tipo_movimento === 'SAIDA') {
          despesaMes[m] += v;
          const cname = t.transaction_categories?.name || 'Sem categoria';
          if (!catMes[cname]) catMes[cname] = Array(13).fill(0);
          catMes[cname][m] += v;
        }

        if (t.status !== 'PAGO') {
          if (t.tipo_movimento === 'ENTRADA') aReceber += v;
          else aPagar += v;
          if (t.data_vencimento && t.data_vencimento < todayStr) {
            atrasados += v;
            atrasadosCount += 1;
          }
        }
      }

      // Rule 1: MoM revenue change
      if (prevMonth >= 1) {
        const cur = receitaMes[currentMonth];
        const prev = receitaMes[prevMonth];
        if (prev > 0) {
          const delta = ((cur - prev) / prev) * 100;
          if (delta <= -20) {
            insights.push({
              id: 'rev-drop',
              severity: 'critical',
              category: 'receita',
              title: 'Queda significativa de receita',
              description: `Receita do mês caiu ${Math.abs(delta).toFixed(1)}% vs mês anterior (${fmt(cur)} vs ${fmt(prev)}).`,
              delta,
            });
          } else if (delta >= 20) {
            insights.push({
              id: 'rev-up',
              severity: 'success',
              category: 'receita',
              title: 'Crescimento forte de receita',
              description: `Receita do mês cresceu ${delta.toFixed(1)}% vs mês anterior (${fmt(cur)} vs ${fmt(prev)}).`,
              delta,
            });
          }
        }
      }

      // Rule 2: Expense category spikes (>40% MoM)
      Object.entries(catMes).forEach(([cat, arr]) => {
        if (prevMonth < 1) return;
        const cur = arr[currentMonth];
        const prev = arr[prevMonth];
        if (prev > 500 && cur > 0) {
          const delta = ((cur - prev) / prev) * 100;
          if (delta >= 40) {
            insights.push({
              id: `exp-spike-${cat}`,
              severity: 'warning',
              category: 'despesa',
              title: `Despesa em "${cat}" aumentou ${delta.toFixed(0)}%`,
              description: `${fmt(cur)} este mês vs ${fmt(prev)} no mês anterior.`,
              delta,
            });
          }
        }
      });

      // Rule 3: Client concentration (top 1 > 30%)
      const ytdRev = receitaMes.slice(1, currentMonth + 1).reduce((s, v) => s + v, 0);
      if (ytdRev > 0) {
        const ranking = Object.values(clienteMes)
          .map(c => ({ name: c.name, total: c.values.slice(1, currentMonth + 1).reduce((s, v) => s + v, 0) }))
          .sort((a, b) => b.total - a.total);
        if (ranking[0]) {
          const share = (ranking[0].total / ytdRev) * 100;
          if (share >= 30) {
            insights.push({
              id: 'concentration',
              severity: 'warning',
              category: 'cliente',
              title: 'Alta concentração de receita',
              description: `${ranking[0].name} representa ${share.toFixed(1)}% da receita YTD. Considere diversificar.`,
              metric: fmt(ranking[0].total),
            });
          }
        }
      }

      // Rule 4: Overdue
      if (atrasados > 0) {
        insights.push({
          id: 'overdue',
          severity: atrasados > 10000 ? 'critical' : 'warning',
          category: 'operacional',
          title: `${atrasadosCount} pendência(s) em atraso`,
          description: `Total de ${fmt(atrasados)} vencido e ainda não pago.`,
          metric: fmt(atrasados),
        });
      }

      // Rule 5: Operating result negative YTD
      const ytdExp = despesaMes.slice(1, currentMonth + 1).reduce((s, v) => s + v, 0);
      const ytdResult = ytdRev - ytdExp;
      if (ytdResult < 0 && ytdRev > 0) {
        insights.push({
          id: 'neg-result',
          severity: 'critical',
          category: 'operacional',
          title: 'Resultado operacional negativo no ano',
          description: `Despesas (${fmt(ytdExp)}) superam receitas (${fmt(ytdRev)}) — déficit de ${fmt(Math.abs(ytdResult))}.`,
          metric: fmt(ytdResult),
        });
      }

      // Rule 6: Healthy margin
      if (ytdRev > 0 && ytdResult > 0) {
        const margin = (ytdResult / ytdRev) * 100;
        if (margin >= 25) {
          insights.push({
            id: 'good-margin',
            severity: 'success',
            category: 'operacional',
            title: 'Margem operacional saudável',
            description: `Margem YTD de ${margin.toFixed(1)}% — acima da média do setor.`,
            metric: `${margin.toFixed(1)}%`,
          });
        } else if (margin < 5) {
          insights.push({
            id: 'low-margin',
            severity: 'warning',
            category: 'operacional',
            title: 'Margem operacional baixa',
            description: `Margem YTD de apenas ${margin.toFixed(1)}%. Revise estrutura de custos.`,
            metric: `${margin.toFixed(1)}%`,
          });
        }
      }

      // Rule 7: A receber alto
      if (aReceber > ytdRev * 0.3 && ytdRev > 0) {
        insights.push({
          id: 'high-receivables',
          severity: 'warning',
          category: 'caixa',
          title: 'Volume alto a receber',
          description: `${fmt(aReceber)} pendentes representam mais de 30% da receita YTD. Acelere cobranças.`,
          metric: fmt(aReceber),
        });
      }

      // Sort by severity
      const order: Record<InsightSeverity, number> = { critical: 0, warning: 1, info: 2, success: 3 };
      insights.sort((a, b) => order[a.severity] - order[b.severity]);

      return insights;
    },
    staleTime: 60_000,
  });
}
