import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ClientProfitability } from '@/types/financial';
import { formatCurrency } from '@/data/mockData';
import { Trophy, TrendingUp } from 'lucide-react';

interface ClientRankingChartProps {
  data: ClientProfitability[];
}

export function ClientRankingChart({ data }: ClientRankingChartProps) {
  const getBarColor = (index: number) => {
    if (index === 0) return 'hsl(45, 93%, 47%)'; // Gold
    if (index === 1) return 'hsl(0, 0%, 75%)'; // Silver
    if (index === 2) return 'hsl(30, 67%, 50%)'; // Bronze
    return 'hsl(var(--income))';
  };

  return (
    <div className="chart-container">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-warning-muted flex items-center justify-center">
          <Trophy className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Ranking de Clientes por Lucro</h3>
          <p className="text-sm text-muted-foreground">Top 10 clientes mais lucrativos</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 3 Cards */}
        <div className="space-y-3">
          {data.slice(0, 3).map((client, index) => (
            <div 
              key={client.clientId}
              className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50"
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: getBarColor(index) }}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{client.clientName}</p>
                <p className="text-sm text-muted-foreground">
                  Receita: {formatCurrency(client.totalRevenue)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-income">{formatCurrency(client.profit)}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 text-income" />
                  <span>{client.margin.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              layout="vertical" 
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
              <XAxis 
                type="number"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                type="category"
                dataKey="clientName" 
                width={120}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar 
                dataKey="profit" 
                name="Lucro" 
                radius={[0, 4, 4, 0]}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
