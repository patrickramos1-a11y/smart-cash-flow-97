import { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function ProjectionChart() {
  const currentYear = new Date().getFullYear();

  // Fetch transactions for the year
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions_projection', currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('tipo_movimento, natureza, valor, valor_pago, status, competencia_mes, competencia_ano')
        .eq('competencia_ano', currentYear);

      if (error) throw error;
      return data;
    },
  });

  // Fetch recurring contracts to project future revenue
  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ['contracts_projection', currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_contracts')
        .select(`
          id,
          active,
          custom_minimum_wage_factor,
          contract_plans (
            minimum_wage_factor
          )
        `)
        .eq('active', true);

      if (error) throw error;
      return data;
    },
  });

  // Fetch minimum wage for projection calculations
  const { data: minimumWage, isLoading: wageLoading } = useQuery({
    queryKey: ['minimum_wage', currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('minimum_wage_config')
        .select('value')
        .eq('year', currentYear)
        .single();

      if (error) return { value: 1518 }; // Default value
      return data;
    },
  });

  const chartData = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    const wageValue = minimumWage?.value || 1518;

    // Calculate projected monthly revenue from contracts
    const projectedMonthlyRevenue = contracts?.reduce((sum, c) => {
      const factor = c.custom_minimum_wage_factor || c.contract_plans?.minimum_wage_factor || 0;
      return sum + (factor * wageValue);
    }, 0) || 0;

    return MONTHS.map((month, idx) => {
      const monthNum = idx + 1;
      const isFutureMonth = monthNum > currentMonth;
      
      // Get real transactions for past/current months
      const monthTransactions = transactions?.filter(t => t.competencia_mes === monthNum) || [];
      
      const realEntries = monthTransactions
        .filter(t => t.tipo_movimento === 'ENTRADA' && t.status === 'PAGO')
        .reduce((sum, t) => sum + Number(t.valor_pago || t.valor), 0);
      
      const realExpenses = monthTransactions
        .filter(t => t.tipo_movimento === 'SAIDA' && t.status === 'PAGO')
        .reduce((sum, t) => sum + Number(t.valor_pago || t.valor), 0);

      const expectedEntries = monthTransactions
        .filter(t => t.tipo_movimento === 'ENTRADA')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      const expectedExpenses = monthTransactions
        .filter(t => t.tipo_movimento === 'SAIDA')
        .reduce((sum, t) => sum + Number(t.valor), 0);

      return {
        month,
        previstoReceita: isFutureMonth ? projectedMonthlyRevenue : expectedEntries,
        realizadoReceita: isFutureMonth ? null : realEntries,
        previstoDespesa: isFutureMonth ? expectedExpenses : expectedExpenses,
        realizadoDespesa: isFutureMonth ? null : realExpenses,
        saldoPrevisto: (isFutureMonth ? projectedMonthlyRevenue : expectedEntries) - 
                       (isFutureMonth ? expectedExpenses : expectedExpenses),
      };
    });
  }, [transactions, contracts, minimumWage]);

  const isLoading = transactionsLoading || contractsLoading || wageLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Projeção Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Projeção vs Realizado - {currentYear}
        </CardTitle>
        <CardDescription>
          Comparativo entre valores previstos e realizados ao longo do ano
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => value !== null ? formatCurrency(value) : 'N/A'}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Bar 
                dataKey="previstoReceita" 
                name="Receita Prevista" 
                fill="hsl(var(--income))" 
                opacity={0.4}
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="previstoDespesa" 
                name="Despesa Prevista" 
                fill="hsl(var(--expense))" 
                opacity={0.4}
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="realizadoReceita" 
                name="Receita Realizada" 
                stroke="hsl(var(--income))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--income))' }}
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="realizadoDespesa" 
                name="Despesa Realizada" 
                stroke="hsl(var(--expense))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--expense))' }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
