import { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, LabelList } from 'recharts';
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

const formatCompact = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toString();
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface TransactionsAnnualChartProps {
  year: number;
  filterType?: 'ENTRADA' | 'SAIDA';
  filterNatureza?: 'RECORRENTE' | 'AVULSA';
  showValues?: boolean;
}

export function TransactionsAnnualChart({ year, filterType, filterNatureza, showValues = false }: TransactionsAnnualChartProps) {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions_annual', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('tipo_movimento, natureza, valor, valor_pago, status, competencia_mes, competencia_ano')
        .eq('competencia_ano', year);

      if (error) throw error;
      return data;
    },
  });

  const chartData = useMemo(() => {
    return MONTHS.map((month, idx) => {
      const monthNum = idx + 1;
      const monthTransactions = transactions?.filter(t => t.competencia_mes === monthNum) || [];
      
      const entries = monthTransactions
        .filter(t => t.tipo_movimento === 'ENTRADA')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      const exits = monthTransactions
        .filter(t => t.tipo_movimento === 'SAIDA')
        .reduce((sum, t) => sum + Number(t.valor), 0);

      return {
        month,
        entradas: entries,
        saidas: exits,
        saldo: entries - exits,
      };
    });
  }, [transactions]);

  // Calculate totals based on filter
  const totals = useMemo(() => {
    return chartData.reduce((acc, item) => {
      acc.totalEntradas += item.entradas;
      acc.totalSaidas += item.saidas;
      return acc;
    }, { totalEntradas: 0, totalSaidas: 0 });
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

  const showEntradas = !filterType || filterType === 'ENTRADA';
  const showSaidas = !filterType || filterType === 'SAIDA';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Visão Anual — {year}
            </CardTitle>
            <CardDescription className="mt-1">
              {filterType === 'ENTRADA' ? 'Somente Entradas' : filterType === 'SAIDA' ? 'Somente Saídas' : 'Entradas vs Saídas'}
            </CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-4 text-right">
            {showEntradas && (
              <div>
                <p className="text-xs text-muted-foreground">Total Entradas</p>
                <p className="text-lg font-bold text-income">{formatCurrency(totals.totalEntradas)}</p>
              </div>
            )}
            {showSaidas && (
              <div>
                <p className="text-xs text-muted-foreground">Total Saídas</p>
                <p className="text-lg font-bold text-expense">{formatCurrency(totals.totalSaidas)}</p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
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
              {showEntradas && (
                <Bar 
                  dataKey="entradas" 
                  name="Entradas" 
                  fill="hsl(var(--income))" 
                  opacity={0.7}
                  radius={[4, 4, 0, 0]}
                >
                  {showValues && (
                    <LabelList 
                      dataKey="entradas" 
                      position="top" 
                      formatter={(v: number) => v > 0 ? formatCompact(v) : ''} 
                      style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                  )}
                </Bar>
              )}
              {showSaidas && (
                <Bar 
                  dataKey="saidas" 
                  name="Saídas" 
                  fill="hsl(var(--expense))" 
                  opacity={0.7}
                  radius={[4, 4, 0, 0]}
                >
                  {showValues && (
                    <LabelList 
                      dataKey="saidas" 
                      position="top" 
                      formatter={(v: number) => v > 0 ? formatCompact(v) : ''} 
                      style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                  )}
                </Bar>
              )}
              {showEntradas && showSaidas && (
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  name="Saldo" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
