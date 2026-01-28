import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function RevenueExpenseChart() {
  const currentYear = new Date().getFullYear();

  // Fetch transactions for the last 6 months
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions_chart', currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('tipo_movimento, valor, competencia_mes, competencia_ano')
        .eq('competencia_ano', currentYear);

      if (error) throw error;
      return data;
    },
  });

  const chartData = useMemo(() => {
    if (!transactions) return [];

    // Get last 6 months
    const currentMonth = new Date().getMonth() + 1;
    const months: { month: string; receita: number; despesa: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      let targetMonth = currentMonth - i;
      let targetYear = currentYear;
      
      if (targetMonth <= 0) {
        targetMonth += 12;
        targetYear -= 1;
      }

      const monthTransactions = transactions.filter(
        t => t.competencia_mes === targetMonth && t.competencia_ano === targetYear
      );

      const receita = monthTransactions
        .filter(t => t.tipo_movimento === 'ENTRADA')
        .reduce((sum, t) => sum + Number(t.valor), 0);

      const despesa = monthTransactions
        .filter(t => t.tipo_movimento === 'SAIDA')
        .reduce((sum, t) => sum + Number(t.valor), 0);

      months.push({
        month: MONTHS[targetMonth - 1],
        receita,
        despesa,
      });
    }

    return months;
  }, [transactions, currentYear]);

  if (isLoading) {
    return (
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-foreground mb-4">Receita x Despesa por Mês</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-foreground mb-4">Receita x Despesa por Mês</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
