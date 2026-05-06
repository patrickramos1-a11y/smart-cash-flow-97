import { useState, useMemo } from 'react';
import { TrendingUp, RefreshCw, DollarSign, Users, Target } from 'lucide-react';
import { useAnnualBreakdown, type Regime, type GroupBy } from '@/hooks/useAnnualBreakdown';
import { PeriodRegimeToolbar } from '../shared/PeriodRegimeToolbar';
import { StackedAnnualChart } from '../shared/StackedAnnualChart';
import { AnnualBreakdownTable } from '../shared/AnnualBreakdownTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/data/mockData';
import { cn } from '@/lib/utils';

function MiniKPI({ label, value, icon: Icon, tone = 'income' }: any) {
  const toneCls = tone === 'income' ? 'text-income' : tone === 'expense' ? 'text-expense' : 'text-info';
  return (
    <Card>
      <CardContent className="p-3 lg:p-4 flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg bg-muted flex items-center justify-center', toneCls)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn('text-lg font-bold truncate', toneCls)}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function RevenueTab() {
  const cy = new Date().getFullYear();
  const [year, setYear] = useState(cy);
  const [regime, setRegime] = useState<Regime>('competencia');
  const [groupBy, setGroupBy] = useState<GroupBy>('category');

  const { data, isLoading } = useAnnualBreakdown(year, 'ENTRADA', regime, groupBy);
  const { data: clientsData } = useAnnualBreakdown(year, 'ENTRADA', regime, 'client');

  const recurringPct = useMemo(() => {
    if (!data) return 0;
    // Approx via groups: we don't have natureza here. Use clientsData totals as fallback proxy.
    return 0;
  }, [data]);

  const top3Concentration = useMemo(() => {
    if (!clientsData || clientsData.total === 0) return 0;
    const top3 = clientsData.groups.slice(0, 3).reduce((s, g) => s + g.total, 0);
    return (top3 / clientsData.total) * 100;
  }, [clientsData]);

  const ticketMedio = data && data.totalCount > 0 ? data.total / data.totalCount : 0;
  const activeClients = clientsData?.groups.filter(g => g.groupId !== '__none__').length || 0;

  return (
    <div className="space-y-4 lg:space-y-6">
      <PeriodRegimeToolbar
        year={year} onYearChange={setYear}
        regime={regime} onRegimeChange={setRegime}
        rightSlot={
          <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <TabsList className="h-8">
              <TabsTrigger value="category" className="text-xs">Categoria</TabsTrigger>
              <TabsTrigger value="client" className="text-xs">Cliente</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniKPI label="Receita Total" value={formatCurrency(data.total)} icon={TrendingUp} tone="income" />
            <MiniKPI label="Ticket Médio" value={formatCurrency(ticketMedio)} icon={Target} tone="info" />
            <MiniKPI label="Clientes Ativos" value={activeClients} icon={Users} tone="info" />
            <MiniKPI label="Conc. Top 3" value={`${top3Concentration.toFixed(1)}%`} icon={DollarSign} tone={top3Concentration > 60 ? 'expense' : 'income'} />
          </div>

          <StackedAnnualChart
            title={`Receita mensal por ${groupBy === 'category' ? 'categoria' : 'cliente'}`}
            groups={data.groups}
          />

          <AnnualBreakdownTable
            title={`Detalhamento por ${groupBy === 'category' ? 'categoria' : 'cliente'}`}
            groups={data.groups}
            monthlyTotal={data.monthlyTotal}
            total={data.total}
            groupLabel={groupBy === 'category' ? 'Categoria' : 'Cliente'}
          />
        </>
      )}
    </div>
  );
}
