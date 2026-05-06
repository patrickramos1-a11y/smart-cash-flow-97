import { useState, useMemo } from 'react';
import { TrendingDown, Layers, AlertCircle, Flame } from 'lucide-react';
import { useAnnualBreakdown, type Regime, type GroupBy } from '@/hooks/useAnnualBreakdown';
import { PeriodRegimeToolbar } from '../shared/PeriodRegimeToolbar';
import { StackedAnnualChart } from '../shared/StackedAnnualChart';
import { AnnualBreakdownTable } from '../shared/AnnualBreakdownTable';
import { ParetoChart } from '../shared/ParetoChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/data/mockData';
import { cn } from '@/lib/utils';

function MiniKPI({ label, value, icon: Icon, tone = 'expense' }: any) {
  const toneCls = tone === 'income' ? 'text-income' : tone === 'expense' ? 'text-expense' : tone === 'warning' ? 'text-warning' : 'text-info';
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

export function ExpensesTab() {
  const cy = new Date().getFullYear();
  const [year, setYear] = useState(cy);
  const [regime, setRegime] = useState<Regime>('competencia');
  const [groupBy, setGroupBy] = useState<GroupBy>('category');

  const { data, isLoading } = useAnnualBreakdown(year, 'SAIDA', regime, groupBy);

  const currentMonth = new Date().getFullYear() === year ? new Date().getMonth() + 1 : 12;
  const burnRate = useMemo(() => {
    if (!data) return 0;
    const ytd = data.monthlyTotal.slice(0, currentMonth).reduce((s, v) => s + v, 0);
    return currentMonth > 0 ? ytd / currentMonth : 0;
  }, [data, currentMonth]);

  const topGroupShare = useMemo(() => {
    if (!data || data.total === 0 || data.groups.length === 0) return 0;
    return (data.groups[0].total / data.total) * 100;
  }, [data]);

  return (
    <div className="space-y-4 lg:space-y-6">
      <PeriodRegimeToolbar
        year={year} onYearChange={setYear}
        regime={regime} onRegimeChange={setRegime}
        rightSlot={
          <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <TabsList className="h-8">
              <TabsTrigger value="category" className="text-xs">Categoria</TabsTrigger>
              <TabsTrigger value="cost_center" className="text-xs">Centro de Custo</TabsTrigger>
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
            <MiniKPI label="Despesa Total" value={formatCurrency(data.total)} icon={TrendingDown} tone="expense" />
            <MiniKPI label="Burn Rate/mês" value={formatCurrency(burnRate)} icon={Flame} tone="warning" />
            <MiniKPI label="Grupos" value={data.groups.length} icon={Layers} tone="info" />
            <MiniKPI label="Top 1" value={`${topGroupShare.toFixed(1)}%`} icon={AlertCircle} tone={topGroupShare > 30 ? 'expense' : 'warning'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
            <StackedAnnualChart
              title={`Despesa mensal por ${groupBy === 'category' ? 'categoria' : 'centro de custo'}`}
              groups={data.groups}
            />
            <ParetoChart
              title="Pareto 80/20 — Onde o dinheiro vai"
              groups={data.groups}
              total={data.total}
            />
          </div>

          <AnnualBreakdownTable
            title={`Detalhamento por ${groupBy === 'category' ? 'categoria' : 'centro de custo'}`}
            groups={data.groups}
            monthlyTotal={data.monthlyTotal}
            total={data.total}
            groupLabel={groupBy === 'category' ? 'Categoria' : 'Centro de Custo'}
          />
        </>
      )}
    </div>
  );
}
