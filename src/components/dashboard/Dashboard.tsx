import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  Receipt,
  RefreshCw,
  Zap,
  PiggyBank
} from 'lucide-react';
import { KPICard } from './KPICard';
import { RevenueExpenseChart } from './RevenueExpenseChart';
import { RecurringVsPontualChart } from './RecurringVsPontualChart';
import { ClientRankingChart } from './ClientRankingChart';
import { mockTransactions, calculateKPIs, calculateClientProfitability } from '@/data/mockData';

export function Dashboard() {
  const kpis = calculateKPIs(mockTransactions);
  const clientProfitability = calculateClientProfitability(mockTransactions);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Receita Total"
          value={kpis.totalRevenue}
          icon={TrendingUp}
          type="income"
          trend={12.5}
          subtitle="Este mês"
        />
        <KPICard
          title="Despesas Totais"
          value={kpis.totalExpenses}
          icon={TrendingDown}
          type="expense"
          trend={-3.2}
          subtitle="Este mês"
        />
        <KPICard
          title="Resultado Líquido"
          value={kpis.netResult}
          icon={Wallet}
          type={kpis.netResult >= 0 ? 'income' : 'expense'}
          trend={15.8}
        />
        <KPICard
          title="A Receber"
          value={kpis.receivable}
          icon={Receipt}
          type="warning"
          subtitle="Em aberto"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="A Pagar"
          value={kpis.payable}
          icon={CreditCard}
          type="expense"
          subtitle="Em aberto"
        />
        <KPICard
          title="% Recorrente"
          value={kpis.recurringPercentage}
          icon={RefreshCw}
          type="info"
          isPercentage={true}
          isCurrency={false}
          subtitle="Da receita total"
        />
        <KPICard
          title="% Despesas Fixas"
          value={kpis.fixedExpensePercentage}
          icon={PiggyBank}
          type="info"
          isPercentage={true}
          isCurrency={false}
          subtitle="Das despesas totais"
        />
        <KPICard
          title="% Despesas Variáveis"
          value={100 - kpis.fixedExpensePercentage}
          icon={Zap}
          type="warning"
          isPercentage={true}
          isCurrency={false}
          subtitle="Das despesas totais"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueExpenseChart />
        <RecurringVsPontualChart transactions={mockTransactions} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        <ClientRankingChart data={clientProfitability.slice(0, 10)} />
      </div>
    </div>
  );
}
