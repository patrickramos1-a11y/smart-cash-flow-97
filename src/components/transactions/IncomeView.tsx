import { useState } from 'react';
import { RefreshCw, Zap, TrendingUp, Calendar, Users } from 'lucide-react';
import { TransactionTable } from './TransactionTable';
import { mockTransactions, formatCurrency } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function IncomeView() {
  const [viewMode, setViewMode] = useState<'all' | 'recurring' | 'pontual'>('all');

  const incomeTransactions = mockTransactions.filter(t => t.nature === 'ENTRADA');
  const recurringRevenue = incomeTransactions
    .filter(t => t.revenueType === 'RECORRENTE')
    .reduce((sum, t) => sum + t.value, 0);
  const pontualRevenue = incomeTransactions
    .filter(t => t.revenueType === 'PONTUAL')
    .reduce((sum, t) => sum + t.value, 0);
  const totalRevenue = recurringRevenue + pontualRevenue;

  // Recurring contracts summary
  const recurringClients = mockTransactions
    .filter(t => t.nature === 'ENTRADA' && t.revenueType === 'RECORRENTE' && t.clientName)
    .reduce((acc, t) => {
      if (!acc[t.clientName!]) {
        acc[t.clientName!] = {
          name: t.clientName!,
          value: 0,
          status: t.status,
          paid: t.isPaid
        };
      }
      acc[t.clientName!].value += t.value;
      return acc;
    }, {} as Record<string, { name: string; value: number; status: string; paid: boolean }>);

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
            <div className="w-12 h-12 rounded-xl bg-income-muted flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-income" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold text-income">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div 
          className={cn(
            "kpi-card cursor-pointer transition-all",
            viewMode === 'recurring' && "ring-2 ring-primary"
          )}
          onClick={() => setViewMode('recurring')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-info-muted flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Recorrente</p>
              <p className="text-2xl font-bold text-info">{formatCurrency(recurringRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {((recurringRevenue / totalRevenue) * 100).toFixed(1)}% do total
              </p>
            </div>
          </div>
        </div>

        <div 
          className={cn(
            "kpi-card cursor-pointer transition-all",
            viewMode === 'pontual' && "ring-2 ring-primary"
          )}
          onClick={() => setViewMode('pontual')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning-muted flex items-center justify-center">
              <Zap className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Pontual</p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(pontualRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {((pontualRevenue / totalRevenue) * 100).toFixed(1)}% do total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recurring Contracts Section */}
      {viewMode !== 'pontual' && (
        <div className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-info-muted flex items-center justify-center">
              <Users className="w-5 h-5 text-info" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Contratos Recorrentes</h3>
              <p className="text-sm text-muted-foreground">Acompanhamento mensal por cliente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Object.values(recurringClients).map((client) => (
              <div 
                key={client.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{client.name}</p>
                  <p className="text-sm text-income font-semibold">{formatCurrency(client.value)}</p>
                </div>
                <div className={cn(
                  "w-3 h-3 rounded-full flex-shrink-0",
                  client.paid ? "bg-income" : "bg-warning"
                )} title={client.paid ? 'Pago' : 'Em aberto'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <TransactionTable 
        filterNature="ENTRADA" 
        title={
          viewMode === 'recurring' ? 'Lançamentos Recorrentes' : 
          viewMode === 'pontual' ? 'Lançamentos Pontuais' : 
          'Todas as Entradas'
        }
      />
    </div>
  );
}
