// ============= FONTE ÚNICA DE TIPOS FINANCEIROS =============
// Espelha o esquema do banco após a refatoração (somente UUIDs).
// Usado por src/lib/financial/balances.ts e dre.ts.

export type TipoMovimento = 'ENTRADA' | 'SAIDA';
export type TransactionStatus = 'EM_ABERTO' | 'PAGO' | 'ATRASADO';
export type Natureza = 'RECORRENTE' | 'AVULSA';

export interface RawTransaction {
  id: string;
  tipo_movimento: TipoMovimento;
  natureza: Natureza;
  status: TransactionStatus;
  valor: number;
  valor_pago: number | null;
  data_pagamento: string | null;
  data_vencimento: string;
  competencia_mes: number;
  competencia_ano: number;
  account_id: string | null;
  transaction_category_id: string | null;
  cost_center_id: string | null;
  entity_id: string | null;
  cliente_id: string | null;
}

export interface RawAccount {
  id: string;
  name: string;
  initial_balance: number;
  current_balance: number;
  category_id: string | null;
  active: boolean;
}

export interface RawTransfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
}

export interface RawCostCenter {
  id: string;
  name: string;
  code: string | null;
  dre_group: string;
  dre_label: string;
  dre_order: number;
  is_expense: boolean;
  active: boolean;
}

// Valor pago efetivo de uma transação (fallback no valor previsto se não houver valor_pago)
export function effectivePaidValue(t: Pick<RawTransaction, 'valor' | 'valor_pago'>): number {
  return Number(t.valor_pago ?? t.valor) || 0;
}
