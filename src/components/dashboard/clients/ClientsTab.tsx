import { useState, useMemo } from 'react';
import { Users, Crown, AlertCircle, TrendingUp } from 'lucide-react';
import { useAnnualBreakdown, type Regime } from '@/hooks/useAnnualBreakdown';
import { PeriodRegimeToolbar } from '../shared/PeriodRegimeToolbar';
import { StackedAnnualChart } from '../shared/StackedAnnualChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/data/mockData';
import { cn } from '@/lib/utils';

function MiniKPI({ label, value, icon: Icon, tone = 'info' }: any) {
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

export function ClientsTab() {
  const cy = new Date().getFullYear();
  const [year, setYear] = useState(cy);
  const [regime, setRegime] = useState<Regime>('competencia');

  const { data, isLoading } = useAnnualBreakdown(year, 'ENTRADA', regime, 'client');

  const ranking = useMemo(() => {
    if (!data) return [];
    const groups = data.groups.filter(g => g.groupId !== '__none__');
    let acc = 0;
    return groups.map(g => {
      acc += g.total;
      const share = data.total > 0 ? (g.total / data.total) * 100 : 0;
      const cumShare = data.total > 0 ? (acc / data.total) * 100 : 0;
      const abc = cumShare <= 80 ? 'A' : cumShare <= 95 ? 'B' : 'C';
      return { ...g, share, cumShare, abc };
    });
  }, [data]);

  const top3 = ranking.slice(0, 3).reduce((s, r) => s + r.total, 0);
  const top3Pct = data && data.total > 0 ? (top3 / data.total) * 100 : 0;
  const totalClients = ranking.length;
  const topClient = ranking[0];

  return (
    <div className="space-y-4 lg:space-y-6">
      <PeriodRegimeToolbar
        year={year} onYearChange={setYear}
        regime={regime} onRegimeChange={setRegime}
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniKPI label="Receita Total" value={formatCurrency(data.total)} icon={TrendingUp} tone="income" />
            <MiniKPI label="Clientes Ativos" value={totalClients} icon={Users} tone="info" />
            <MiniKPI label="Top Cliente" value={topClient ? `${topClient.share.toFixed(1)}%` : '—'} icon={Crown} tone="warning" />
            <MiniKPI label="Conc. Top 3" value={`${top3Pct.toFixed(1)}%`} icon={AlertCircle} tone={top3Pct > 60 ? 'expense' : 'income'} />
          </div>

          <StackedAnnualChart
            title="Receita mensal — Top clientes"
            groups={data.groups.filter(g => g.groupId !== '__none__')}
            topN={8}
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base lg:text-lg">Curva ABC de Clientes</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Receita Anual</TableHead>
                    <TableHead className="text-right">% Total</TableHead>
                    <TableHead className="text-right">% Acumulado</TableHead>
                    <TableHead className="text-center">Classe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((r, i) => (
                    <TableRow key={r.groupId}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{r.groupName}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(r.total)}</TableCell>
                      <TableCell className="text-right text-xs">{r.share.toFixed(1)}%</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{r.cumShare.toFixed(1)}%</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            r.abc === 'A' && 'bg-income-muted text-income border-income/30',
                            r.abc === 'B' && 'bg-warning-muted text-warning border-warning/30',
                            r.abc === 'C' && 'bg-muted text-muted-foreground'
                          )}
                        >
                          {r.abc}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
