import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  Receipt,
  RefreshCw,
  Zap,
  PiggyBank,
  Users,
  AlertCircle
} from 'lucide-react';
import { KPICard } from './KPICard';
import { RevenueExpenseChart } from './RevenueExpenseChart';
import { RecurringVsPontualChart } from './RecurringVsPontualChart';
import { ClientRankingChart } from './ClientRankingChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactionKPIs, useTransactions } from '@/hooks/useTransactions';
import { useRecurringContracts } from '@/hooks/useRecurringContracts';
import { useAccounts } from '@/hooks/useFinancialConfig';
import { useOpenPaymentStats } from '@/hooks/useOpenPayments';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function Dashboard() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Real data from hooks
  const { kpis: entryKpis, isLoading: entryLoading } = useTransactionKPIs({ 
    tipo_movimento: 'ENTRADA',
    competencia_mes: currentMonth,
    competencia_ano: currentYear
  });
  
  const { kpis: exitKpis, isLoading: exitLoading } = useTransactionKPIs({ 
    tipo_movimento: 'SAIDA',
    competencia_mes: currentMonth,
    competencia_ano: currentYear
  });

  const { data: transactions, isLoading: transactionsLoading } = useTransactions({
    competencia_mes: currentMonth,
    competencia_ano: currentYear
  });

  const { data: contracts } = useRecurringContracts();
  const { data: accounts } = useAccounts();
  const { data: openStats, isLoading: openStatsLoading } = useOpenPaymentStats();

  const isLoading = entryLoading || exitLoading || transactionsLoading || openStatsLoading;

  // Calculate KPIs
  const totalRevenue = entryKpis.totalEsperado;
  const totalExpenses = exitKpis.totalEsperado;
  const netResult = totalRevenue - totalExpenses;
  const receivable = entryKpis.totalEmAberto;
  const payable = exitKpis.totalEmAberto;

  // Calculate percentages
  const recurringRevenue = transactions
    ?.filter(t => t.tipo_movimento === 'ENTRADA' && t.natureza === 'RECORRENTE')
    .reduce((sum, t) => sum + Number(t.valor), 0) || 0;
  const recurringPercentage = totalRevenue > 0 ? (recurringRevenue / totalRevenue) * 100 : 0;

  const fixedExpenses = transactions
    ?.filter(t => t.tipo_movimento === 'SAIDA' && t.natureza === 'RECORRENTE')
    .reduce((sum, t) => sum + Number(t.valor), 0) || 0;
  const fixedExpensePercentage = totalExpenses > 0 ? (fixedExpenses / totalExpenses) * 100 : 0;

  // Total balance from accounts
  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.current_balance), 0) || 0;

  // Active contracts and total SM
  const activeContracts = contracts?.filter(c => c.active).length || 0;
  const totalSM = contracts?.reduce((sum, c) => {
    const factor = c.custom_minimum_wage_factor || 0;
    return sum + factor;
  }, 0) || 0;

  // Prepare chart data
  const chartTransactions = transactions?.map(t => ({
    id: t.id,
    nature: t.tipo_movimento === 'ENTRADA' ? 'ENTRADA' as const : 'SAIDA' as const,
    value: Number(t.valor),
    revenueType: t.natureza === 'RECORRENTE' ? 'RECORRENTE' : 'PONTUAL',
    expenseType: t.natureza === 'RECORRENTE' ? 'FIXA' : 'VARIAVEL',
    clientId: t.cliente_id || '',
    clientName: t.recurring_clients?.name || 'Outros',
    competenceMonth: t.competencia_mes,
    competenceYear: t.competencia_ano,
  })) || [];

  // Calculate client profitability for ranking
  const clientProfitability = chartTransactions.reduce((acc, t) => {
    if (!t.clientId) return acc;
    
    if (!acc[t.clientId]) {
      acc[t.clientId] = {
        clientId: t.clientId,
        clientName: t.clientName,
        totalRevenue: 0,
        totalExpenses: 0,
        profit: 0,
        margin: 0,
      };
    }
    
    if (t.nature === 'ENTRADA') {
      acc[t.clientId].totalRevenue += t.value;
    } else {
      acc[t.clientId].totalExpenses += t.value;
    }
    
    acc[t.clientId].profit = acc[t.clientId].totalRevenue - acc[t.clientId].totalExpenses;
    acc[t.clientId].margin = acc[t.clientId].totalRevenue > 0 
      ? (acc[t.clientId].profit / acc[t.clientId].totalRevenue) * 100 
      : 0;
    
    return acc;
  }, {} as Record<string, any>);

  const clientRanking = Object.values(clientProfitability)
    .sort((a: any, b: any) => b.profit - a.profit)
    .slice(0, 10);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Receita Total"
          value={totalRevenue}
          icon={TrendingUp}
          type="income"
          subtitle="Este mês"
        />
        <KPICard
          title="Despesas Totais"
          value={totalExpenses}
          icon={TrendingDown}
          type="expense"
          subtitle="Este mês"
        />
        <KPICard
          title="Resultado Líquido"
          value={netResult}
          icon={Wallet}
          type={netResult >= 0 ? 'income' : 'expense'}
        />
        <KPICard
          title="Saldo em Conta"
          value={totalBalance}
          icon={CreditCard}
          type="info"
          subtitle="Consolidado"
        />
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="A Receber"
          value={receivable}
          icon={Receipt}
          type="warning"
          subtitle={`${entryKpis.quantidadeEmAberto} pendentes`}
        />
        <KPICard
          title="A Pagar"
          value={payable}
          icon={CreditCard}
          type="expense"
          subtitle={`${exitKpis.quantidadeEmAberto} pendentes`}
        />
        <KPICard
          title="% Recorrente"
          value={recurringPercentage}
          icon={RefreshCw}
          type="info"
          isPercentage={true}
          isCurrency={false}
          subtitle="Da receita total"
        />
        <KPICard
          title="Contratos Ativos"
          value={activeContracts}
          icon={Users}
          type="info"
          isCurrency={false}
          subtitle={`${totalSM.toFixed(1)} SM contratados`}
        />
      </div>

      {/* KPI Cards - Row 3 (New) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="% Despesas Fixas"
          value={fixedExpensePercentage}
          icon={PiggyBank}
          type="info"
          isPercentage={true}
          isCurrency={false}
          subtitle="Das despesas totais"
        />
        <KPICard
          title="% Despesas Variáveis"
          value={100 - fixedExpensePercentage}
          icon={Zap}
          type="warning"
          isPercentage={true}
          isCurrency={false}
          subtitle="Das despesas totais"
        />
        <KPICard
          title="Total Em Aberto"
          value={receivable + payable}
          icon={AlertCircle}
          type="warning"
          subtitle="Entradas + Saídas"
        />
        <KPICard
          title="Atrasados"
          value={entryKpis.totalAtrasado + exitKpis.totalAtrasado}
          icon={AlertCircle}
          type="expense"
          subtitle="Vencidos"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueExpenseChart />
        <RecurringVsPontualChart transactions={[]} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        <ClientRankingChart data={clientRanking as any[]} />
      </div>
    </div>
  );
}
