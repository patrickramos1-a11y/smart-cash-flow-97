import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/data/mockData';
import type { AnnualGroupRow } from '@/hooks/useAnnualBreakdown';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const PALETTE = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316','#6366f1','#14b8a6','#a855f7'];

interface Props {
  title: string;
  groups: AnnualGroupRow[]; // only top N
  topN?: number;
}

const compact = (v: number) =>
  new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

export function StackedAnnualChart({ title, groups, topN = 8 }: Props) {
  const top = groups.slice(0, topN);
  const data = MONTHS.map((name, i) => {
    const row: any = { name };
    top.forEach(g => { row[g.groupName] = g.monthly[i]; });
    return row;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base lg:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="name" interval={0} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} width={60} />
              <Tooltip
                formatter={(v: any) => formatCurrency(Number(v))}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {top.map((g, i) => (
                <Bar key={g.groupId} dataKey={g.groupName} stackId="s" fill={g.color || PALETTE[i % PALETTE.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
