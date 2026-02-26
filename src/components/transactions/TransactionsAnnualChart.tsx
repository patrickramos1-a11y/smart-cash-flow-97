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
      // Fetch in batches to avoid 1000 row limit
      let allData: any[] = [];
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from('transactions')
          .select('tipo_movimento, natureza, valor, valor_pago, status, competencia_mes, competencia_ano')
          .eq('competencia_ano', year)
          .range(from, from + batchSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < batchSize) break;
        from += batchSize;
      }

      return allData;
    },
  });

  const chartData = useMemo(() => {
    return MONTHS.map((month, idx) => {
      const monthNum = idx + 1;
      const monthTransactions = transactions?.filter(t => t.competencia_mes === monthNum) || [];
      
      // Entradas split by natureza
      const entradaRecorrente = monthTransactions
        .filter(t => t.tipo_movimento === 'ENTRADA' && t.natureza === 'RECORRENTE')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      const entradaAvulsa = monthTransactions
        .filter(t => t.tipo_movimento === 'ENTRADA' && t.natureza === 'AVULSA')
        .reduce((sum, t) => sum + Number(t.valor), 0);

      // Saídas split by natureza (RECORRENTE = Fixa, AVULSA = Variável)
      const saidaFixa = monthTransactions
        .filter(t => t.tipo_movimento === 'SAIDA' && t.natureza === 'RECORRENTE')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      const saidaVariavel = monthTransactions
        .filter(t => t.tipo_movimento === 'SAIDA' && t.natureza === 'AVULSA')
        .reduce((sum, t) => sum + Number(t.valor), 0);

      const totalEntradas = entradaRecorrente + entradaAvulsa;
      const totalSaidas = saidaFixa + saidaVariavel;

      return {
        month,
        entradaRecorrente,
        entradaAvulsa,
        totalEntradas,
        saidaFixa,
        saidaVariavel,
        totalSaidas,
        saldo: totalEntradas - totalSaidas,
      };
    });
  }, [transactions]);

  const totals = useMemo(() => {
    return chartData.reduce((acc, item) => {
      acc.totalEntradas += item.totalEntradas;
      acc.totalSaidas += item.totalSaidas;
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
              {filterType === 'ENTRADA' ? 'Recorrentes vs Avulsas' : filterType === 'SAIDA' ? 'Fixas vs Variáveis' : 'Entradas vs Saídas'}
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

              {/* === VIEW: ALL (Entradas + Saídas) === */}
              {showEntradas && showSaidas && (
                <>
                  {/* Entradas stacked: Recorrente + Avulsa */}
                  <Bar 
                    dataKey="entradaRecorrente" 
                    name="Entrada Recorrente" 
                    fill="hsl(var(--income))" 
                    stackId="entradas"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="entradaAvulsa" 
                    name="Entrada Avulsa" 
                    fill="hsl(142 71% 65%)" 
                    stackId="entradas"
                    radius={[4, 4, 0, 0]}
                  />
                  {/* Saídas stacked: Fixa + Variável */}
                  <Bar 
                    dataKey="saidaFixa" 
                    name="Despesa Fixa" 
                    fill="hsl(var(--expense))" 
                    stackId="saidas"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="saidaVariavel" 
                    name="Despesa Variável" 
                    fill="hsl(var(--warning))" 
                    stackId="saidas"
                    radius={[4, 4, 0, 0]}
                  />
                  {/* Saldo line */}
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    name="Saldo" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                  />
                </>
              )}

              {/* === VIEW: ONLY ENTRADAS === */}
              {showEntradas && !showSaidas && (
                <>
                  <Bar 
                    dataKey="entradaRecorrente" 
                    name="Recorrente" 
                    fill="hsl(var(--income))" 
                    stackId="entradas"
                    radius={[0, 0, 0, 0]}
                  >
                    {showValues && (
                      <LabelList 
                        dataKey="entradaRecorrente" 
                        position="inside" 
                        formatter={(v: number) => v > 0 ? formatCompact(v) : ''} 
                        style={{ fill: 'white', fontSize: 9 }}
                      />
                    )}
                  </Bar>
                  <Bar 
                    dataKey="entradaAvulsa" 
                    name="Avulsa" 
                    fill="hsl(142 71% 65%)" 
                    stackId="entradas"
                    radius={[4, 4, 0, 0]}
                  >
                    {showValues && (
                      <LabelList 
                        dataKey="entradaAvulsa" 
                        position="top" 
                        formatter={(v: number) => v > 0 ? formatCompact(v) : ''} 
                        style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                      />
                    )}
                  </Bar>
                  <Line 
                    type="monotone" 
                    dataKey="totalEntradas" 
                    name="Total Entradas" 
                    stroke="hsl(var(--income))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </>
              )}

              {/* === VIEW: ONLY SAÍDAS === */}
              {showSaidas && !showEntradas && (
                <>
                  <Bar 
                    dataKey="saidaFixa" 
                    name="Fixa" 
                    fill="hsl(var(--expense))" 
                    stackId="saidas"
                    radius={[0, 0, 0, 0]}
                  >
                    {showValues && (
                      <LabelList 
                        dataKey="saidaFixa" 
                        position="inside" 
                        formatter={(v: number) => v > 0 ? formatCompact(v) : ''} 
                        style={{ fill: 'white', fontSize: 9 }}
                      />
                    )}
                  </Bar>
                  <Bar 
                    dataKey="saidaVariavel" 
                    name="Variável" 
                    fill="hsl(var(--warning))" 
                    stackId="saidas"
                    radius={[4, 4, 0, 0]}
                  >
                    {showValues && (
                      <LabelList 
                        dataKey="saidaVariavel" 
                        position="top" 
                        formatter={(v: number) => v > 0 ? formatCompact(v) : ''} 
                        style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                      />
                    )}
                  </Bar>
                  <Line 
                    type="monotone" 
                    dataKey="totalSaidas" 
                    name="Total Saídas" 
                    stroke="hsl(var(--expense))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
