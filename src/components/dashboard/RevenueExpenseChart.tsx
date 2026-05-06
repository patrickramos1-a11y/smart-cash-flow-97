import { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchAllPaginated } from '@/lib/financial/aggregates';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface RevenueExpenseChartProps {
  year?: number;
}

export function RevenueExpenseChart({ year }: RevenueExpenseChartProps) {
  const currentYear = year || new Date().getFullYear();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions_chart_v3', currentYear],
    queryFn: async () => {
      return fetchAllPaginated<any>(q => q
        .select('tipo_movimento, natureza, valor, competencia_mes, competencia_ano, transaction_category_id')
        .eq('competencia_ano', currentYear));
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['transaction_categories_chart'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_categories')
        .select('id, expense_type, subtype');
      if (error) throw error;
      return data;
    },
  });

  const chartData = useMemo(() => {
    if (!transactions) return [];
    const categoryMap = new Map(categories?.map(c => [c.id, c]) || []);

    // Always show all 12 months of the selected year for consistency with ProjectionChart
    return MONTHS.map((label, idx) => {
      const monthNum = idx + 1;
      const monthTransactions = transactions.filter(
        (t: any) => t.competencia_mes === monthNum && t.competencia_ano === currentYear
      );

      const receita = monthTransactions
        .filter((t: any) => t.tipo_movimento === 'ENTRADA')
        .reduce((sum: number, t: any) => sum + Number(t.valor), 0);

      let despesaFixa = 0;
      let despesaVariavel = 0;
      monthTransactions
        .filter((t: any) => t.tipo_movimento === 'SAIDA')
        .forEach((t: any) => {
          const cat = t.transaction_category_id ? categoryMap.get(t.transaction_category_id) : null;
          const isFixed = cat?.expense_type === 'FIXA' || cat?.subtype === 'FIXA' || t.natureza === 'RECORRENTE';
          if (isFixed) despesaFixa += Number(t.valor);
          else despesaVariavel += Number(t.valor);
        });

      return {
        month: label,
        receita,
        despesaFixa,
        despesaVariavel,
        totalDespesa: despesaFixa + despesaVariavel,
      };
    });
  }, [transactions, categories, currentYear]);

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
      <h3 className="text-lg font-semibold text-foreground mb-4">Receita x Despesa — {currentYear}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
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
              dataKey="despesaFixa" 
              name="Despesa Fixa" 
              fill="hsl(var(--expense))" 
              radius={[4, 4, 0, 0]}
              stackId="despesas"
            />
            <Bar 
              dataKey="despesaVariavel" 
              name="Despesa Variável" 
              fill="hsl(var(--warning))" 
              radius={[4, 4, 0, 0]}
              stackId="despesas"
            />
            <Line 
              type="monotone" 
              dataKey="totalDespesa" 
              name="Total Despesa" 
              stroke="hsl(var(--expense))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
