// ============= HOOK ÚNICO PARA A VISÃO GERAL DE CONTAS =============
// Centraliza saldos, KPIs, rankings e drifts em um único ponto de verdade.
// Tudo deriva de computeAllBalances (mesma fórmula do SQL recalculate_account_balance).

import { useMemo } from 'react';
import {
  useAccounts,
  useAccountCategories,
  useAccountTransfers,
  useTransactionCategories,
  type Account,
  type AccountCategory,
} from '@/hooks/useFinancialConfig';
import { useTransactions } from '@/hooks/useTransactions';
import { computeAllBalances, type AccountBalance } from '@/lib/financial/balances';
import type { RawAccount, RawTransaction, RawTransfer } from '@/lib/financial/types';

export type AccountStatus = 'positiva' | 'negativa' | 'zerada' | 'alerta';

export interface AccountOverviewItem {
  account: Account;
  category?: AccountCategory;
  balance: AccountBalance;
  status: AccountStatus;
  hasDrift: boolean;
  needsReview: boolean;
  reviewReasons: string[];
  pctOfTotal: number;
  movementCount: number;     // transações PAGAS no período
  monthlyIn: number;
  monthlyOut: number;
  sparkline: { v: number }[]; // saldo acumulado dos últimos 6 meses
  linkedCategoriesCount: number;
}

export interface AccountsOverviewKPIs {
  consolidated: number;
  positiveSum: number;
  positiveCount: number;
  negativeSum: number;
  negativeCount: number;
  zeroedCount: number;
  alertCount: number;
  totalAccounts: number;
}

export interface AccountsOverviewRankings {
  topPositive: AccountOverviewItem[];
  topNegative: AccountOverviewItem[];
  idle: AccountOverviewItem[];          // 0 transações no período
  mostUsed: AccountOverviewItem[];      // mais transações no período
}

export interface UseAccountsOverviewParams {
  year: number;
  month: number | null; // null = ano completo
}

export interface UseAccountsOverviewResult {
  isLoading: boolean;
  items: AccountOverviewItem[];
  kpis: AccountsOverviewKPIs;
  rankings: AccountsOverviewRankings;
  driftCount: number;
}

export function useAccountsOverview({ year, month }: UseAccountsOverviewParams): UseAccountsOverviewResult {
  const { data: accounts, isLoading: la } = useAccounts();
  const { data: accountCategories } = useAccountCategories();
  const { data: transactions, isLoading: lt } = useTransactions({});
  const { data: transfers } = useAccountTransfers();
  const { data: txCategories } = useTransactionCategories();

  const isLoading = la || lt;

  // Contagem de categorias de transação vinculadas a cada conta
  const linkedCountByAccount = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of txCategories ?? []) {
      if (c.default_account_id) map.set(c.default_account_id, (map.get(c.default_account_id) ?? 0) + 1);
    }
    return map;
  }, [txCategories]);

  const result = useMemo<UseAccountsOverviewResult>(() => {
    const activeAccounts = (accounts ?? []).filter(a => a.active);
    const rawAccounts = activeAccounts as unknown as RawAccount[];
    const rawTx = (transactions ?? []) as unknown as RawTransaction[];
    const rawTransfers = (transfers ?? []) as unknown as RawTransfer[];

    const balances = computeAllBalances(rawAccounts, rawTx, rawTransfers);
    const consolidated = Array.from(balances.values()).reduce((s, b) => s + b.computedBalance, 0);

    const items: AccountOverviewItem[] = activeAccounts.map(acc => {
      const balance = balances.get(acc.id)!;
      const computed = balance.computedBalance;

      // Movimentações no período (somente PAGAS)
      let movementCount = 0;
      let monthlyIn = 0;
      let monthlyOut = 0;
      const monthly = Array(12).fill(0).map(() => ({ in: 0, out: 0 }));

      for (const t of rawTx) {
        if (t.account_id !== acc.id) continue;
        if (t.status !== 'PAGO') continue;
        if (t.competencia_ano !== year) continue;
        if (month !== null && t.competencia_mes !== month) continue;

        const v = Number(t.valor_pago ?? t.valor) || 0;
        movementCount += 1;
        if (t.tipo_movimento === 'ENTRADA') monthlyIn += v;
        else if (t.tipo_movimento === 'SAIDA') monthlyOut += v;
      }

      // Sparkline: saldo acumulado dos últimos 6 meses do ano selecionado
      // (independente do filtro de mês — sempre mostra tendência anual recente)
      for (const t of rawTx) {
        if (t.account_id !== acc.id) continue;
        if (t.status !== 'PAGO') continue;
        if (t.competencia_ano !== year) continue;
        const idx = (t.competencia_mes ?? 1) - 1;
        const v = Number(t.valor_pago ?? t.valor) || 0;
        if (t.tipo_movimento === 'ENTRADA') monthly[idx].in += v;
        else if (t.tipo_movimento === 'SAIDA') monthly[idx].out += v;
      }

      const refMonth = month ?? new Date().getMonth() + 1;
      const sparkStart = Math.max(0, refMonth - 6);
      let acc6 = 0;
      const sparkline = monthly.slice(sparkStart, refMonth).map(m => {
        acc6 += m.in - m.out;
        return { v: acc6 };
      });

      const linkedCategoriesCount = linkedCountByAccount.get(acc.id) ?? 0;
      const hasDrift = Math.abs(balance.drift) > 0.01;
      const reviewReasons: string[] = [];
      if (hasDrift) reviewReasons.push('Saldo divergente');
      if (!acc.category_id) reviewReasons.push('Sem categoria de conta');
      if (linkedCategoriesCount === 0) reviewReasons.push('Sem categorias de transação vinculadas');
      const needsReview = reviewReasons.length > 0;

      let status: AccountStatus;
      if (needsReview) status = 'alerta';
      else if (Math.abs(computed) < 0.01) status = 'zerada';
      else if (computed > 0) status = 'positiva';
      else status = 'negativa';

      const pctOfTotal = consolidated !== 0 ? (computed / Math.abs(consolidated)) * 100 : 0;
      const category = accountCategories?.find(c => c.id === acc.category_id);

      return {
        account: acc,
        category,
        balance,
        status,
        hasDrift,
        needsReview,
        reviewReasons,
        pctOfTotal,
        movementCount,
        monthlyIn,
        monthlyOut,
        sparkline,
        linkedCategoriesCount,
      };
    });

    const positive = items.filter(i => i.status === 'positiva' || (i.status === 'alerta' && i.balance.computedBalance > 0));
    const negative = items.filter(i => i.balance.computedBalance < -0.01);
    const zeroed = items.filter(i => Math.abs(i.balance.computedBalance) < 0.01 && i.status !== 'alerta');
    const alert = items.filter(i => i.needsReview);

    const kpis: AccountsOverviewKPIs = {
      consolidated,
      positiveSum: items.filter(i => i.balance.computedBalance > 0).reduce((s, i) => s + i.balance.computedBalance, 0),
      positiveCount: items.filter(i => i.balance.computedBalance > 0.01).length,
      negativeSum: negative.reduce((s, i) => s + i.balance.computedBalance, 0),
      negativeCount: negative.length,
      zeroedCount: zeroed.length,
      alertCount: alert.length,
      totalAccounts: items.length,
    };

    const sortedByBalance = [...items].sort((a, b) => b.balance.computedBalance - a.balance.computedBalance);
    const rankings: AccountsOverviewRankings = {
      topPositive: sortedByBalance.filter(i => i.balance.computedBalance > 0).slice(0, 5),
      topNegative: [...sortedByBalance].reverse().filter(i => i.balance.computedBalance < 0).slice(0, 5),
      idle: items.filter(i => i.movementCount === 0).slice(0, 5),
      mostUsed: [...items].sort((a, b) => b.movementCount - a.movementCount).filter(i => i.movementCount > 0).slice(0, 5),
    };

    return {
      isLoading,
      items,
      kpis,
      rankings,
      driftCount: items.filter(i => i.hasDrift).length,
    };
  }, [accounts, accountCategories, transactions, transfers, linkedCountByAccount, year, month, isLoading]);

  return result;
}
