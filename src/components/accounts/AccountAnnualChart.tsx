import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useAccountAnnual } from '@/hooks/useAccountAnnual';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

interface Props {
  accountId: string;
  year: number;
}

type Mode = 'SAIDA' | 'ENTRADA';

export function AccountAnnualChart({ accountId, year }: Props) {
  const { data, isLoading } = useAccountAnnual(accountId, year);
  const [mode, setMode] = useState<Mode>('SAIDA');
  const TOP_N = 6;

  const { topCats, chartData } = useMemo(() => {
    if (!data) return { topCats: [], chartData: [] };
    const filtered = data.categories.filter((c) => c.type === mode);
    const top = filtered.slice(0, TOP_N);
    const topIds = new Set(top.map((c) => c.id));

    const rows = data.months.map((m) => {
      const row: Record<string, any> = { month: MONTHS[m.month - 1] };
      let outras = 0;
      Object.entries(m.byCategory).forEach(([cid, v]) => {
        const meta = data.categories.find((c) => c.id === cid);
        if (!meta || meta.type !== mode) return;
        const val = mode === 'ENTRADA' ? v.in : v.out;
        if (val <= 0) return;
        if (topIds.has(cid)) row[cid] = val;
        else outras += val;
      });
      if (outras > 0) row['__outras'] = outras;
      return row;
    });

    return { topCats: top, chartData: rows };
  }, [data, mode]);

  if (isLoading)
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Análise anual por categoria</h3>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={mode === 'SAIDA' ? 'default' : 'outline'}
            onClick={() => setMode('SAIDA')}
          >
            Saídas
          </Button>
          <Button
            size="sm"
            variant={mode === 'ENTRADA' ? 'default' : 'outline'}
            onClick={() => setMode('ENTRADA')}
          >
            Entradas
          </Button>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickFormatter={(v) => fmt(Number(v))}
              width={70}
            />
            <Tooltip
              formatter={(value: any, name: any) => {
                const cat =
                  name === '__outras' ? 'Outras' : topCats.find((c) => c.id === name)?.name || name;
                return [fmt(Number(value)), cat];
              }}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend
              formatter={(value) =>
                value === '__outras' ? 'Outras' : topCats.find((c) => c.id === value)?.name || value
              }
              wrapperStyle={{ fontSize: 11 }}
            />
            {topCats.map((c) => (
              <Bar key={c.id} dataKey={c.id} stackId="a" fill={c.color} />
            ))}
            <Bar dataKey="__outras" stackId="a" fill="hsl(var(--muted-foreground))" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top legend with totals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {topCats.map((c) => (
          <div key={c.id} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} />
            <span className="flex-1 truncate">{c.name}</span>
            <span className={cn('font-semibold', mode === 'ENTRADA' ? 'text-primary' : 'text-destructive')}>
              {fmt(c.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
