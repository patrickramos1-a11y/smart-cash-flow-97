import { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import { fetchAllPaginated, aggregateByMonth } from '@/lib/financial/aggregates';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface ProjectionChartProps {
  year?: number;
}

export function ProjectionChart({ year }: ProjectionChartProps) {
  const currentYear = year || new Date().getFullYear();
  const realYear = new Date().getFullYear();
  const realMonth = new Date().getMonth() + 1;

  // "lastRealMonth" = último mês considerado realizado, em função do ano selecionado
  const lastRealMonth = currentYear < realYear ? 12 : currentYear > realYear ? 0 : realMonth;

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['projection_tx_v3', currentYear],
    queryFn: async () => {
      return fetchAllPaginated<any>(q => q
        .select('tipo_movimento, valor, valor_pago, status, competencia_mes')
        .eq('competencia_ano', currentYear));
    },
  });

  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ['projection_contracts', currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_contracts')
        .select('id, active, custom_minimum_wage_factor, contract_plans (minimum_wage_factor)')
        .eq('active', true);
      if (error) throw error;
      return data;
    },
  });

  const { data: minimumWage, isLoading: wageLoading } = useQuery({
    queryKey: ['minimum_wage', currentYear],
    queryFn: async () => {
      const { data } = await supabase
        .from('minimum_wage_config')
        .select('value')
        .eq('year', currentYear)
        .maybeSingle();
      return data || { value: 1518 };
    },
  });

  const chartData = useMemo(() => {
    const wageValue = minimumWage?.value || 1518;
    const projectedMonthlyRevenue = (contracts || []).reduce((sum: number, c: any) => {
      const factor = c.custom_minimum_wage_factor || c.contract_plans?.minimum_wage_factor || 0;
      return sum + (factor * wageValue);
    }, 0);

    const agg = aggregateByMonth(transactions || []);

    // Despesa projetada para meses futuros: média dos últimos 3 meses já realizados (>0)
    const realizedExpenses = agg
      .filter(m => m.month <= lastRealMonth && m.realExpenses > 0)
      .slice(-3)
      .map(m => m.realExpenses);
    const avgExpense = realizedExpenses.length
      ? realizedExpenses.reduce((s, v) => s + v, 0) / realizedExpenses.length
      : 0;

    return MONTHS.map((month, idx) => {
      const monthNum = idx + 1;
      const isFuture = monthNum > lastRealMonth;
      const m = agg[idx];

      const previstoReceita = isFuture
        ? Math.max(projectedMonthlyRevenue, m.expectedEntries)
        : m.expectedEntries;
      const previstoDespesa = isFuture
        ? Math.max(avgExpense, m.expectedExpenses)
        : m.expectedExpenses;

      return {
        month,
        previstoReceita,
        previstoDespesa,
        // Para meses passados/atual: mostra realizado (zero se não houve)
        // Para meses futuros: null (linha não desenhada)
        realizadoReceita: isFuture ? null : m.realEntries,
        realizadoDespesa: isFuture ? null : m.realExpenses,
      };
    });
  }, [transactions, contracts, minimumWage, lastRealMonth]);

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
          Projeção vs Realizado — {currentYear}
        </CardTitle>
        <CardDescription>
          Realizado = transações PAGAS · Previsto = lançamentos do mês (futuros usam projeção de contratos e média de despesa)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: any) => value === null || value === undefined ? '—' : formatCurrency(Number(value))}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Bar dataKey="previstoReceita" name="Receita Prevista" fill="hsl(var(--income))" opacity={0.4} radius={[4, 4, 0, 0]} />
              <Bar dataKey="previstoDespesa" name="Despesa Prevista" fill="hsl(var(--expense))" opacity={0.4} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="realizadoReceita" name="Receita Realizada" stroke="hsl(var(--income))" strokeWidth={2} dot={{ fill: 'hsl(var(--income))' }} connectNulls={false} />
              <Line type="monotone" dataKey="realizadoDespesa" name="Despesa Realizada" stroke="hsl(var(--expense))" strokeWidth={2} dot={{ fill: 'hsl(var(--expense))' }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
