// ============= CÁLCULO ÚNICO DE SALDO DE CONTA =============
// Espelha exatamente a função SQL public.recalculate_account_balance.
// Use SEMPRE esta função no frontend para evitar divergências entre telas.

import { effectivePaidValue, RawAccount, RawTransaction, RawTransfer } from './types';

export interface AccountBalance {
  accountId: string;
  accountName: string;
  initialBalance: number;
  paidIn: number;       // entradas pagas
  paidOut: number;      // saídas pagas (positivo)
  transferIn: number;
  transferOut: number;
  computedBalance: number;
  storedBalance: number;
  drift: number;        // computed - stored (deve ser ~0 após reprocessamento)
}

/**
 * Calcula o saldo atual de UMA conta a partir das transações pagas e transferências.
 * Regra: initial + (entradas pagas) - (saídas pagas) + (transfer_in) - (transfer_out).
 */
export function computeAccountBalance(
  account: RawAccount,
  transactions: RawTransaction[],
  transfers: RawTransfer[],
): AccountBalance {
  let paidIn = 0;
  let paidOut = 0;

  for (const t of transactions) {
    if (t.account_id !== account.id) continue;
    if (t.status !== 'PAGO') continue;
    const v = effectivePaidValue(t);
    if (t.tipo_movimento === 'ENTRADA') paidIn += v;
    else if (t.tipo_movimento === 'SAIDA') paidOut += v;
  }

  let transferIn = 0;
  let transferOut = 0;
  for (const tr of transfers) {
    if (tr.to_account_id === account.id) transferIn += Number(tr.amount) || 0;
    if (tr.from_account_id === account.id) transferOut += Number(tr.amount) || 0;
  }

  const computedBalance =
    Number(account.initial_balance || 0) + paidIn - paidOut + transferIn - transferOut;

  return {
    accountId: account.id,
    accountName: account.name,
    initialBalance: Number(account.initial_balance || 0),
    paidIn,
    paidOut,
    transferIn,
    transferOut,
    computedBalance,
    storedBalance: Number(account.current_balance || 0),
    drift: computedBalance - Number(account.current_balance || 0),
  };
}

/**
 * Calcula o saldo de TODAS as contas em um único passe (O(n+m)).
 */
export function computeAllBalances(
  accounts: RawAccount[],
  transactions: RawTransaction[],
  transfers: RawTransfer[],
): Map<string, AccountBalance> {
  const result = new Map<string, AccountBalance>();
  for (const acc of accounts) {
    result.set(acc.id, computeAccountBalance(acc, transactions, transfers));
  }
  return result;
}

/**
 * Soma o saldo de várias contas (ex: total de uma categoria de conta).
 */
export function sumBalances(balances: AccountBalance[]): number {
  return balances.reduce((sum, b) => sum + b.computedBalance, 0);
}
