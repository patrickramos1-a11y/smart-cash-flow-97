import { useState } from 'react';
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
import { ProjectionChart } from './ProjectionChart';
import { FiscalIndicators } from './FiscalIndicators';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactionKPIs, useTransactions } from '@/hooks/useTransactions';
import { useRecurringContracts } from '@/hooks/useRecurringContracts';
import { useAccounts } from '@/hooks/useFinancialConfig';
import { useOpenPaymentStats } from '@/hooks/useOpenPayments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AnnualAnalysisTab } from './AnnualAnalysisTab';
import { HeroKPIs } from './executive/HeroKPIs';
import { SecondaryKPIs } from './executive/SecondaryKPIs';
import { MasterEvolutionChart } from './executive/MasterEvolutionChart';
import { AlertsBar } from './executive/AlertsBar';
import { SplitDonut } from './executive/SplitDonut';
import { useDashboardYTD, type Regime } from '@/hooks/useDashboardYTD';
import { RevenueTab } from './revenue/RevenueTab';
import { ExpensesTab } from './expenses/ExpensesTab';
import { ClientsTab } from './clients/ClientsTab';
import { ProjectionsTab } from './projections/ProjectionsTab';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export function Dashboard() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Real data from hooks with selected period
  const { kpis: entryKpis, isLoading: entryLoading } = useTransactionKPIs({ 
    tipo_movimento: 'ENTRADA',
    competencia_mes: selectedMonth,
    competencia_ano: selectedYear
  });
  
  const { kpis: exitKpis, isLoading: exitLoading } = useTransactionKPIs({ 
    tipo_movimento: 'SAIDA',
    competencia_mes: selectedMonth,
    competencia_ano: selectedYear
  });

  const { data: transactions, isLoading: transactionsLoading } = useTransactions({
    competencia_mes: selectedMonth,
    competencia_ano: selectedYear
  });

  const { data: contracts } = useRecurringContracts();
  const { data: accounts } = useAccounts();
  const { data: openStats, isLoading: openStatsLoading } = useOpenPaymentStats();

  // KPI Atrasados real: vencido (data_vencimento < hoje) e ainda não pago
  const { data: overdueData } = useQuery({
    queryKey: ['dashboard-overdue'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('transactions')
        .select('valor, tipo_movimento')
        .neq('status', 'PAGO')
        .lt('data_vencimento', today);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });
  const overdueTotal = (overdueData || []).reduce((s: number, t: any) => s + Number(t.valor || 0), 0);

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
    const factor = c.custom_minimum_wage_factor || c.plan?.minimum_wage_factor || 0;
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

  const periodLabel = `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;

  return (
    <Tabs defaultValue="executivo" className="space-y-3 lg:space-y-6">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="executivo">Executivo</TabsTrigger>
        <TabsTrigger value="receita">Receita</TabsTrigger>
        <TabsTrigger value="despesas">Despesas</TabsTrigger>
        <TabsTrigger value="clientes">Clientes</TabsTrigger>
        <TabsTrigger value="projecoes">Projeções</TabsTrigger>
        <TabsTrigger value="visao-geral">Visão Geral (Mensal)</TabsTrigger>
        <TabsTrigger value="anual">Análise Anual</TabsTrigger>
      </TabsList>

      <TabsContent value="receita" className="mt-0"><RevenueTab /></TabsContent>
      <TabsContent value="despesas" className="mt-0"><ExpensesTab /></TabsContent>
      <TabsContent value="clientes" className="mt-0"><ClientsTab /></TabsContent>
      <TabsContent value="projecoes" className="mt-0"><ProjectionsTab /></TabsContent>

      <TabsContent value="executivo" className="space-y-3 lg:space-y-6 mt-0">
        <ExecutiveTab
          year={selectedYear}
          accounts={accounts as any}
          contracts={contracts as any}
          totalBalance={totalBalance}
          onSelectMonth={(m) => {
            setSelectedMonth(m);
            const trigger = document.querySelector('[data-state][value="visao-geral"]') as HTMLElement | null;
            trigger?.click();
          }}
        />
      </TabsContent>

      <TabsContent value="visao-geral" className="space-y-3 lg:space-y-6 mt-0">
      {/* Period Selector */}
      <div className="flex flex-wrap gap-2 items-center bg-card border border-border rounded-xl px-3 py-2.5 lg:px-4 lg:py-3">
        <span className="text-xs lg:text-sm font-medium text-muted-foreground">Período:</span>
        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
          <SelectTrigger className="w-28 lg:w-36 h-8 lg:h-10 text-xs lg:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map(m => (
              <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-20 lg:w-24 h-8 lg:h-10 text-xs lg:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        <KPICard
          title="Receita Total"
          value={totalRevenue}
          icon={TrendingUp}
          type="income"
          subtitle={periodLabel}
        />
        <KPICard
          title="Despesas Totais"
          value={totalExpenses}
          icon={TrendingDown}
          type="expense"
          subtitle={periodLabel}
        />
        <KPICard
          title="Resultado Líquido"
          value={netResult}
          icon={Wallet}
          type={netResult >= 0 ? 'income' : 'expense'}
          subtitle={periodLabel}
        />
        <KPICard
          title="Saldo em Conta"
          value={totalBalance}
          icon={CreditCard}
          type="info"
          subtitle="Atual (não muda c/ período)"
        />
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
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
          value={totalExpenses > 0 ? 100 - fixedExpensePercentage : 0}
          icon={Zap}
          type="warning"
          isPercentage={true}
          isCurrency={false}
          subtitle={totalExpenses > 0 ? 'Das despesas totais' : 'Sem despesas no período'}
        />
        <KPICard
          title="Total Em Aberto"
          value={receivable + payable}
          icon={AlertCircle}
          type="warning"
          subtitle="Entradas + Saídas"
        />
        <KPICard
          title="Atrasados (Geral)"
          value={overdueTotal}
          icon={AlertCircle}
          type="expense"
          subtitle="Vencidos não pagos"
        />
      </div>

      {/* Fiscal Indicators */}
      <FiscalIndicators month={selectedMonth} year={selectedYear} />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
        <RevenueExpenseChart year={selectedYear} />
        <RecurringVsPontualChart month={selectedMonth} year={selectedYear} />
      </div>

      {/* Projection Chart */}
      <ProjectionChart year={selectedYear} />

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        <ClientRankingChart data={clientRanking as any[]} />
      </div>
      </TabsContent>

      <TabsContent value="anual" className="mt-0">
        <AnnualAnalysisTab />
      </TabsContent>
    </Tabs>
  );
}

// ============= Executive Tab =============
interface ExecutiveTabProps {
  year: number;
  accounts: any[] | null | undefined;
  contracts: any[] | null | undefined;
  totalBalance: number;
  onSelectMonth: (month: number) => void;
}

function ExecutiveTab({ year, accounts, contracts, totalBalance, onSelectMonth }: ExecutiveTabProps) {
  const [regime, setRegime] = useState<Regime>('competencia');
  const { data, isLoading } = useDashboardYTD(year, regime);

  // MRR estimate: sum of contract minimum_wage_factors * latest minimum wage value
  const { data: mwRow } = useQuery({
    queryKey: ['mw-latest', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('minimum_wage_config')
        .select('value,year')
        .lte('year', year)
        .order('year', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const mwValue = Number(mwRow?.value || 0);
  const totalSMFactor = (contracts || []).filter((c: any) => c.active).reduce((s: number, c: any) => {
    const f = c.custom_minimum_wage_factor ?? c.plan?.minimum_wage_factor ?? 0;
    return s + Number(f);
  }, 0);
  const mrrEstimado = totalSMFactor * mwValue;

  const margem = data.receitaYTD > 0 ? (data.resultadoYTD / data.receitaYTD) * 100 : 0;
  const periodLabel = `Acumulado ${year}`;

  return (
    <div className="space-y-4 lg:space-y-6">
      <AlertsBar
        accounts={accounts as any}
        atrasados={data.atrasados}
        monthlyReceita={data.monthly.map(m => m.receita)}
      />

      <HeroKPIs
        receitaYTD={data.receitaYTD}
        despesaYTD={data.despesaYTD}
        resultadoYTD={data.resultadoYTD}
        totalBalance={totalBalance}
        receitaYoY={data.receitaYoY}
        despesaYoY={data.despesaYoY}
        resultadoYoY={data.resultadoYoY}
        monthly={data.monthly}
        periodLabel={periodLabel}
      />

      <SecondaryKPIs
        receitaYTD={data.receitaYTD}
        receitaRecorrente={data.receitaRecorrente}
        ticketMedio={data.ticketMedio}
        margemOperacional={margem}
        aReceber={data.aReceber}
        aPagar={data.aPagar}
        atrasados={data.atrasados}
        burnRate={data.burnRateMensal}
        mrrEstimado={mrrEstimado}
      />

      <MasterEvolutionChart
        monthly={data.monthly}
        regime={regime}
        onRegimeChange={setRegime}
        onMonthClick={onSelectMonth}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
        <SplitDonut
          title="Receita: Recorrente vs Avulsa"
          parts={[
            { name: 'Recorrente', value: data.receitaRecorrente, color: 'hsl(var(--income))' },
            { name: 'Avulsa', value: data.receitaAvulsa, color: 'hsl(var(--info))' },
          ]}
        />
        <SplitDonut
          title="Despesa: Fixa vs Variável"
          parts={[
            { name: 'Fixa', value: data.despesaFixa, color: 'hsl(var(--expense))' },
            { name: 'Variável', value: data.despesaVariavel, color: 'hsl(var(--warning))' },
          ]}
        />
      </div>
    </div>
  );
}
