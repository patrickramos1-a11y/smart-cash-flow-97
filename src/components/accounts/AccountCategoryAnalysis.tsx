import { useMemo } from 'react';
import { useAccountAnnual } from '@/hooks/useAccountAnnual';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  accountId: string;
  year: number;
}

interface Row {
  id: string;
  name: string;
  color: string;
  type: 'ENTRADA' | 'SAIDA';
  total: number;
  pct: number;
  series: number[];
  trend: 'up' | 'down' | 'flat';
}

// regressão linear simples para tendência (slope sobre 12 meses)
function slope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  if (mean === 0) return 0;
  let num = 0,
    den = 0;
  const xMean = (n - 1) / 2;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - mean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den / Math.abs(mean);
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const w = 80,
    h = 20;
  const step = w / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => `${i * step},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

export function AccountCategoryAnalysis({ accountId, year }: Props) {
  const { data, isLoading } = useAccountAnnual(accountId, year);

  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    const totalSide = { ENTRADA: data.totals.in, SAIDA: data.totals.out };
    return data.categories.map((c) => {
      const series = data.months.map((m) => {
        const v = m.byCategory[c.id];
        return v ? (c.type === 'ENTRADA' ? v.in : v.out) : 0;
      });
      const sl = slope(series);
      const trend: Row['trend'] = sl > 0.05 ? 'up' : sl < -0.05 ? 'down' : 'flat';
      const denom = totalSide[c.type] || 1;
      return {
        id: c.id,
        name: c.name,
        color: c.color,
        type: c.type,
        total: c.total,
        pct: (c.total / denom) * 100,
        series,
        trend,
      };
    });
  }, [data]);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground py-6 text-center">Sem dados no ano.</p>;

  return (
    <div className="space-y-1">
      {rows.map((r) => {
        const TrendIcon = r.trend === 'up' ? TrendingUp : r.trend === 'down' ? TrendingDown : Minus;
        const trendColor =
          r.type === 'SAIDA'
            ? r.trend === 'up'
              ? 'text-destructive'
              : r.trend === 'down'
                ? 'text-primary'
                : 'text-muted-foreground'
            : r.trend === 'up'
              ? 'text-primary'
              : r.trend === 'down'
                ? 'text-destructive'
                : 'text-muted-foreground';

        return (
          <div
            key={r.id}
            className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/40 border-b border-border/50"
          >
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: r.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded',
                    r.type === 'ENTRADA'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-destructive/10 text-destructive',
                  )}
                >
                  {r.type === 'ENTRADA' ? 'Entrada' : 'Saída'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {r.pct.toFixed(1)}% do total {r.type === 'ENTRADA' ? 'recebido' : 'gasto'} no ano
              </p>
            </div>
            <Sparkline values={r.series} color={r.color} />
            <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
              <TrendIcon className="w-3.5 h-3.5" />
            </div>
            <p
              className={cn(
                'text-sm font-bold w-28 text-right',
                r.type === 'ENTRADA' ? 'text-primary' : 'text-destructive',
              )}
            >
              {fmt(r.total)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
