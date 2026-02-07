import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingDown, CheckCircle, Clock, AlertTriangle, RefreshCw, Plus,
  Wallet, BarChart3, Building2
} from 'lucide-react';
import { useTransactions, useTransactionKPIs } from '@/hooks/useTransactions';
import { useFixedExpenses, useGenerateFixedExpenseTransactions } from '@/hooks/useFixedExpenses';
import { useAccounts } from '@/hooks/useFinancialConfig';
import { TransactionsList } from './TransactionsList';
import { NewFixedExpenseModal } from './NewFixedExpenseModal';
import { formatCurrency } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function DespesasFixasPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const { data: fixedExpenses } = useFixedExpenses();
  const { data: accounts } = useAccounts();
  const generateMutation = useGenerateFixedExpenseTransactions();

  const { kpis } = useTransactionKPIs({
    competencia_ano: selectedYear,
    competencia_mes: selectedMonth,
    tipo_movimento: 'SAIDA',
    origem: 'DESPESA_FIXA'
  });

  const { kpis: yearKpis } = useTransactionKPIs({
    competencia_ano: selectedYear,
    tipo_movimento: 'SAIDA',
    origem: 'DESPESA_FIXA'
  });

  // Get yearly data for chart
  const { data: yearlyTransactions } = useTransactions({
    competencia_ano: selectedYear,
    tipo_movimento: 'SAIDA',
    origem: 'DESPESA_FIXA'
  });

  // Build chart data by month
  const chartData = MONTH_LABELS.map((label, idx) => {
    const monthTransactions = yearlyTransactions?.filter(t => t.competencia_mes === idx + 1) || [];
    const expected = monthTransactions.reduce((sum, t) => sum + Number(t.valor), 0);
    const paid = monthTransactions.filter(t => t.status === 'PAGO').reduce((sum, t) => sum + Number(t.valor_pago || t.valor), 0);
    return { month: label, previsto: expected, pago: paid };
  });

  // Top fixed expenses ranking
  const expenseRanking = fixedExpenses
    ?.map(e => ({ name: e.nome, valor: Number(e.valor) }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10) || [];

  // Group by account
  const byAccount = yearlyTransactions?.reduce((acc, t) => {
    const accountId = t.conta_id || 'sem-conta';
    if (!acc[accountId]) acc[accountId] = { total: 0, count: 0 };
    acc[accountId].total += Number(t.valor);
    acc[accountId].count++;
    return acc;
  }, {} as Record<string, { total: number; count: number }>) || {};

  const accountData = Object.entries(byAccount).map(([id, data]) => ({
    name: accounts?.find(a => a.id === id)?.name || 'Sem conta',
    ...data
  })).sort((a, b) => b.total - a.total);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleGenerateTransactions = async () => {
    try {
      await generateMutation.mutateAsync({ year: selectedYear, month: selectedMonth });
    } catch (error) {
      toast.error('Erro ao gerar transações');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-expense" />
          <h2 className="text-xl font-bold">Despesas Fixas</h2>
          <Badge variant="outline" className="ml-2">Recorrentes</Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleGenerateTransactions} disabled={generateMutation.isPending}>
            <RefreshCw className={`w-4 h-4 mr-2 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
            Gerar Lançamentos
          </Button>

          <Button onClick={() => setShowExpenseModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Despesa Fixa
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-info">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-info" />
              Despesas Cadastradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fixedExpenses?.length || 0}</p>
            <p className="text-xs text-muted-foreground">fixas ativas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-primary" />
              Previsto (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(kpis.totalEsperado)}</p>
            <p className="text-xs text-muted-foreground">{kpis.quantidadeTotal} lançamentos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-income">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-income" />
              Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-income">{formatCurrency(kpis.totalPago)}</p>
            <p className="text-xs text-muted-foreground">{kpis.quantidadePago} pagos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              Em Aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{formatCurrency(kpis.totalEmAberto)}</p>
            <p className="text-xs text-muted-foreground">{kpis.quantidadeEmAberto} pendentes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-expense">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-expense" />
              Atrasado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-expense">{formatCurrency(kpis.totalAtrasado)}</p>
            <p className="text-xs text-muted-foreground">{kpis.quantidadeAtrasado} atrasados</p>
          </CardContent>
        </Card>
      </div>

      {/* Annual summary */}
      <Card className="bg-gradient-to-br from-expense/10 to-expense/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Anual Previsto ({selectedYear})</p>
              <p className="text-2xl font-bold">{formatCurrency(yearKpis.totalEsperado)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Pago no Ano</p>
              <p className="text-xl font-bold text-income">{formatCurrency(yearKpis.totalPago)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Previsto x Pago ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="previsto" name="Previsto" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pago" name="Pago" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Maiores Despesas Fixas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {expenseRanking.map((expense, idx) => (
                <div key={expense.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-expense/10 text-expense text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-sm truncate max-w-[200px]">{expense.name}</span>
                  </div>
                  <p className="text-sm font-semibold text-expense">{formatCurrency(expense.valor)}/mês</p>
                </div>
              ))}
              {expenseRanking.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhuma despesa fixa cadastrada</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Despesas por Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accountData.slice(0, 6).map(acc => (
              <div key={acc.name} className="p-4 rounded-lg border bg-muted/20">
                <p className="font-medium text-sm truncate">{acc.name}</p>
                <p className="text-xl font-bold text-expense">{formatCurrency(acc.total)}</p>
                <p className="text-xs text-muted-foreground">{acc.count} lançamentos</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lançamentos do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsList 
            filters={{ 
              competencia_mes: selectedMonth, 
              competencia_ano: selectedYear,
              tipo_movimento: 'SAIDA',
              origem: 'DESPESA_FIXA'
            }}
          />
        </CardContent>
      </Card>

      {/* Dedicated Fixed Expense Modal */}
      <NewFixedExpenseModal
        open={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
      />
    </div>
  );
}
