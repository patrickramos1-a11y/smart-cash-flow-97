import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wallet, Search, Plus, ArrowUpRight, ArrowDownRight, 
  ArrowLeftRight, FileText, ChevronRight, TrendingUp, TrendingDown, Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Area } from 'recharts';
import { useAccounts, useAccountCategories, useAccountTransfers, type Account } from '@/hooks/useFinancialConfig';
import { useTransactions } from '@/hooks/useTransactions';
import { useRecurringKPIs } from '@/hooks/useRecurringContracts';
import { useFixedExpenses } from '@/hooks/useFixedExpenses';
import { TransferModal } from './TransferModal';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function AccountsView() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [periodFilter, setPeriodFilter] = useState<'12m' | 'year' | 'month'>('year');

  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: categories, isLoading: categoriesLoading } = useAccountCategories();
  const { data: allTransactions, isLoading: transactionsLoading } = useTransactions({});
  const { data: transfers } = useAccountTransfers();
  const { data: fixedExpenses } = useFixedExpenses();
  const { kpis: recurringKpis } = useRecurringKPIs(selectedYear);

  const isLoading = accountsLoading || categoriesLoading;

  // Calculate totals
  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.current_balance), 0) || 0;
  
  // Group accounts by category
  const categoryBalances = categories?.map(cat => {
    const categoryAccounts = accounts?.filter(acc => acc.category_id === cat.id) || [];
    const totalCatBalance = categoryAccounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0);
    return {
      ...cat,
      accounts: categoryAccounts,
      totalBalance: totalCatBalance,
    };
  }) || [];

  // Filter accounts
  const filteredAccounts = accounts?.filter(acc => 
    acc.active && 
    acc.name.toLowerCase().includes(search.toLowerCase()) &&
    (!selectedCategory || acc.category_id === selectedCategory)
  ) || [];

  // Get transactions for selected account filtered by period
  const getAccountTransactions = useMemo(() => {
    if (!selectedAccount || !allTransactions) return [];
    
    return allTransactions.filter(t => {
      if (t.account_id !== selectedAccount) return false;
      
      if (periodFilter === '12m') {
        // Last 12 months
        const txDate = new Date(t.competencia_ano, t.competencia_mes - 1);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        return txDate >= twelveMonthsAgo;
      } else if (periodFilter === 'year') {
        return t.competencia_ano === selectedYear;
      } else if (periodFilter === 'month') {
        return t.competencia_ano === currentYear && t.competencia_mes === currentMonth;
      }
      return true;
    });
  }, [selectedAccount, allTransactions, periodFilter, selectedYear, currentYear, currentMonth]);

  // Build 12-month evolution data with projections
  const evolutionData = useMemo(() => {
    const data = MONTHS.map((month, idx) => {
      const monthNum = idx + 1;
      const isPast = monthNum <= currentMonth || selectedYear < currentYear;
      
      // Get actual transactions for this month
      const monthTransactions = allTransactions?.filter(t => 
        t.competencia_ano === selectedYear && t.competencia_mes === monthNum
      ) || [];
      
      const entradas = monthTransactions
        .filter(t => t.tipo_movimento === 'ENTRADA')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      const saidas = monthTransactions
        .filter(t => t.tipo_movimento === 'SAIDA')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      // For future months, project based on recurring
      let projecaoEntrada = 0;
      let projecaoSaida = 0;
      
      if (!isPast && selectedYear >= currentYear) {
        // Projected recurring income
        projecaoEntrada = recurringKpis.expectedValueMonthly;
        
        // Projected fixed expenses
        projecaoSaida = fixedExpenses?.reduce((sum, e) => sum + Number(e.valor), 0) || 0;
      }
      
      return {
        month,
        entradas: isPast ? entradas : 0,
        saidas: isPast ? saidas : 0,
        projecaoEntrada: !isPast ? projecaoEntrada : 0,
        projecaoSaida: !isPast ? projecaoSaida : 0,
        saldo: isPast ? entradas - saidas : projecaoEntrada - projecaoSaida,
        isProjection: !isPast,
      };
    });
    
    // Calculate cumulative balance
    let cumulative = totalBalance;
    return data.map((d, idx) => {
      if (idx === 0) {
        cumulative = totalBalance;
      }
      cumulative += d.saldo;
      return { ...d, saldoAcumulado: cumulative };
    });
  }, [allTransactions, selectedYear, currentYear, currentMonth, recurringKpis, fixedExpenses, totalBalance]);

  // Account-specific 12-month data
  const accountEvolutionData = useMemo(() => {
    if (!selectedAccount) return [];
    
    const account = accounts?.find(a => a.id === selectedAccount);
    const accountBalance = Number(account?.current_balance || 0);
    
    return MONTHS.map((month, idx) => {
      const monthNum = idx + 1;
      const isPast = monthNum <= currentMonth || selectedYear < currentYear;
      
      const monthTransactions = allTransactions?.filter(t => 
        t.account_id === selectedAccount &&
        t.competencia_ano === selectedYear && 
        t.competencia_mes === monthNum
      ) || [];
      
      const entradas = monthTransactions
        .filter(t => t.tipo_movimento === 'ENTRADA')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      const saidas = monthTransactions
        .filter(t => t.tipo_movimento === 'SAIDA')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      return {
        month,
        entradas,
        saidas,
        saldo: entradas - saidas,
        isPast,
      };
    });
  }, [selectedAccount, allTransactions, accounts, selectedYear, currentYear, currentMonth]);

  // Top categories for selected account
  const topCategoriesForAccount = useMemo(() => {
    if (!selectedAccount) return [];
    
    const categoryTotals = getAccountTransactions.reduce((acc, t) => {
      if (t.tipo_movimento !== 'SAIDA') return acc;
      const catId = t.transaction_category_id || 'sem-categoria';
      if (!acc[catId]) acc[catId] = 0;
      acc[catId] += Number(t.valor);
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categoryTotals)
      .map(([id, value]) => ({
        id,
        name: 'Categoria', // Would need categories lookup
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [selectedAccount, getAccountTransactions]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:space-y-6">
      {/* Period Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-20 lg:w-24 h-8 lg:h-10 text-xs lg:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          <Button 
            variant={periodFilter === '12m' ? 'default' : 'outline'} 
            size="sm"
            className="text-xs whitespace-nowrap h-8"
            onClick={() => setPeriodFilter('12m')}
          >
            12 meses
          </Button>
          <Button 
            variant={periodFilter === 'year' ? 'default' : 'outline'} 
            size="sm"
            className="text-xs whitespace-nowrap h-8"
            onClick={() => setPeriodFilter('year')}
          >
            Ano
          </Button>
          <Button 
            variant={periodFilter === 'month' ? 'default' : 'outline'} 
            size="sm"
            className="text-xs whitespace-nowrap h-8"
            onClick={() => setPeriodFilter('month')}
          >
            Mês Atual
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto -mx-3 px-3 lg:mx-0 lg:px-0">
          <TabsList className="inline-flex w-auto min-w-full lg:min-w-0 h-9 lg:h-10">
            <TabsTrigger value="overview" className="text-xs lg:text-sm">Visão Geral</TabsTrigger>
            <TabsTrigger value="evolution" className="text-xs lg:text-sm">Evolução</TabsTrigger>
            <TabsTrigger value="projection" className="text-xs lg:text-sm">Projeção</TabsTrigger>
            <TabsTrigger value="transfers" className="text-xs lg:text-sm">Transferências</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 lg:mt-6 space-y-4 lg:space-y-6">
          {/* Saldo Total */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Saldo Consolidado</p>
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">{formatCurrency(totalBalance)}</p>
                  <p className="text-xs lg:text-sm text-muted-foreground mt-0.5 lg:mt-1">
                    {accounts?.length || 0} contas • {categoryBalances.length} categorias
                  </p>
                </div>
                <Wallet className="w-8 h-8 lg:w-12 lg:h-12 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          {/* Saldo por Categoria */}
          <div>
            <h2 className="text-sm lg:text-lg font-semibold mb-3 lg:mb-4">Saldo por Categoria</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible -mx-1 px-1 lg:mx-0 lg:px-0">
              {categoryBalances.map(cat => (
                <Card 
                  key={cat.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg flex-shrink-0 w-36 lg:w-auto",
                    selectedCategory === cat.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedCategory(
                    selectedCategory === cat.id ? null : cat.id
                  )}
                >
                  <CardContent className="p-3 lg:p-4">
                    <div 
                      className="w-3 h-3 rounded-full mb-1.5"
                      style={{ backgroundColor: cat.color || '#64748B' }}
                    />
                    <p className="text-[10px] lg:text-xs text-muted-foreground truncate">{cat.name}</p>
                    <p className="text-sm lg:text-lg font-bold">{formatCurrency(cat.totalBalance)}</p>
                    <p className="text-[10px] lg:text-xs text-muted-foreground">{cat.accounts.length} contas</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Lista de Contas */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pb-3 lg:pb-4">
              <CardTitle className="text-sm lg:text-lg">Contas</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-8 lg:h-10 text-xs lg:text-sm w-full sm:w-48 lg:w-64"
                  />
                </div>
                <Button size="sm" className="h-8 text-xs lg:text-sm whitespace-nowrap"><Plus className="w-3.5 h-3.5 mr-1" /> Nova</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredAccounts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma conta encontrada</p>
                ) : (
                  filteredAccounts.map(acc => {
                    const category = categories?.find(c => c.id === acc.category_id);
                    return (
                      <div 
                        key={acc.id}
                        className={cn(
                          "flex items-center justify-between p-3 lg:p-4 rounded-lg border cursor-pointer transition-all active:bg-muted/50 hover:bg-muted/50",
                          selectedAccount === acc.id && "bg-muted border-primary"
                        )}
                        onClick={() => setSelectedAccount(selectedAccount === acc.id ? null : acc.id)}
                      >
                        <div className="flex items-center gap-2.5 lg:gap-3 min-w-0 flex-1">
                          <div 
                            className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: (category?.color || '#64748B') + '20' }}
                          >
                            <Wallet className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: category?.color || '#64748B' }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{acc.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{category?.name || 'Sem categoria'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
                          <p className={cn(
                            "font-semibold text-sm lg:text-lg",
                            Number(acc.current_balance) >= 0 ? "text-income" : "text-expense"
                          )}>
                            {formatCurrency(Number(acc.current_balance))}
                          </p>
                          <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground hidden sm:block" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Detail */}
          {selectedAccount && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {accounts?.find(a => a.id === selectedAccount)?.name} - Evolução Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accountEvolutionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Legend />
                      <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Evolution Tab */}
        <TabsContent value="evolution" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução do Saldo Consolidado - {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="saldoAcumulado" name="Saldo Acumulado" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly summary table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Mês</th>
                      <th className="text-right py-3 px-2 font-medium text-income">Entradas</th>
                      <th className="text-right py-3 px-2 font-medium text-expense">Saídas</th>
                      <th className="text-right py-3 px-2 font-medium">Saldo Mês</th>
                      <th className="text-right py-3 px-2 font-medium text-primary">Saldo Acumulado</th>
                      <th className="text-center py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evolutionData.map((row, idx) => (
                      <tr key={row.month} className={cn("border-b border-border/50 hover:bg-muted/30", row.isProjection && "opacity-70")}>
                        <td className="py-2 px-4 font-medium flex items-center gap-2">
                          {row.month}
                          {row.isProjection && <Badge variant="outline" className="text-xs">Projeção</Badge>}
                        </td>
                        <td className="text-right py-2 px-2 text-income">
                          {formatCurrency(row.entradas + row.projecaoEntrada)}
                        </td>
                        <td className="text-right py-2 px-2 text-expense">
                          {formatCurrency(row.saidas + row.projecaoSaida)}
                        </td>
                        <td className={cn("text-right py-2 px-2 font-medium", row.saldo >= 0 ? "text-income" : "text-expense")}>
                          {formatCurrency(row.saldo)}
                        </td>
                        <td className="text-right py-2 px-2 font-semibold text-primary">
                          {formatCurrency(row.saldoAcumulado)}
                        </td>
                        <td className="text-center py-2 px-2">
                          {row.saldo >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-income inline" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-expense inline" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projection Tab */}
        <TabsContent value="projection" className="mt-6 space-y-6">
          <Card className="bg-gradient-to-br from-info/10 to-info/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Calendar className="w-10 h-10 text-info" />
                <div>
                  <p className="text-sm text-muted-foreground">Projeção até Dezembro {selectedYear}</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(evolutionData[11]?.saldoAcumulado || totalBalance)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Baseado em receita recorrente de {formatCurrency(recurringKpis.expectedValueMonthly)}/mês
                    e despesas fixas de {formatCurrency(fixedExpenses?.reduce((s, e) => s + Number(e.valor), 0) || 0)}/mês
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Projeção de Saldo até Dezembro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Area type="monotone" dataKey="saldoAcumulado" name="Saldo Projetado" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Bar dataKey="projecaoEntrada" name="Entrada Projetada" fill="hsl(var(--income) / 0.5)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="projecaoSaida" name="Saída Projetada" fill="hsl(var(--expense) / 0.5)" radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Projection assumptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Premissas de Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receita Recorrente Mensal</span>
                    <span className="font-semibold text-income">{formatCurrency(recurringKpis.expectedValueMonthly)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clientes Ativos</span>
                    <span className="font-semibold">{recurringKpis.totalClients}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SM Total/Mês</span>
                    <span className="font-semibold">{recurringKpis.totalMinimumWagesMonthly.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Premissas de Despesa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Despesas Fixas Mensais</span>
                    <span className="font-semibold text-expense">
                      {formatCurrency(fixedExpenses?.reduce((s, e) => s + Number(e.valor), 0) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantidade de Fixas</span>
                    <span className="font-semibold">{fixedExpenses?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transfers Tab */}
        <TabsContent value="transfers" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5" />
                Transferências entre Contas
              </CardTitle>
              <Button size="sm" onClick={() => setShowTransferModal(true)}>
                <Plus className="w-4 h-4 mr-1" /> Nova Transferência
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Transferências não afetam o DRE, apenas redistribuem o saldo entre contas.
              </p>
              
              {!transfers || transfers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma transferência registrada</p>
              ) : (
                <div className="space-y-2">
                  {transfers.map(t => {
                    const fromAccount = accounts?.find(a => a.id === t.from_account_id);
                    const toAccount = accounts?.find(a => a.id === t.to_account_id);
                    return (
                      <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <ArrowLeftRight className="w-5 h-5 text-info" />
                          <div>
                            <p className="font-medium">
                              {fromAccount?.name || 'Conta Origem'} → {toAccount?.name || 'Conta Destino'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(t.transfer_date).toLocaleDateString('pt-BR')}
                              {t.notes && <span className="ml-2 text-xs">• {t.notes}</span>}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-info">{formatCurrency(Number(t.amount))}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transfer Modal */}
      <TransferModal 
        open={showTransferModal} 
        onClose={() => setShowTransferModal(false)} 
      />
    </div>
  );
}
