// ============= HOOK DE DRE — usa lib centralizada =============
// Toda a lógica de cálculo vive em src/lib/financial/dre.ts.
// Este hook só busca dados crus e delega para computeDRE().

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeDRE, type DREResult } from '@/lib/financial/dre';
import type { RawCostCenter, RawTransaction } from '@/lib/financial/types';

export interface DRELine {
  id: string;
  order: number;
  label: string;
  type: 'header' | 'category' | 'subtotal' | 'deduction' | 'result';
  costCenterId?: string;
  dreGroup?: string;
  isExpense: boolean;
  values: Record<number, number>; // month -> value
  total: number;
  percentage?: number;
  children?: DRELine[];
}

export interface DREData {
  lines: DRELine[];
  months: number[];
  year: number;
  totals: {
    receitaBruta: number;
    deducoes: number;
    receitaLiquida: number;
    custosOperacionais: number;
    lucroBruto: number;
    despesasOperacionais: number;
    lucroOperacional: number;
    investimentos: number;
    resultadoFinal: number;
  };
  indicators: {
    margemBruta: number;
    margemLiquida: number;
    margemOperacional: number;
    custoTecnologia: number;
    despesasPessoais: number;
    despesasAdmin: number;
    investimentoSobreReceita: number;
    ebitda: number;
  };
  groupedLines: {
    receita: DRELine[];
    deducoes: DRELine[];
    custos: DRELine[];
    despesasOp: DRELine[];
    outrasDespesas: DRELine[];
    naoOperacional: DRELine[];
    foraDre: DRELine[];
  };
}

function adaptResult(result: DREResult, byCode: Record<string, number>): DREData {
  const toLine = (l: typeof result.lines[number]): DRELine => ({
    id: l.costCenterId,
    order: l.order,
    label: l.label,
    type: 'category',
    costCenterId: l.costCenterId,
    dreGroup: l.group,
    isExpense: l.isExpense,
    values: l.valuesByMonth,
    total: l.total,
  });

  const groupedLines = {
    receita: result.grouped.RECEITA.map(toLine),
    deducoes: result.grouped.DEDUCAO.map(toLine),
    custos: result.grouped.CUSTO.map(toLine),
    despesasOp: [...result.grouped.DESPESA_OP, ...result.grouped.DESPESAS].map(toLine),
    outrasDespesas: result.grouped.OUTRAS_DESP.map(toLine),
    naoOperacional: result.grouped.NAO_OPERACIONAL.map(toLine),
    foraDre: result.grouped.FORA_DRE.map(toLine),
  };

  const techTotal = byCode['TECNOLOGIA'] || 0;
  const pessoalTotal = byCode['DESPESA_PESSOAL'] || 0;
  const adminTotal = byCode['DESPESA_ADM'] || 0;
  const { receitaBruta, investimentos } = result.totals;

  return {
    lines: result.lines.map(toLine),
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    year: result.year,
    totals: result.totals,
    indicators: {
      ...result.indicators,
      custoTecnologia: receitaBruta > 0 ? (techTotal / receitaBruta) * 100 : 0,
      despesasPessoais: receitaBruta > 0 ? (pessoalTotal / receitaBruta) * 100 : 0,
      despesasAdmin: receitaBruta > 0 ? (adminTotal / receitaBruta) * 100 : 0,
      investimentoSobreReceita: receitaBruta > 0 ? (investimentos / receitaBruta) * 100 : 0,
    },
    groupedLines,
  };
}

export function useDREData(year: number) {
  return useQuery({
    queryKey: ['dre-data', year],
    queryFn: async (): Promise<DREData> => {
      const { data: costCenters, error: ccError } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('active', true)
        .order('dre_order');

      if (ccError) throw ccError;

      const { data: transactions, error: tError } = await supabase
        .from('transactions')
        .select('*')
        .eq('competencia_ano', year)
        .eq('status', 'PAGO');

      if (tError) throw tError;

      const result = computeDRE(
        year,
        (costCenters || []) as RawCostCenter[],
        (transactions || []) as unknown as RawTransaction[],
      );

      // Map by code for KPI breakdowns
      const byCode: Record<string, number> = {};
      (costCenters || []).forEach((cc: any) => {
        const line = result.lines.find(l => l.costCenterId === cc.id);
        if (line) byCode[cc.code || cc.name] = line.total;
      });

      return adaptResult(result, byCode);
    },
  });
}

// Monthly breakdown still needs a category-level join, kept as-is for analytics views
export function useDREMonthly(month: number, year: number) {
  return useQuery({
    queryKey: ['dre-monthly', month, year],
    queryFn: async () => {
      const { data: costCenters, error: ccError } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('active', true)
        .order('dre_order');

      if (ccError) throw ccError;

      const { data: transactions, error: tError } = await supabase
        .from('transactions')
        .select(`*, transaction_categories (id, name, cost_center_id)`)
        .eq('competencia_mes', month)
        .eq('competencia_ano', year)
        .eq('status', 'PAGO');

      if (tError) throw tError;

      const valuesByCostCenter: Record<string, { total: number; categories: Record<string, number> }> = {};

      transactions?.forEach((t: any) => {
        const ccId = t.cost_center_id || t.transaction_categories?.cost_center_id;
        if (!ccId) return;

        if (!valuesByCostCenter[ccId]) {
          valuesByCostCenter[ccId] = { total: 0, categories: {} };
        }

        const value = Number(t.valor_pago) || Number(t.valor) || 0;
        valuesByCostCenter[ccId].total += value;

        const catName = t.transaction_categories?.name || 'Outros';
        valuesByCostCenter[ccId].categories[catName] =
          (valuesByCostCenter[ccId].categories[catName] || 0) + value;
      });

      return { costCenters: costCenters || [], valuesByCostCenter, month, year };
    },
  });
}

export function useCostCenterAnalysis(year: number) {
  return useQuery({
    queryKey: ['cost-center-analysis', year],
    queryFn: async () => {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`*, transaction_categories (id, name, cost_center_id, expense_type), cost_centers (id, name, dre_group, dre_label)`)
        .eq('competencia_ano', year)
        .eq('tipo_movimento', 'SAIDA')
        .eq('status', 'PAGO');

      if (error) throw error;

      const byCategory: Record<string, { name: string; total: number; count: number }> = {};
      const byCostCenter: Record<string, { name: string; total: number; count: number }> = {};
      const byMonth: Record<number, number> = {};

      transactions?.forEach((t: any) => {
        const value = Number(t.valor_pago) || Number(t.valor) || 0;
        const catName = t.transaction_categories?.name || 'Outros';
        if (!byCategory[catName]) byCategory[catName] = { name: catName, total: 0, count: 0 };
        byCategory[catName].total += value;
        byCategory[catName].count++;

        const ccName = t.cost_centers?.name || t.transaction_categories?.name || 'Outros';
        if (!byCostCenter[ccName]) byCostCenter[ccName] = { name: ccName, total: 0, count: 0 };
        byCostCenter[ccName].total += value;
        byCostCenter[ccName].count++;

        byMonth[t.competencia_mes] = (byMonth[t.competencia_mes] || 0) + value;
      });

      return {
        byCategory: Object.values(byCategory).sort((a, b) => b.total - a.total),
        byCostCenter: Object.values(byCostCenter).sort((a, b) => b.total - a.total),
        byMonth,
        total: transactions?.reduce((sum: number, t: any) => sum + (Number(t.valor_pago) || Number(t.valor) || 0), 0) || 0,
      };
    },
  });
}
