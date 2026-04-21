import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDownToLine, ArrowUpFromLine, Building2, Repeat, Receipt, Users, Layers } from 'lucide-react';
import { useAccounts, useCostCenters, useTransactionCategories } from '@/hooks/useFinancialConfig';
import { useTransactions } from '@/hooks/useTransactions';
import { useFixedExpenses } from '@/hooks/useFixedExpenses';
import { useFinancialEntities } from '@/hooks/useFinancialEntities';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  selectedAccountId: string | null;
  selectedYear: number;
}

export function AccountsCompositionTab({ selectedAccountId, selectedYear }: Props) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useTransactionCategories();
  const { data: costCenters } = useCostCenters();
  const { data: transactions } = useTransactions({});
  const { data: fixedExpenses } = useFixedExpenses();
  const { data: entities } = useFinancialEntities();

  const account = accounts?.find(a => a.id === selectedAccountId);

  // Considera apenas transações EFETIVADAS (PAGO) para refletir o que realmente afeta o saldo da conta
  const yearTx = useMemo(
    () => (transactions ?? []).filter(t =>
      t.account_id === selectedAccountId &&
      t.competencia_ano === selectedYear &&
      t.status === 'PAGO',
    ),
    [transactions, selectedAccountId, selectedYear],
  );

  const valueOf = (t: typeof yearTx[number]) => Number(t.valor_pago ?? t.valor) || 0;

  const linkedCategories = useMemo(
    () => (categories ?? []).filter(c => c.default_account_id === selectedAccountId),
    [categories, selectedAccountId],
  );

  const txByCategory = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const t of yearTx) {
      const key = t.transaction_category_id || 'sem';
      const cur = map.get(key) || { count: 0, total: 0 };
      cur.count += 1;
      cur.total += valueOf(t);
      map.set(key, cur);
    }
    return map;
  }, [yearTx]);

  const topCostCenters = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of yearTx) {
      if (!t.cost_center_id) continue;
      map.set(t.cost_center_id, (map.get(t.cost_center_id) ?? 0) + valueOf(t));
    }
    return Array.from(map.entries())
      .map(([id, total]) => ({ id, total, name: costCenters?.find(c => c.id === id)?.name ?? 'Sem nome' }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [yearTx, costCenters]);

  const topEntities = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of yearTx) {
      if (!t.entity_id) continue;
      map.set(t.entity_id, (map.get(t.entity_id) ?? 0) + valueOf(t));
    }
    return Array.from(map.entries())
      .map(([id, total]) => ({ id, total, name: entities?.find(e => e.id === id)?.name ?? 'Sem nome' }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [yearTx, entities]);

  const linkedFixedExpenses = useMemo(
    () => (fixedExpenses ?? []).filter(f => f.account_id === selectedAccountId && f.active),
    [fixedExpenses, selectedAccountId],
  );

  if (!selectedAccountId || !account) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Selecione uma conta na aba <strong>Visão Geral</strong> para ver sua composição detalhada.
        </CardContent>
      </Card>
    );
  }

  const entradas = linkedCategories.filter(c => c.type === 'ENTRADA');
  const saidas = linkedCategories.filter(c => c.type === 'SAIDA');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4" /> Composição da conta: {account.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-income">
              <ArrowDownToLine className="w-4 h-4" /> Categorias de Entrada ({entradas.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {entradas.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma categoria de entrada vinculada.</p>}
              {entradas.map(c => {
                const stats = txByCategory.get(c.id);
                return (
                  <Badge key={c.id} variant="outline" className="text-[11px] gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || 'currentColor' }} />
                    {c.name}
                    {stats && <span className="text-muted-foreground">· {stats.count}× · {formatCurrency(stats.total)}</span>}
                  </Badge>
                );
              })}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-expense">
              <ArrowUpFromLine className="w-4 h-4" /> Categorias de Saída ({saidas.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {saidas.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma categoria de saída vinculada.</p>}
              {saidas.map(c => {
                const stats = txByCategory.get(c.id);
                return (
                  <Badge key={c.id} variant="outline" className="text-[11px] gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || 'currentColor' }} />
                    {c.name}
                    {stats && <span className="text-muted-foreground">· {stats.count}× · {formatCurrency(stats.total)}</span>}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Top Centros de Custo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {topCostCenters.length === 0 && <p className="text-xs text-muted-foreground">Sem dados em {selectedYear}.</p>}
            {topCostCenters.map(cc => (
              <div key={cc.id} className="flex items-center justify-between text-xs">
                <span className="truncate">{cc.name}</span>
                <span className="font-medium">{formatCurrency(cc.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4" /> Despesas Fixas atreladas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {linkedFixedExpenses.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma despesa fixa apontando para esta conta.</p>}
            {linkedFixedExpenses.slice(0, 6).map(f => (
              <div key={f.id} className="flex items-center justify-between text-xs">
                <span className="truncate">{f.nome}</span>
                <span className="font-medium text-expense">{formatCurrency(Number(f.valor))}</span>
              </div>
            ))}
            {linkedFixedExpenses.length > 6 && (
              <p className="text-[10px] text-muted-foreground">+{linkedFixedExpenses.length - 6} outras</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" /> Top Entidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {topEntities.length === 0 && <p className="text-xs text-muted-foreground">Sem dados em {selectedYear}.</p>}
            {topEntities.map(e => (
              <div key={e.id} className="flex items-center justify-between text-xs">
                <span className="truncate">{e.name}</span>
                <span className="font-medium">{formatCurrency(e.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Repeat className="w-4 h-4" /> Resumo do ano em {selectedYear} <span className="text-[11px] font-normal text-muted-foreground">(somente efetivados)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Lançamentos pagos</p>
              <p className="font-semibold">{yearTx.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entradas efetivadas</p>
              <p className="font-semibold text-income">
                {formatCurrency(yearTx.filter(t => t.tipo_movimento === 'ENTRADA').reduce((s, t) => s + valueOf(t), 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saídas efetivadas</p>
              <p className="font-semibold text-expense">
                {formatCurrency(yearTx.filter(t => t.tipo_movimento === 'SAIDA').reduce((s, t) => s + valueOf(t), 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo Atual</p>
              <p className="font-semibold">{formatCurrency(Number(account.current_balance))}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
