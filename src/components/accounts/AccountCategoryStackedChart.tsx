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
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

interface Props {
  accountId: string;
  year: number;
}

export function AccountCategoryStackedChart({ accountId, year }: Props) {
  const { data, isLoading } = useAccountAnnual(accountId, year);
  const [side, setSide] = useState<'SAIDA' | 'ENTRADA'>('SAIDA');

  const { chart, cats } = useMemo(() => {
    if (!data) return { chart: [], cats: [] as { id: string; name: string; color: string }[] };
    // top 8 categorias daquele lado
    const top = data.categories
      .filter((c) => c.type === side)
      .slice(0, 8)
      .map((c) => ({ id: c.id, name: c.name, color: c.color }));
    const topIds = new Set(top.map((c) => c.id));

    const chart = data.months.map((m) => {
      const row: any = { month: MONTHS[m.month - 1] };
      let outros = 0;
      Object.entries(m.byCategory).forEach(([cid, v]) => {
        const value = side === 'SAIDA' ? v.out : v.in;
        if (!value) return;
        if (topIds.has(cid)) row[cid] = (row[cid] || 0) + value;
        else outros += value;
      });
      if (outros > 0) row.__outros = outros;
      return row;
    });

    return { chart, cats: top };
  }, [data, side]);

  if (isLoading) return <Skeleton className="h-72 w-full" />;

  const total = chart.reduce(
    (s, r) => s + Object.entries(r).reduce((a, [k, v]) => (k === 'month' ? a : a + Number(v || 0)), 0),
    0,
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Movimentação por categoria · {year}</h3>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={side === 'SAIDA' ? 'destructive' : 'outline'}
            onClick={() => setSide('SAIDA')}
            className={cn('h-7 gap-1 text-xs')}
          >
            <ArrowUpRight className="w-3 h-3" /> Saídas
          </Button>
          <Button
            size="sm"
            variant={side === 'ENTRADA' ? 'default' : 'outline'}
            onClick={() => setSide('ENTRADA')}
            className="h-7 gap-1 text-xs"
          >
            <ArrowDownLeft className="w-3 h-3" /> Entradas
          </Button>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickFormatter={(v) => fmt(Number(v))}
              width={70}
            />
            <Tooltip
              formatter={(v: any, name: any) => {
                const cat = cats.find((c) => c.id === name);
                return [fmt(Number(v)), cat?.name || (name === '__outros' ? 'Outros' : name)];
              }}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend
              formatter={(value) => {
                const cat = cats.find((c) => c.id === value);
                return cat?.name || (value === '__outros' ? 'Outros' : value);
              }}
              wrapperStyle={{ fontSize: 11 }}
            />
            {cats.map((c) => (
              <Bar key={c.id} dataKey={c.id} stackId="a" fill={c.color} />
            ))}
            <Bar dataKey="__outros" stackId="a" fill="#94a3b8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Total {side === 'SAIDA' ? 'gasto' : 'recebido'} no ano: <strong>{fmt(total)}</strong>
      </p>
    </div>
  );
}
