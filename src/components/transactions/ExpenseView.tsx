import { useState } from 'react';
import { Building2, Zap, TrendingDown, PieChart } from 'lucide-react';
import { TransactionTable } from './TransactionTable';
import { mockTransactions, formatCurrency } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function ExpenseView() {
  const [viewMode, setViewMode] = useState<'all' | 'fixed' | 'variable'>('all');

  const expenseTransactions = mockTransactions.filter(t => t.nature === 'SAIDA');
  const fixedExpenses = expenseTransactions
    .filter(t => t.expenseType === 'FIXA')
    .reduce((sum, t) => sum + t.value, 0);
  const variableExpenses = expenseTransactions
    .filter(t => t.expenseType === 'VARIAVEL')
    .reduce((sum, t) => sum + t.value, 0);
  const totalExpenses = fixedExpenses + variableExpenses;

  // Expenses by category
  const expensesByCategory = expenseTransactions.reduce((acc, t) => {
    if (!acc[t.category]) {
      acc[t.category] = { name: t.category, value: 0, type: t.expenseType };
    }
    acc[t.category].value += t.value;
    return acc;
  }, {} as Record<string, { name: string; value: number; type?: string }>);

  // Expenses by cost center
  const expensesByCostCenter = expenseTransactions.reduce((acc, t) => {
    if (!acc[t.costCenter]) {
      acc[t.costCenter] = { name: t.costCenter, value: 0 };
    }
    acc[t.costCenter].value += t.value;
    return acc;
  }, {} as Record<string, { name: string; value: number }>);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className={cn(
            "kpi-card cursor-pointer transition-all",
            viewMode === 'all' && "ring-2 ring-primary"
          )}
          onClick={() => setViewMode('all')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-expense-muted flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-expense" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Despesas Totais</p>
              <p className="text-2xl font-bold text-expense">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>

        <div 
          className={cn(
            "kpi-card cursor-pointer transition-all",
            viewMode === 'fixed' && "ring-2 ring-primary"
          )}
          onClick={() => setViewMode('fixed')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Building2 className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Despesas Fixas</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(fixedExpenses)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalExpenses > 0 ? ((fixedExpenses / totalExpenses) * 100).toFixed(1) : 0}% do total
              </p>
            </div>
          </div>
        </div>

        <div 
          className={cn(
            "kpi-card cursor-pointer transition-all",
            viewMode === 'variable' && "ring-2 ring-primary"
          )}
          onClick={() => setViewMode('variable')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning-muted flex items-center justify-center">
              <Zap className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Despesas Variáveis</p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(variableExpenses)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalExpenses > 0 ? ((variableExpenses / totalExpenses) * 100).toFixed(1) : 0}% do total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category */}
        <div className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-expense-muted flex items-center justify-center">
              <PieChart className="w-5 h-5 text-expense" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Por Categoria</h3>
              <p className="text-sm text-muted-foreground">Despesas agrupadas</p>
            </div>
          </div>

          <div className="space-y-3">
            {Object.values(expensesByCategory)
              .sort((a, b) => b.value - a.value)
              .map((category) => (
                <div key={category.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{category.name}</span>
                      <span className="text-sm font-semibold text-expense">{formatCurrency(category.value)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-expense rounded-full transition-all"
                        style={{ width: `${(category.value / totalExpenses) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    category.type === 'FIXA' ? "bg-muted text-muted-foreground" : "bg-warning-muted text-warning"
                  )}>
                    {category.type === 'FIXA' ? 'Fixa' : 'Var'}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* By Cost Center */}
        <div className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-info-muted flex items-center justify-center">
              <Building2 className="w-5 h-5 text-info" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Por Centro de Custo</h3>
              <p className="text-sm text-muted-foreground">Distribuição por área</p>
            </div>
          </div>

          <div className="space-y-3">
            {Object.values(expensesByCostCenter)
              .sort((a, b) => b.value - a.value)
              .map((center) => (
                <div key={center.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{center.name}</span>
                      <span className="text-sm font-semibold text-info">{formatCurrency(center.value)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-info rounded-full transition-all"
                        style={{ width: `${(center.value / totalExpenses) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {((center.value / totalExpenses) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <TransactionTable 
        filterNature="SAIDA" 
        title={
          viewMode === 'fixed' ? 'Despesas Fixas' : 
          viewMode === 'variable' ? 'Despesas Variáveis' : 
          'Todas as Despesas'
        }
      />
    </div>
  );
}
