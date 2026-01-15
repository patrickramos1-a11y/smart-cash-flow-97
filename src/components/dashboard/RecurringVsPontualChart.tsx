import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Transaction } from '@/types/financial';
import { formatCurrency } from '@/data/mockData';

interface RecurringVsPontualChartProps {
  transactions: Transaction[];
}

export function RecurringVsPontualChart({ transactions }: RecurringVsPontualChartProps) {
  const revenues = transactions.filter(t => t.nature === 'ENTRADA');
  
  const recurring = revenues
    .filter(t => t.revenueType === 'RECORRENTE')
    .reduce((sum, t) => sum + t.value, 0);
  
  const pontual = revenues
    .filter(t => t.revenueType === 'PONTUAL')
    .reduce((sum, t) => sum + t.value, 0);

  const expenses = transactions.filter(t => t.nature === 'SAIDA');
  
  const fixedExp = expenses
    .filter(t => t.expenseType === 'FIXA')
    .reduce((sum, t) => sum + t.value, 0);
  
  const variableExp = expenses
    .filter(t => t.expenseType === 'VARIAVEL')
    .reduce((sum, t) => sum + t.value, 0);

  const revenueData = [
    { name: 'Recorrente', value: recurring, color: 'hsl(var(--chart-1))' },
    { name: 'Pontual', value: pontual, color: 'hsl(var(--chart-2))' },
  ];

  const expenseData = [
    { name: 'Fixas', value: fixedExp, color: 'hsl(var(--chart-5))' },
    { name: 'Variáveis', value: variableExp, color: 'hsl(var(--chart-3))' },
  ];

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-foreground mb-4">Composição Receitas e Despesas</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div>
          <p className="text-sm font-medium text-muted-foreground text-center mb-2">Receitas</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend 
                  verticalAlign="bottom"
                  formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Chart */}
        <div>
          <p className="text-sm font-medium text-muted-foreground text-center mb-2">Despesas</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend 
                  verticalAlign="bottom"
                  formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
