import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Regime = 'competencia' | 'caixa';
export type Tipo = 'ENTRADA' | 'SAIDA';
export type GroupBy = 'category' | 'cost_center' | 'client';

export interface AnnualGroupRow {
  groupId: string;
  groupName: string;
  color?: string | null;
  monthly: number[]; // 12
  total: number;
  count: number;
}

export interface AnnualBreakdown {
  groups: AnnualGroupRow[];
  monthlyTotal: number[]; // 12
  total: number;
  totalCount: number;
}

const PAGE = 1000;

async function fetchAll(year: number, tipo: Tipo) {
  const out: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,tipo_movimento,natureza,status,valor,valor_pago,data_pagamento,
        competencia_mes,competencia_ano,
        transaction_category_id,cost_center_id,cliente_id,
        transaction_categories(id,name,color),
        cost_centers(id,name),
        recurring_clients(id,name)
      `)
      .eq('tipo_movimento', tipo)
      .or(`competencia_ano.eq.${year},and(data_pagamento.gte.${year}-01-01,data_pagamento.lte.${year}-12-31)`)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

function pickMonth(t: any, regime: Regime, year: number): number | null {
  if (regime === 'competencia') {
    return t.competencia_ano === year ? t.competencia_mes : null;
  }
  if (t.status !== 'PAGO' || !t.data_pagamento) return null;
  const [y, m] = t.data_pagamento.split('-').map(Number);
  return y === year ? m : null;
}

export function useAnnualBreakdown(
  year: number,
  tipo: Tipo,
  regime: Regime = 'competencia',
  groupBy: GroupBy = 'category'
) {
  return useQuery<AnnualBreakdown>({
    queryKey: ['annual-breakdown', year, tipo, regime, groupBy],
    queryFn: async () => {
      const rows = await fetchAll(year, tipo);
      const groupsMap = new Map<string, AnnualGroupRow>();
      const monthlyTotal = Array(12).fill(0);
      let total = 0;
      let totalCount = 0;

      for (const t of rows) {
        const m = pickMonth(t, regime, year);
        if (!m) continue;
        const v = regime === 'caixa' ? Number(t.valor_pago ?? t.valor) || 0 : Number(t.valor) || 0;

        let id = '__none__', name = 'Sem classificação', color: string | null = null;
        if (groupBy === 'category') {
          id = t.transaction_category_id || '__none__';
          name = t.transaction_categories?.name || 'Sem categoria';
          color = t.transaction_categories?.color || null;
        } else if (groupBy === 'cost_center') {
          id = t.cost_center_id || '__none__';
          name = t.cost_centers?.name || 'Sem centro de custo';
        } else {
          id = t.cliente_id || '__none__';
          name = t.recurring_clients?.name || 'Sem cliente';
        }

        let g = groupsMap.get(id);
        if (!g) {
          g = { groupId: id, groupName: name, color, monthly: Array(12).fill(0), total: 0, count: 0 };
          groupsMap.set(id, g);
        }
        g.monthly[m - 1] += v;
        g.total += v;
        g.count += 1;
        monthlyTotal[m - 1] += v;
        total += v;
        totalCount += 1;
      }

      const groups = Array.from(groupsMap.values()).sort((a, b) => b.total - a.total);
      return { groups, monthlyTotal, total, totalCount };
    },
    staleTime: 60_000,
  });
}
