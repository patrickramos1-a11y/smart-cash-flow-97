import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/data/mockData';

const data = [
  { month: 'Ago', receita: 45000, despesa: 32000 },
  { month: 'Set', receita: 52000, despesa: 35000 },
  { month: 'Out', receita: 48000, despesa: 38000 },
  { month: 'Nov', receita: 61000, despesa: 42000 },
  { month: 'Dez', receita: 55000, despesa: 40000 },
  { month: 'Jan', receita: 39962, despesa: 20670 },
];

export function RevenueExpenseChart() {
  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-foreground mb-4">Receita x Despesa por Mês</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            <Bar 
              dataKey="receita" 
              name="Receita" 
              fill="hsl(var(--income))" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="despesa" 
              name="Despesa" 
              fill="hsl(var(--expense))" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
