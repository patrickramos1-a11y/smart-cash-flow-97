import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wallet, Search, Plus, ArrowUpRight, ArrowDownRight, 
  ArrowLeftRight, FileText, ChevronRight, Eye, TrendingUp, TrendingDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAccounts, useAccountCategories, useAccountTransfers, type Account } from '@/hooks/useFinancialConfig';
import { useTransactions } from '@/hooks/useTransactions';
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
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: categories, isLoading: categoriesLoading } = useAccountCategories();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions({});
  const { data: transfers } = useAccountTransfers();

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

  // Get transactions for selected account
  const accountTransactions = selectedAccount 
    ? transactions?.filter(t => t.conta_id === selectedAccount)
    : [];

  // Mock evolution data (will be calculated from real data in production)
  const evolutionData = MONTHS.map((m, i) => ({
    month: m,
    saldo: totalBalance * (0.7 + Math.random() * 0.3),
  }));

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
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
          <TabsTrigger value="transfers">Transferências</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Saldo Total */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Consolidado</p>
                  <p className="text-3xl font-bold text-foreground">{formatCurrency(totalBalance)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {accounts?.length || 0} contas ativas • {categoryBalances.length} categorias
                  </p>
                </div>
                <Wallet className="w-12 h-12 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          {/* Saldo por Categoria */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Saldo por Categoria</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categoryBalances.map(cat => (
                <Card 
                  key={cat.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
                    selectedCategory === cat.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedCategory(
                    selectedCategory === cat.id ? null : cat.id
                  )}
                >
                  <CardContent className="p-4">
                    <div 
                      className="w-3 h-3 rounded-full mb-2"
                      style={{ backgroundColor: cat.color || '#64748B' }}
                    />
                    <p className="text-xs text-muted-foreground truncate">{cat.name}</p>
                    <p className="text-lg font-bold">{formatCurrency(cat.totalBalance)}</p>
                    <p className="text-xs text-muted-foreground">{cat.accounts.length} contas</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Lista de Contas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg">Contas</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar conta..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Conta</Button>
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
                          "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                          selectedAccount === acc.id && "bg-muted border-primary"
                        )}
                        onClick={() => setSelectedAccount(selectedAccount === acc.id ? null : acc.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: (category?.color || '#64748B') + '20' }}
                          >
                            <Wallet className="w-5 h-5" style={{ color: category?.color || '#64748B' }} />
                          </div>
                          <div>
                            <p className="font-medium">{acc.name}</p>
                            <p className="text-sm text-muted-foreground">{category?.name || 'Sem categoria'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className={cn(
                            "font-semibold text-lg",
                            Number(acc.current_balance) >= 0 ? "text-income" : "text-expense"
                          )}>
                            {formatCurrency(Number(acc.current_balance))}
                          </p>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Extrato */}
          {selectedAccount && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Extrato - {accounts?.find(a => a.id === selectedAccount)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {!accountTransactions || accountTransactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nenhuma movimentação encontrada</p>
                  ) : (
                    accountTransactions.slice(0, 10).map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {t.tipo_movimento === 'ENTRADA' && <ArrowDownRight className="w-5 h-5 text-income" />}
                          {t.tipo_movimento === 'SAIDA' && <ArrowUpRight className="w-5 h-5 text-expense" />}
                          <div>
                            <p className="font-medium text-sm">{t.descricao || 'Sem descrição'}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(t.data_vencimento).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-semibold",
                            t.tipo_movimento === 'ENTRADA' && "text-income",
                            t.tipo_movimento === 'SAIDA' && "text-expense"
                          )}>
                            {t.tipo_movimento === 'SAIDA' ? '-' : '+'}
                            {formatCurrency(Number(t.valor))}
                          </p>
                          <Badge variant={t.status === 'PAGO' ? 'default' : 'secondary'} className="text-xs">
                            {t.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Evolution Tab */}
        <TabsContent value="evolution" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução do Saldo Consolidado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saldo" 
                      name="Saldo" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Saldo por conta ao longo do tempo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saldo Mensal por Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Conta</th>
                      {MONTHS.map(m => (
                        <th key={m} className="text-right py-3 px-2 font-medium text-muted-foreground">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accounts?.slice(0, 8).map(acc => (
                      <tr key={acc.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-4 font-medium">{acc.name}</td>
                        {MONTHS.map((_, i) => (
                          <td key={i} className="text-right py-2 px-2">
                            {formatCurrency(Number(acc.current_balance) * (0.8 + Math.random() * 0.4))}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfers Tab */}
        <TabsContent value="transfers" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5" />
                Transferências entre Contas
              </CardTitle>
              <Button size="sm">
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
    </div>
  );
}
