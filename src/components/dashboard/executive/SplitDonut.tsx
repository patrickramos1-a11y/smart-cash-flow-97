import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/data/mockData';

interface Props {
  title: string;
  parts: { name: string; value: number; color: string }[];
}

export function SplitDonut({ title, parts }: Props) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base lg:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={parts}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {parts.map((p, i) => (
                  <Cell key={i} fill={p.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: any) => formatCurrency(Number(v))}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {parts.map((p) => {
            const pct = total > 0 ? (p.value / total) * 100 : 0;
            return (
              <div key={p.name} className="text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
                  <span className="text-muted-foreground">{p.name}</span>
                </div>
                <p className="font-semibold">{formatCurrency(p.value)} <span className="text-muted-foreground font-normal">({pct.toFixed(1)}%)</span></p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
