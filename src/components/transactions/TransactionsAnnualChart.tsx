import { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Info } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface TransactionsAnnualChartProps {
  year: number;
  filterType?: 'ENTRADA' | 'SAIDA';
  filterNatureza?: 'RECORRENTE' | 'AVULSA';
}

export function TransactionsAnnualChart({ year, filterType, filterNatureza }: TransactionsAnnualChartProps) {
  // Fetch transactions for the year
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions_annual', year, filterType, filterNatureza],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('tipo_movimento, natureza, valor, valor_pago, status, competencia_mes, competencia_ano')
        .eq('competencia_ano', year);

      if (filterType) {
        query = query.eq('tipo_movimento', filterType);
      }
      if (filterNatureza) {
        query = query.eq('natureza', filterNatureza);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch recurring contracts to project future revenue
  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ['contracts_annual', year],
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
    queryKey: ['minimum_wage', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('minimum_wage_config')
        .select('value')
        .eq('year', year)
        .single();

      if (error) return { value: 1518 }; // Default value
      return data;
    },
  });

  const chartData = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const wageValue = minimumWage?.value || 1518;

    // Calculate projected monthly revenue from contracts
    const projectedMonthlyRevenue = contracts?.reduce((sum, c) => {
      const factor = c.custom_minimum_wage_factor || c.contract_plans?.minimum_wage_factor || 0;
      return sum + (factor * wageValue);
    }, 0) || 0;

    return MONTHS.map((month, idx) => {
      const monthNum = idx + 1;
      const isFutureMonth = year > currentYear || (year === currentYear && monthNum > currentMonth);
      
      // Get real transactions for past/current months
      const monthTransactions = transactions?.filter(t => t.competencia_mes === monthNum) || [];
      
      const entries = monthTransactions
        .filter(t => t.tipo_movimento === 'ENTRADA')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      const exits = monthTransactions
        .filter(t => t.tipo_movimento === 'SAIDA')
        .reduce((sum, t) => sum + Number(t.valor), 0);

      const paidEntries = monthTransactions
        .filter(t => t.tipo_movimento === 'ENTRADA' && t.status === 'PAGO')
        .reduce((sum, t) => sum + Number(t.valor_pago || t.valor), 0);
      
      const paidExits = monthTransactions
        .filter(t => t.tipo_movimento === 'SAIDA' && t.status === 'PAGO')
        .reduce((sum, t) => sum + Number(t.valor_pago || t.valor), 0);

      return {
        month,
        entradas: isFutureMonth ? projectedMonthlyRevenue : entries,
        saidas: isFutureMonth ? 0 : exits,
        saldo: (isFutureMonth ? projectedMonthlyRevenue : entries) - (isFutureMonth ? 0 : exits),
        recebido: isFutureMonth ? null : paidEntries,
        pago: isFutureMonth ? null : paidExits,
        isProjection: isFutureMonth,
      };
    });
  }, [transactions, contracts, minimumWage, year]);

  const isLoading = transactionsLoading || contractsLoading || wageLoading;

  // Calculate totals
  const totals = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    return chartData.reduce((acc, item) => {
      acc.totalEntradas += item.entradas || 0;
      acc.totalSaidas += item.saidas || 0;
      if (item.recebido !== null) acc.totalRecebido += item.recebido;
      if (item.pago !== null) acc.totalPago += item.pago;
      return acc;
    }, { totalEntradas: 0, totalSaidas: 0, totalRecebido: 0, totalPago: 0 });
  }, [chartData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Visão Anual
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
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Visão Anual - {year}
            </CardTitle>
            <CardDescription className="mt-1">
              Entradas vs Saídas com projeção baseada em contratos ativos
            </CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-4 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Total Entradas</p>
              <p className="text-lg font-bold text-income">{formatCurrency(totals.totalEntradas)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Saídas</p>
              <p className="text-lg font-bold text-expense">{formatCurrency(totals.totalSaidas)}</p>
            </div>
          </div>
        </div>
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
                formatter={(value: number, name: string) => {
                  if (value === null) return ['N/A', name];
                  return [formatCurrency(value), name];
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
              <Bar 
                dataKey="entradas" 
                name="Entradas" 
                fill="hsl(var(--income))" 
                opacity={0.7}
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="saidas" 
                name="Saídas" 
                fill="hsl(var(--expense))" 
                opacity={0.7}
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="saldo" 
                name="Saldo" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend for projection */}
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="w-4 h-4" />
          <span>Meses futuros mostram projeção baseada em contratos ativos ({formatCurrency((contracts?.reduce((sum, c) => {
            const factor = c.custom_minimum_wage_factor || c.contract_plans?.minimum_wage_factor || 0;
            return sum + (factor * (minimumWage?.value || 1518));
          }, 0) || 0))}/mês)</span>
        </div>
      </CardContent>
    </Card>
  );
}
