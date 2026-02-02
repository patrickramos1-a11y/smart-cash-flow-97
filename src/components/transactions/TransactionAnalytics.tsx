import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransactionCategories, useCostCenters, useAccounts, usePaymentMethods } from '@/hooks/useFinancialConfig';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Tags, Target, CreditCard } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
];

interface TransactionAnalyticsProps {
  month: number;
  year: number;
  type?: 'ENTRADA' | 'SAIDA';
}

export function TransactionAnalytics({ month, year, type }: TransactionAnalyticsProps) {
  const { data: transactions, isLoading: transactionsLoading } = useTransactions({
    competencia_mes: month,
    competencia_ano: year,
    tipo_movimento: type,
  });

  const { data: categories } = useTransactionCategories();
  const { data: costCenters } = useCostCenters();
  const { data: accounts } = useAccounts();
  const { data: paymentMethods } = usePaymentMethods();

  // Analysis by Category
  const categoryAnalysis = useMemo(() => {
    if (!transactions || !categories) return [];

    const grouped = transactions.reduce((acc, t) => {
      const categoryId = t.categoria_id || 'sem-categoria';
      const category = categories.find(c => c.id === categoryId);
      const name = category?.name || 'Sem Categoria';
      
      if (!acc[categoryId]) {
        acc[categoryId] = { name, value: 0, color: category?.color || COLORS[0] };
      }
      acc[categoryId].value += Number(t.valor);
      return acc;
    }, {} as Record<string, { name: string; value: number; color: string }>);

    return Object.values(grouped)
      .sort((a, b) => b.value - a.value)
      .slice(0, 7)
      .map((item, idx) => ({
        ...item,
        color: item.color || COLORS[idx % COLORS.length],
      }));
  }, [transactions, categories]);

  // Analysis by Account
  const accountAnalysis = useMemo(() => {
    if (!transactions || !accounts) return [];

    const grouped = transactions.reduce((acc, t) => {
      const accountId = t.conta_id || 'sem-conta';
      const account = accounts.find(a => a.id === accountId);
      const name = account?.name || 'Sem Conta';
      
      if (!acc[accountId]) {
        acc[accountId] = { name, value: 0 };
      }
      acc[accountId].value += Number(t.valor);
      return acc;
    }, {} as Record<string, { name: string; value: number }>);

    return Object.values(grouped)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map((item, idx) => ({
        ...item,
        fill: COLORS[idx % COLORS.length],
      }));
  }, [transactions, accounts]);

  // Analysis by Cost Center
  const costCenterAnalysis = useMemo(() => {
    if (!transactions || !categories || !costCenters) return [];

    const grouped = transactions.reduce((acc, t) => {
      const categoryId = t.categoria_id;
      const category = categories.find(c => c.id === categoryId);
      const costCenterId = category?.cost_center_id || 'sem-centro';
      const costCenter = costCenters.find(cc => cc.id === costCenterId);
      const name = costCenter?.name || 'Sem Centro de Custo';
      
      if (!acc[costCenterId]) {
        acc[costCenterId] = { name, value: 0 };
      }
      acc[costCenterId].value += Number(t.valor);
      return acc;
    }, {} as Record<string, { name: string; value: number }>);

    return Object.values(grouped)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map((item, idx) => ({
        ...item,
        fill: COLORS[idx % COLORS.length],
      }));
  }, [transactions, categories, costCenters]);

  // Analysis by Payment Method
  const paymentMethodAnalysis = useMemo(() => {
    if (!transactions || !paymentMethods) return [];

    const grouped = transactions.reduce((acc, t) => {
      const methodId = t.forma_pagamento_id || 'sem-forma';
      const method = paymentMethods.find(m => m.id === methodId);
      const name = method?.name || 'Não Especificado';
      
      if (!acc[methodId]) {
        acc[methodId] = { name, value: 0, count: 0 };
      }
      acc[methodId].value += Number(t.valor);
      acc[methodId].count += 1;
      return acc;
    }, {} as Record<string, { name: string; value: number; count: number }>);

    return Object.values(grouped)
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => ({
        ...item,
        fill: COLORS[idx % COLORS.length],
      }));
  }, [transactions, paymentMethods]);

  const isLoading = transactionsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  const hasData = transactions && transactions.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>Nenhuma transação encontrada para este período.</p>
        </CardContent>
      </Card>
    );
  }

  const totalValue = transactions.reduce((sum, t) => sum + Number(t.valor), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Tags className="w-4 h-4" />
              <span className="text-xs">Categorias</span>
            </div>
            <p className="text-xl font-bold">{categoryAnalysis.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="w-4 h-4" />
              <span className="text-xs">Contas</span>
            </div>
            <p className="text-xl font-bold">{accountAnalysis.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs">Centros de Custo</span>
            </div>
            <p className="text-xl font-bold">{costCenterAnalysis.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs">Formas Pagamento</span>
            </div>
            <p className="text-xl font-bold">{paymentMethodAnalysis.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category (Pie) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tags className="w-5 h-5" />
              Por Categoria
            </CardTitle>
            <CardDescription>Distribuição por categoria de transação</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryAnalysis.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryAnalysis}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name.substring(0, 10)}${name.length > 10 ? '...' : ''} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Valor']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Account (Bar) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Por Conta
            </CardTitle>
            <CardDescription>Onde o dinheiro está entrando/saindo</CardDescription>
          </CardHeader>
          <CardContent>
            {accountAnalysis.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={accountAnalysis} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={100}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {accountAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Cost Center (Bar) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Por Centro de Custo
            </CardTitle>
            <CardDescription>Impacto no DRE por área</CardDescription>
          </CardHeader>
          <CardContent>
            {costCenterAnalysis.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costCenterAnalysis} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={120}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {costCenterAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Payment Method (Pie) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Por Forma de Pagamento
            </CardTitle>
            <CardDescription>Como o dinheiro está sendo movimentado</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethodAnalysis.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodAnalysis}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name.substring(0, 12)}${name.length > 12 ? '..' : ''} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {paymentMethodAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${formatCurrency(value)} (${props.payload.count} transações)`, 
                        'Valor'
                      ]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Categorias por Valor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryAnalysis.slice(0, 5).map((cat, idx) => {
              const percentage = (cat.value / totalValue) * 100;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-medium truncate">{cat.name}</span>
                      <span className="text-sm font-semibold ml-2">{formatCurrency(cat.value)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
