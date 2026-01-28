import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function RecurringVsPontualChart() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: transactions, isLoading } = useTransactions({
    competencia_mes: currentMonth,
    competencia_ano: currentYear,
  });

  const { revenueData, expenseData } = useMemo(() => {
    if (!transactions) {
      return {
        revenueData: [
          { name: 'Recorrente', value: 0, color: 'hsl(var(--chart-1))' },
          { name: 'Pontual', value: 0, color: 'hsl(var(--chart-2))' },
        ],
        expenseData: [
          { name: 'Fixas', value: 0, color: 'hsl(var(--chart-5))' },
          { name: 'Variáveis', value: 0, color: 'hsl(var(--chart-3))' },
        ],
      };
    }

    const revenues = transactions.filter(t => t.tipo_movimento === 'ENTRADA');
    const recurring = revenues
      .filter(t => t.natureza === 'RECORRENTE')
      .reduce((sum, t) => sum + Number(t.valor), 0);
    const pontual = revenues
      .filter(t => t.natureza === 'AVULSA')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const expenses = transactions.filter(t => t.tipo_movimento === 'SAIDA');
    const fixedExp = expenses
      .filter(t => t.natureza === 'RECORRENTE')
      .reduce((sum, t) => sum + Number(t.valor), 0);
    const variableExp = expenses
      .filter(t => t.natureza === 'AVULSA')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    return {
      revenueData: [
        { name: 'Recorrente', value: recurring, color: 'hsl(var(--chart-1))' },
        { name: 'Pontual', value: pontual, color: 'hsl(var(--chart-2))' },
      ],
      expenseData: [
        { name: 'Fixas', value: fixedExp, color: 'hsl(var(--chart-5))' },
        { name: 'Variáveis', value: variableExp, color: 'hsl(var(--chart-3))' },
      ],
    };
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-foreground mb-4">Composição Receitas e Despesas</h3>
        <Skeleton className="h-[250px] w-full" />
      </div>
    );
  }

  const hasRevenueData = revenueData.some(d => d.value > 0);
  const hasExpenseData = expenseData.some(d => d.value > 0);

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-foreground mb-4">Composição Receitas e Despesas</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div>
          <p className="text-sm font-medium text-muted-foreground text-center mb-2">Receitas</p>
          <div className="h-[200px]">
            {hasRevenueData ? (
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
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sem dados
              </div>
            )}
          </div>
        </div>

        {/* Expense Chart */}
        <div>
          <p className="text-sm font-medium text-muted-foreground text-center mb-2">Despesas</p>
          <div className="h-[200px]">
            {hasExpenseData ? (
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
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sem dados
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
