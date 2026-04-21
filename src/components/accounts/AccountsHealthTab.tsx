import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, RefreshCw, Tags } from 'lucide-react';
import {
  useAccounts, useTransactionCategories, useRecalculateAccountBalance,
} from '@/hooks/useFinancialConfig';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccountTransfers } from '@/hooks/useFinancialConfig';
import { computeAllBalances } from '@/lib/financial/balances';
import type { RawAccount, RawTransaction, RawTransfer } from '@/lib/financial/types';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function AccountsHealthTab() {
  const { data: accounts } = useAccounts();
  const { data: categories } = useTransactionCategories();
  const { data: transactions } = useTransactions({});
  const { data: transfers } = useAccountTransfers();
  const recalc = useRecalculateAccountBalance();

  const orphanCategories = useMemo(
    () => (categories ?? []).filter(c => c.active && !c.default_account_id),
    [categories],
  );

  const accountsWithoutCategories = useMemo(() => {
    if (!accounts) return [];
    const linkedSet = new Set((categories ?? []).filter(c => c.default_account_id).map(c => c.default_account_id!));
    return accounts.filter(a => a.active && !linkedSet.has(a.id));
  }, [accounts, categories]);

  const drifts = useMemo(() => {
    if (!accounts || !transactions || !transfers) return [];
    const rawAccs: RawAccount[] = accounts.map(a => ({
      id: a.id, name: a.name,
      initial_balance: Number(a.initial_balance ?? 0),
      current_balance: Number(a.current_balance ?? 0),
      category_id: a.category_id ?? null, active: a.active,
    }));
    const rawTx: RawTransaction[] = transactions.map((t: any) => ({
      id: t.id, tipo_movimento: t.tipo_movimento, natureza: t.natureza, status: t.status,
      valor: Number(t.valor), valor_pago: t.valor_pago != null ? Number(t.valor_pago) : null,
      data_pagamento: t.data_pagamento ?? null, data_vencimento: t.data_vencimento,
      competencia_mes: t.competencia_mes, competencia_ano: t.competencia_ano,
      account_id: t.account_id ?? null, transaction_category_id: t.transaction_category_id ?? null,
      cost_center_id: t.cost_center_id ?? null, entity_id: t.entity_id ?? null, cliente_id: t.cliente_id ?? null,
    }));
    const rawTr: RawTransfer[] = transfers.map(t => ({
      id: t.id, from_account_id: t.from_account_id, to_account_id: t.to_account_id, amount: Number(t.amount),
    }));
    const map = computeAllBalances(rawAccs, rawTx, rawTr);
    return Array.from(map.values()).filter(b => Math.abs(b.drift) > 0.01);
  }, [accounts, transactions, transfers]);

  const allHealthy = orphanCategories.length === 0 && accountsWithoutCategories.length === 0 && drifts.length === 0;

  return (
    <div className="space-y-4">
      {allHealthy && (
        <Card className="border-income/40 bg-income/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-income" />
            <p className="text-sm font-medium">Tudo certo! Nenhuma inconsistência detectada nas contas.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Divergência de saldo (drift)
            <Badge variant={drifts.length ? 'destructive' : 'secondary'} className="text-[10px]">{drifts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {drifts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Todos os saldos das contas batem com o calculado a partir das transações pagas e transferências.</p>
          ) : (
            <div className="space-y-2">
              {drifts.map(d => (
                <div key={d.accountId} className="flex items-center justify-between p-2.5 border rounded-md text-xs">
                  <div>
                    <p className="font-medium">{d.accountName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Armazenado: {formatCurrency(d.storedBalance)} · Calculado: {formatCurrency(d.computedBalance)} · Drift: {formatCurrency(d.drift)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => recalc.mutate(d.accountId)} disabled={recalc.isPending}>
                    <RefreshCw className="w-3 h-3 mr-1" /> Reconciliar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" /> Contas sem categorias vinculadas
            <Badge variant={accountsWithoutCategories.length ? 'destructive' : 'secondary'} className="text-[10px]">{accountsWithoutCategories.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accountsWithoutCategories.length === 0 ? (
            <p className="text-xs text-muted-foreground">Toda conta ativa tem ao menos uma categoria de transação apontando para ela.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {accountsWithoutCategories.map(a => (
                <Badge key={a.id} variant="outline" className="text-[11px]">{a.name}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tags className="w-4 h-4 text-warning" /> Categorias órfãs (sem conta padrão)
            <Badge variant={orphanCategories.length ? 'destructive' : 'secondary'} className="text-[10px]">{orphanCategories.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orphanCategories.length === 0 ? (
            <p className="text-xs text-muted-foreground">Toda categoria ativa tem uma conta padrão definida.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {orphanCategories.map(c => (
                <Badge key={c.id} variant="outline" className="text-[11px] gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || 'currentColor' }} />
                  {c.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
