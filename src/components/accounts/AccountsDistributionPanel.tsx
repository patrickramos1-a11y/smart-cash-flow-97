import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { Account } from '@/hooks/useFinancialConfig';
import type { AccountSnapshot } from '@/hooks/useAccountsSnapshot';

interface Props {
  accounts: Account[];
  snapshots?: Record<string, AccountSnapshot>;
  isLoading?: boolean;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const FALLBACK_COLORS = [
  '#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444',
  '#14b8a6', '#6366f1', '#ec4899', '#84cc16', '#f97316',
];

export function AccountsDistributionPanel({ accounts, snapshots, isLoading }: Props) {
  // Group by category
  const groups = new Map<string, { name: string; color: string; value: number }>();
  accounts.forEach((a, idx) => {
    const saldo = snapshots?.[a.id]?.saldo_fim_mes ?? Number(a.current_balance) ?? 0;
    if (saldo <= 0) return;
    const key = a.category?.id || 'sem-categoria';
    const name = a.category?.name || 'Sem setor';
    const color = a.category?.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
    const cur = groups.get(key);
    if (cur) cur.value += saldo;
    else groups.set(key, { name, color, value: saldo });
  });

  const data = Array.from(groups.values()).sort((a, b) => b.value - a.value);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-primary" />
          Distribuição por setor
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : data.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            Sem saldos positivos no período.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {data.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => fmt(v)}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {data.map((d) => {
                const pct = total > 0 ? (d.value / total) * 100 : 0;
                return (
                  <div key={d.name} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ background: d.color }}
                      />
                      <span className="truncate font-medium">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                      <span className="font-semibold">{fmt(d.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
