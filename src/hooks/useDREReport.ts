import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DRELine {
  id: string;
  order: number;
  label: string;
  type: 'header' | 'category' | 'subtotal' | 'deduction' | 'result';
  costCenterId?: string;
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
  };
  indicators: {
    margemBruta: number;
    margemLiquida: number;
    margemOperacional: number;
  };
}

export function useDREData(year: number) {
  return useQuery({
    queryKey: ['dre-data', year],
    queryFn: async (): Promise<DREData> => {
      // Fetch cost centers
      const { data: costCenters, error: ccError } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('active', true)
        .order('dre_order');

      if (ccError) throw ccError;

      // Fetch transactions for the year
      const { data: transactions, error: tError } = await supabase
        .from('transactions')
        .select('*')
        .eq('competencia_ano', year)
        .eq('status', 'PAGO');

      if (tError) throw tError;

      // Calculate values by cost center and month
      const valuesByCostCenter: Record<string, Record<number, number>> = {};
      
      transactions?.forEach(t => {
        const ccId = t.cost_center_id || t.centro_custo_id;
        if (!ccId) return;
        
        if (!valuesByCostCenter[ccId]) {
          valuesByCostCenter[ccId] = {};
        }
        
        const month = t.competencia_mes;
        const value = Number(t.valor_pago) || Number(t.valor) || 0;
        valuesByCostCenter[ccId][month] = (valuesByCostCenter[ccId][month] || 0) + value;
      });

      // Build DRE lines
      const lines: DRELine[] = [];
      let receitaBruta = 0;
      let deducoes = 0;
      let custosOperacionais = 0;
      let despesasOperacionais = 0;

      costCenters?.forEach(cc => {
        const values = valuesByCostCenter[cc.id] || {};
        const total = Object.values(values).reduce((sum, v) => sum + v, 0);

        // Accumulate totals based on DRE group
        if (cc.dre_group === 'RECEITA_BRUTA') {
          receitaBruta += total;
        } else if (cc.dre_group === 'DEDUCOES') {
          deducoes += total;
        } else if (cc.dre_group === 'CUSTOS_OPERACIONAIS') {
          custosOperacionais += total;
        } else if (cc.is_expense) {
          despesasOperacionais += total;
        }

        lines.push({
          id: cc.id,
          order: cc.dre_order,
          label: cc.dre_label || cc.name,
          type: cc.dre_group === 'RECEITA_BRUTA' ? 'header' : 'category',
          costCenterId: cc.id,
          isExpense: cc.is_expense,
          values,
          total,
        });
      });

      const receitaLiquida = receitaBruta - deducoes;
      const lucroBruto = receitaLiquida - custosOperacionais;
      const lucroOperacional = lucroBruto - despesasOperacionais;

      const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

      return {
        lines,
        months,
        year,
        totals: {
          receitaBruta,
          deducoes,
          receitaLiquida,
          custosOperacionais,
          lucroBruto,
          despesasOperacionais,
          lucroOperacional,
        },
        indicators: {
          margemBruta: receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0,
          margemLiquida: receitaBruta > 0 ? (lucroOperacional / receitaBruta) * 100 : 0,
          margemOperacional: receitaLiquida > 0 ? (lucroOperacional / receitaLiquida) * 100 : 0,
        },
      };
    },
  });
}

export function useDREMonthly(month: number, year: number) {
  return useQuery({
    queryKey: ['dre-monthly', month, year],
    queryFn: async () => {
      // Fetch cost centers
      const { data: costCenters, error: ccError } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('active', true)
        .order('dre_order');

      if (ccError) throw ccError;

      // Fetch transactions for the month
      const { data: transactions, error: tError } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_categories (
            id,
            name,
            cost_center_id
          )
        `)
        .eq('competencia_mes', month)
        .eq('competencia_ano', year)
        .eq('status', 'PAGO');

      if (tError) throw tError;

      // Group by cost center
      const valuesByCostCenter: Record<string, { total: number; categories: Record<string, number> }> = {};
      
      transactions?.forEach(t => {
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

      return {
        costCenters: costCenters || [],
        valuesByCostCenter,
        month,
        year,
      };
    },
  });
}

export function useCostCenterAnalysis(year: number) {
  return useQuery({
    queryKey: ['cost-center-analysis', year],
    queryFn: async () => {
      // Fetch transactions with categories
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_categories (
            id,
            name,
            cost_center_id,
            expense_type
          ),
          cost_centers (
            id,
            name,
            dre_group,
            dre_label
          )
        `)
        .eq('competencia_ano', year)
        .eq('tipo_movimento', 'SAIDA')
        .eq('status', 'PAGO');

      if (error) throw error;

      // Group by category
      const byCategory: Record<string, { name: string; total: number; count: number }> = {};
      const byCostCenter: Record<string, { name: string; total: number; count: number }> = {};
      const byMonth: Record<number, number> = {};

      transactions?.forEach(t => {
        const value = Number(t.valor_pago) || Number(t.valor) || 0;
        
        // By category
        const catName = t.transaction_categories?.name || 'Outros';
        if (!byCategory[catName]) {
          byCategory[catName] = { name: catName, total: 0, count: 0 };
        }
        byCategory[catName].total += value;
        byCategory[catName].count++;

        // By cost center
        const ccName = t.cost_centers?.name || t.transaction_categories?.name || 'Outros';
        if (!byCostCenter[ccName]) {
          byCostCenter[ccName] = { name: ccName, total: 0, count: 0 };
        }
        byCostCenter[ccName].total += value;
        byCostCenter[ccName].count++;

        // By month
        byMonth[t.competencia_mes] = (byMonth[t.competencia_mes] || 0) + value;
      });

      return {
        byCategory: Object.values(byCategory).sort((a, b) => b.total - a.total),
        byCostCenter: Object.values(byCostCenter).sort((a, b) => b.total - a.total),
        byMonth,
        total: transactions?.reduce((sum, t) => sum + (Number(t.valor_pago) || Number(t.valor) || 0), 0) || 0,
      };
    },
  });
}
