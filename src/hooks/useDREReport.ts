import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  // Lines grouped by DRE section for the view
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

// DRE groups that compose operational expenses
const DESPESA_OP_GROUPS = ['DESPESA_OP', 'DESPESAS'];
const EXCLUDED_FROM_OPERATIONAL = ['NAO_OPERACIONAL', 'FORA_DRE'];
const EXCLUDED_FROM_DRE = ['FORA_DRE'];

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

      // Calculate values by cost center and month
      const valuesByCostCenter: Record<string, Record<number, number>> = {};
      
      transactions?.forEach(t => {
        const ccId = t.cost_center_id;
        if (!ccId) return;
        
        if (!valuesByCostCenter[ccId]) {
          valuesByCostCenter[ccId] = {};
        }
        
        const month = t.competencia_mes;
        const value = Number(t.valor_pago) || Number(t.valor) || 0;
        valuesByCostCenter[ccId][month] = (valuesByCostCenter[ccId][month] || 0) + value;
      });

      // Build DRE lines and accumulate totals
      const lines: DRELine[] = [];
      let receitaBruta = 0;
      let deducoes = 0;
      let custosOperacionais = 0;
      let despesasOperacionais = 0;
      let investimentos = 0;

      // Group lines by section
      const groupedLines = {
        receita: [] as DRELine[],
        deducoes: [] as DRELine[],
        custos: [] as DRELine[],
        despesasOp: [] as DRELine[],
        outrasDespesas: [] as DRELine[],
        naoOperacional: [] as DRELine[],
        foraDre: [] as DRELine[],
      };

      // Per-group totals for KPIs
      const groupTotals: Record<string, number> = {};

      costCenters?.forEach(cc => {
        const values = valuesByCostCenter[cc.id] || {};
        const total = Object.values(values).reduce((sum, v) => sum + v, 0);

        const line: DRELine = {
          id: cc.id,
          order: cc.dre_order,
          label: cc.dre_label || cc.name,
          type: 'category',
          costCenterId: cc.id,
          dreGroup: cc.dre_group,
          isExpense: cc.is_expense,
          values,
          total,
        };

        lines.push(line);
        groupTotals[cc.code || cc.name] = total;

        // Accumulate totals based on DRE group
        switch (cc.dre_group) {
          case 'RECEITA':
            receitaBruta += total;
            groupedLines.receita.push(line);
            break;
          case 'DEDUCAO':
            deducoes += total;
            groupedLines.deducoes.push(line);
            break;
          case 'CUSTO':
            custosOperacionais += total;
            groupedLines.custos.push(line);
            break;
          case 'DESPESA_OP':
          case 'DESPESAS':
            despesasOperacionais += total;
            groupedLines.despesasOp.push(line);
            break;
          case 'OUTRAS_DESP':
            despesasOperacionais += total;
            groupedLines.outrasDespesas.push(line);
            break;
          case 'NAO_OPERACIONAL':
            investimentos += total;
            groupedLines.naoOperacional.push(line);
            break;
          case 'FORA_DRE':
            groupedLines.foraDre.push(line);
            break;
        }
      });

      const receitaLiquida = receitaBruta - deducoes;
      const lucroBruto = receitaLiquida - custosOperacionais;
      const lucroOperacional = lucroBruto - despesasOperacionais;
      const resultadoFinal = lucroOperacional - investimentos;

      // KPI calculations
      const techTotal = groupTotals['TECNOLOGIA'] || 0;
      const pessoalTotal = groupTotals['DESPESA_PESSOAL'] || 0;
      const adminTotal = groupTotals['DESPESA_ADM'] || 0;

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
          investimentos,
          resultadoFinal,
        },
        indicators: {
          margemBruta: receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0,
          margemLiquida: receitaBruta > 0 ? (lucroOperacional / receitaBruta) * 100 : 0,
          margemOperacional: receitaLiquida > 0 ? (lucroOperacional / receitaLiquida) * 100 : 0,
          custoTecnologia: receitaBruta > 0 ? (techTotal / receitaBruta) * 100 : 0,
          despesasPessoais: receitaBruta > 0 ? (pessoalTotal / receitaBruta) * 100 : 0,
          despesasAdmin: receitaBruta > 0 ? (adminTotal / receitaBruta) * 100 : 0,
          investimentoSobreReceita: receitaBruta > 0 ? (investimentos / receitaBruta) * 100 : 0,
          ebitda: lucroOperacional, // Simplified - no depreciation data yet
        },
        groupedLines,
      };
    },
  });
}

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

      transactions?.forEach(t => {
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
        total: transactions?.reduce((sum, t) => sum + (Number(t.valor_pago) || Number(t.valor) || 0), 0) || 0,
      };
    },
  });
}
