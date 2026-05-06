import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/data/mockData';
import type { AnnualGroupRow } from '@/hooks/useAnnualBreakdown';

const compact = (v: number) =>
  new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

export function ParetoChart({ title, groups, total, topN = 12 }: { title: string; groups: AnnualGroupRow[]; total: number; topN?: number }) {
  const top = groups.slice(0, topN);
  let acc = 0;
  const data = top.map(g => {
    acc += g.total;
    return {
      name: g.groupName,
      Valor: g.total,
      Acumulado: total > 0 ? (acc / total) * 100 : 0,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base lg:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ left: 0, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis yAxisId="l" tickFormatter={compact} tick={{ fontSize: 11 }} width={60} />
              <YAxis yAxisId="r" orientation="right" tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fontSize: 11 }} width={45} domain={[0, 100]} />
              <Tooltip
                formatter={(v: any, n: any) => n === 'Acumulado' ? `${Number(v).toFixed(1)}%` : formatCurrency(Number(v))}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="l" dataKey="Valor" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
              <Line yAxisId="r" type="monotone" dataKey="Acumulado" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
