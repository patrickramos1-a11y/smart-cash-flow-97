// ============= CÁLCULO ÚNICO DO DRE =============
// Consumido por Dashboard, DRECompleteView e Relatórios.
// Toda lógica de DRE passa por aqui — não recalcule em outro lugar.

import { effectivePaidValue, RawCostCenter, RawTransaction } from './types';

export type DREGroup =
  | 'RECEITA'
  | 'DEDUCAO'
  | 'CUSTO'
  | 'DESPESA_OP'
  | 'DESPESAS'
  | 'OUTRAS_DESP'
  | 'NAO_OPERACIONAL'
  | 'FORA_DRE';

export interface DRELineComputed {
  costCenterId: string;
  code: string | null;
  label: string;
  group: DREGroup;
  isExpense: boolean;
  order: number;
  valuesByMonth: Record<number, number>;
  total: number;
}

export interface DRETotals {
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;
  custosOperacionais: number;
  lucroBruto: number;
  despesasOperacionais: number;
  lucroOperacional: number;
  investimentos: number;
  resultadoFinal: number;
}

export interface DREIndicators {
  margemBruta: number;
  margemLiquida: number;
  margemOperacional: number;
  ebitda: number;
}

export interface DREResult {
  year: number;
  lines: DRELineComputed[];
  grouped: Record<DREGroup, DRELineComputed[]>;
  totals: DRETotals;
  indicators: DREIndicators;
}

/**
 * Calcula o DRE completo a partir de cost_centers e transações PAGAS do ano.
 * Apenas transações com status='PAGO' e cost_center_id definido entram.
 */
export function computeDRE(
  year: number,
  costCenters: RawCostCenter[],
  transactions: RawTransaction[],
): DREResult {
  // 1) Acumular valor por cost_center / mês
  const valuesByCC: Record<string, Record<number, number>> = {};
  for (const t of transactions) {
    if (t.status !== 'PAGO') continue;
    if (t.competencia_ano !== year) continue;
    const ccId = t.cost_center_id;
    if (!ccId) continue;
    const v = effectivePaidValue(t);
    if (!valuesByCC[ccId]) valuesByCC[ccId] = {};
    valuesByCC[ccId][t.competencia_mes] = (valuesByCC[ccId][t.competencia_mes] || 0) + v;
  }

  // 2) Construir linhas + agrupar
  const lines: DRELineComputed[] = [];
  const grouped: Record<DREGroup, DRELineComputed[]> = {
    RECEITA: [], DEDUCAO: [], CUSTO: [], DESPESA_OP: [], DESPESAS: [],
    OUTRAS_DESP: [], NAO_OPERACIONAL: [], FORA_DRE: [],
  };

  let receitaBruta = 0;
  let deducoes = 0;
  let custosOperacionais = 0;
  let despesasOperacionais = 0;
  let investimentos = 0;

  const sorted = [...costCenters].filter(cc => cc.active).sort((a, b) => a.dre_order - b.dre_order);
  for (const cc of sorted) {
    const valuesByMonth = valuesByCC[cc.id] || {};
    const total = Object.values(valuesByMonth).reduce((s, v) => s + v, 0);
    const group = (cc.dre_group as DREGroup) || 'FORA_DRE';

    const line: DRELineComputed = {
      costCenterId: cc.id,
      code: cc.code,
      label: cc.dre_label || cc.name,
      group,
      isExpense: cc.is_expense,
      order: cc.dre_order,
      valuesByMonth,
      total,
    };
    lines.push(line);
    (grouped[group] ||= []).push(line);

    switch (group) {
      case 'RECEITA': receitaBruta += total; break;
      case 'DEDUCAO': deducoes += total; break;
      case 'CUSTO': custosOperacionais += total; break;
      case 'DESPESA_OP':
      case 'DESPESAS':
      case 'OUTRAS_DESP':
        despesasOperacionais += total; break;
      case 'NAO_OPERACIONAL': investimentos += total; break;
      case 'FORA_DRE': /* ignored from DRE */ break;
    }
  }

  const receitaLiquida = receitaBruta - deducoes;
  const lucroBruto = receitaLiquida - custosOperacionais;
  const lucroOperacional = lucroBruto - despesasOperacionais;
  const resultadoFinal = lucroOperacional - investimentos;

  const totals: DRETotals = {
    receitaBruta, deducoes, receitaLiquida, custosOperacionais,
    lucroBruto, despesasOperacionais, lucroOperacional, investimentos, resultadoFinal,
  };

  const indicators: DREIndicators = {
    margemBruta: receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0,
    margemLiquida: receitaBruta > 0 ? (lucroOperacional / receitaBruta) * 100 : 0,
    margemOperacional: receitaLiquida > 0 ? (lucroOperacional / receitaLiquida) * 100 : 0,
    ebitda: lucroOperacional, // simplificado — sem depreciação ainda
  };

  return { year, lines, grouped, totals, indicators };
}
