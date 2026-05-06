import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Wallet, Percent, Users, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from 'recharts';
import { KPICard } from './KPICard';
import { fetchAllPaginated } from '@/lib/financial/aggregates';
import { supabase } from '@/integrations/supabase/client';

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface AnnualRow {
  tipo_movimento: string;
  natureza: string;
  status: string;
  valor: number | string;
  valor_pago: number | string | null;
  competencia_mes: number;
  competencia_ano: number;
  transaction_category_id: string | null;
  account_id: string | null;
  cliente_id: string | null;
  cost_center_id: string | null;
}

export function AnnualAnalysisTab() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Fetch all available years from transactions
  const { data: availableYears = [] } = useQuery({
    queryKey: ['annual-tab-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('competencia_ano')
        .order('competencia_ano', { ascending: true });
      if (error) throw error;
      const set = new Set<number>();
      (data || []).forEach((r: any) => set.add(r.competencia_ano));
      set.add(currentYear);
      return Array.from(set).sort();
    },
    staleTime: 60_000,
  });

  // Fetch transactions for selected year + previous year (for comparison)
  const { data: allRows, isLoading } = useQuery({
    queryKey: ['annual-tab-rows', selectedYear],
    queryFn: async () => {
      const rows = await fetchAllPaginated<AnnualRow>((q) =>
        q
          .select('tipo_movimento, natureza, status, valor, valor_pago, competencia_mes, competencia_ano, transaction_category_id, account_id, cliente_id, cost_center_id')
          .in('competencia_ano', [selectedYear - 1, selectedYear]),
      );
      return rows;
    },
    staleTime: 60_000,
  });

  // Lookups
  const { data: categoryMap = {} } = useQuery({
    queryKey: ['annual-tab-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('transaction_categories').select('id, name, color');
      const m: Record<string, { name: string; color: string }> = {};
      (data || []).forEach((c: any) => (m[c.id] = { name: c.name, color: c.color || '#6366f1' }));
      return m;
    },
    staleTime: 5 * 60_000,
  });

  const { data: accountMap = {} } = useQuery({
    queryKey: ['annual-tab-accounts'],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('id, name, bank');
      const m: Record<string, string> = {};
      (data || []).forEach((a: any) => (m[a.id] = a.name + (a.bank ? ` (${a.bank})` : '')));
      return m;
    },
    staleTime: 5 * 60_000,
  });

  const { data: clientMap = {} } = useQuery({
    queryKey: ['annual-tab-clients'],
    queryFn: async () => {
      const { data } = await supabase.from('recurring_clients').select('id, name');
      const m: Record<string, string> = {};
      (data || []).forEach((c: any) => (m[c.id] = c.name));
      return m;
    },
    staleTime: 5 * 60_000,
  });

  const analysis = useMemo(() => {
    const empty = {
      months: MONTHS.map((m, i) => ({ month: m, monthNum: i + 1, receita: 0, despesa: 0, resultado: 0 })),
      totalReceita: 0,
      totalDespesa: 0,
      resultado: 0,
      receitaPrev: 0,
      despesaPrev: 0,
      resultadoPrev: 0,
      categoriasReceita: [] as Array<{ name: string; value: number; color: string }>,
      categoriasDespesa: [] as Array<{ name: string; value: number; color: string }>,
      contas: [] as Array<{ name: string; entradas: number; saidas: number; saldo: number }>,
      clientes: [] as Array<{ name: string; receita: number; transactions: number }>,
    };
    if (!allRows) return empty;

    const months = empty.months.map((m) => ({ ...m }));
    let totalReceita = 0;
    let totalDespesa = 0;
    let receitaPrev = 0;
    let despesaPrev = 0;
    const catsRec: Record<string, { name: string; value: number; color: string }> = {};
    const catsDes: Record<string, { name: string; value: number; color: string }> = {};
    const contasMap: Record<string, { name: string; entradas: number; saidas: number; saldo: number }> = {};
    const clientesMap: Record<string, { name: string; receita: number; transactions: number }> = {};

    for (const r of allRows) {
      const valor = Number(r.valor) || 0;
      if (r.competencia_ano === selectedYear - 1) {
        if (r.tipo_movimento === 'ENTRADA') receitaPrev += valor;
        else if (r.tipo_movimento === 'SAIDA') despesaPrev += valor;
        continue;
      }
      if (r.competencia_ano !== selectedYear) continue;

      const m = months[r.competencia_mes - 1];
      if (!m) continue;

      if (r.tipo_movimento === 'ENTRADA') {
        m.receita += valor;
        totalReceita += valor;
        if (r.transaction_category_id) {
          const c = categoryMap[r.transaction_category_id];
          const key = r.transaction_category_id;
          if (!catsRec[key]) catsRec[key] = { name: c?.name || 'Sem categoria', value: 0, color: c?.color || '#10b981' };
          catsRec[key].value += valor;
        }
        if (r.cliente_id) {
          if (!clientesMap[r.cliente_id]) {
            clientesMap[r.cliente_id] = { name: clientMap[r.cliente_id] || 'Cliente', receita: 0, transactions: 0 };
          }
          clientesMap[r.cliente_id].receita += valor;
          clientesMap[r.cliente_id].transactions += 1;
        }
      } else if (r.tipo_movimento === 'SAIDA') {
        m.despesa += valor;
        totalDespesa += valor;
        if (r.transaction_category_id) {
          const c = categoryMap[r.transaction_category_id];
          const key = r.transaction_category_id;
          if (!catsDes[key]) catsDes[key] = { name: c?.name || 'Sem categoria', value: 0, color: c?.color || '#ef4444' };
          catsDes[key].value += valor;
        }
      }

      if (r.account_id) {
        if (!contasMap[r.account_id]) {
          contasMap[r.account_id] = { name: accountMap[r.account_id] || 'Conta', entradas: 0, saidas: 0, saldo: 0 };
        }
        if (r.tipo_movimento === 'ENTRADA') contasMap[r.account_id].entradas += valor;
        else if (r.tipo_movimento === 'SAIDA') contasMap[r.account_id].saidas += valor;
        contasMap[r.account_id].saldo = contasMap[r.account_id].entradas - contasMap[r.account_id].saidas;
      }
    }
    months.forEach((m) => (m.resultado = m.receita - m.despesa));

    return {
      months,
      totalReceita,
      totalDespesa,
      resultado: totalReceita - totalDespesa,
      receitaPrev,
      despesaPrev,
      resultadoPrev: receitaPrev - despesaPrev,
      categoriasReceita: Object.values(catsRec).sort((a, b) => b.value - a.value),
      categoriasDespesa: Object.values(catsDes).sort((a, b) => b.value - a.value),
      contas: Object.values(contasMap).sort((a, b) => b.saldo - a.saldo),
      clientes: Object.values(clientesMap).sort((a, b) => b.receita - a.receita).slice(0, 15),
    };
  }, [allRows, selectedYear, categoryMap, accountMap, clientMap]);

  const margin = analysis.totalReceita > 0 ? (analysis.resultado / analysis.totalReceita) * 100 : 0;
  const growth = analysis.receitaPrev > 0
    ? ((analysis.totalReceita - analysis.receitaPrev) / analysis.receitaPrev) * 100
    : 0;
  const ticketMedio = analysis.clientes.length > 0
    ? analysis.totalReceita / analysis.clientes.reduce((s, c) => s + c.transactions, 0)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Year selector */}
      <div className="flex flex-wrap gap-2 items-center bg-card border border-border rounded-xl px-3 py-2.5 lg:px-4 lg:py-3">
        <span className="text-xs lg:text-sm font-medium text-muted-foreground">Ano de análise:</span>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-28 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          Comparado com {selectedYear - 1}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        <KPICard
          title={`Faturamento ${selectedYear}`}
          value={analysis.totalReceita}
          icon={TrendingUp}
          type="income"
          subtitle={analysis.receitaPrev > 0 ? `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% vs ${selectedYear - 1}` : 'Sem comparativo'}
        />
        <KPICard
          title="Despesas no Ano"
          value={analysis.totalDespesa}
          icon={TrendingDown}
          type="expense"
          subtitle={analysis.despesaPrev > 0 ? `Ano anterior: ${formatBRL(analysis.despesaPrev)}` : 'Sem comparativo'}
        />
        <KPICard
          title="Resultado do Ano"
          value={analysis.resultado}
          icon={Wallet}
          type={analysis.resultado >= 0 ? 'income' : 'expense'}
          subtitle={`Margem: ${margin.toFixed(1)}%`}
        />
        <KPICard
          title="Ticket Médio"
          value={ticketMedio}
          icon={Receipt}
          type="info"
          subtitle={`${analysis.clientes.reduce((s, c) => s + c.transactions, 0)} entradas`}
        />
      </div>

      {/* Sub-tabs for Categorias / Contas / Clientes */}
      <Tabs defaultValue="evolution" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="evolution">Evolução Mensal</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base lg:text-lg">Faturamento mês a mês — {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={analysis.months}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatBRL(Number(v))} />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base lg:text-lg">Resultado mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={analysis.months}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatBRL(Number(v))} />
                  <Line type="monotone" dataKey="resultado" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receitas por categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.categoriasReceita.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem dados.</p>
              )}
              {analysis.categoriasReceita.slice(0, 12).map((c) => {
                const pct = analysis.totalReceita > 0 ? (c.value / analysis.totalReceita) * 100 : 0;
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium truncate flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                        {c.name}
                      </span>
                      <span className="text-muted-foreground">{formatBRL(c.value)} • {pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${pct}%`, background: c.color }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Despesas por categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.categoriasDespesa.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem dados.</p>
              )}
              {analysis.categoriasDespesa.slice(0, 12).map((c) => {
                const pct = analysis.totalDespesa > 0 ? (c.value / analysis.totalDespesa) * 100 : 0;
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium truncate flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                        {c.name}
                      </span>
                      <span className="text-muted-foreground">{formatBRL(c.value)} • {pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${pct}%`, background: c.color }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Movimentação por conta — {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="py-2">Conta</th>
                      <th className="py-2 text-right">Entradas</th>
                      <th className="py-2 text-right">Saídas</th>
                      <th className="py-2 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.contas.length === 0 && (
                      <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">Sem dados.</td></tr>
                    )}
                    {analysis.contas.map((a) => (
                      <tr key={a.name} className="border-b border-border/50">
                        <td className="py-2 font-medium">{a.name}</td>
                        <td className="py-2 text-right text-primary">{formatBRL(a.entradas)}</td>
                        <td className="py-2 text-right text-destructive">{formatBRL(a.saidas)}</td>
                        <td className={`py-2 text-right font-semibold ${a.saldo >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {formatBRL(a.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top clientes por faturamento — {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.clientes.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem dados.</p>
              )}
              {analysis.clientes.map((c, i) => {
                const pct = analysis.totalReceita > 0 ? (c.receita / analysis.totalReceita) * 100 : 0;
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium truncate">
                        #{i + 1} {c.name} <span className="text-muted-foreground">({c.transactions} lanç.)</span>
                      </span>
                      <span className="text-muted-foreground">{formatBRL(c.receita)} • {pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
