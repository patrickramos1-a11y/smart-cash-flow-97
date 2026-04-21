import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, Users, CheckCircle, Clock, AlertTriangle, RefreshCw,
  DollarSign, BarChart3, Plus
} from 'lucide-react';
import { useTransactions, useTransactionKPIs } from '@/hooks/useTransactions';
import { useRecurringContracts, useRecurringKPIs } from '@/hooks/useRecurringContracts';
import { TransactionsList } from './TransactionsList';
import { NewRecurringContractModal } from '@/components/contracts/NewRecurringContractModal';
import { MonthYearNavigator } from '@/components/ui/month-year-navigator';
import { formatCurrency } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function EntradasRecorrentesPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showContractModal, setShowContractModal] = useState(false);

  const { kpis: recurringKpis } = useRecurringKPIs(selectedYear);
  const { data: contracts } = useRecurringContracts();
  
  const { kpis } = useTransactionKPIs({
    competencia_ano: selectedYear,
    competencia_mes: selectedMonth,
    tipo_movimento: 'ENTRADA',
    natureza: 'RECORRENTE'
  });

  const { data: yearlyTransactions } = useTransactions({
    competencia_ano: selectedYear,
    tipo_movimento: 'ENTRADA',
    natureza: 'RECORRENTE'
  });

  const chartData = MONTH_LABELS.map((label, idx) => {
    const monthTransactions = yearlyTransactions?.filter(t => t.competencia_mes === idx + 1) || [];
    const expected = monthTransactions.reduce((sum, t) => sum + Number(t.valor), 0);
    const paid = monthTransactions.filter(t => t.status === 'PAGO').reduce((sum, t) => sum + Number(t.valor_pago || t.valor), 0);
    return { month: label, previsto: expected, realizado: paid };
  });

  const clientTotals = yearlyTransactions?.reduce((acc, t) => {
    const clientName = t.recurring_clients?.name || 'N/A';
    if (!acc[clientName]) acc[clientName] = { paid: 0, open: 0 };
    if (t.status === 'PAGO') {
      acc[clientName].paid += Number(t.valor_pago || t.valor);
    } else {
      acc[clientName].open += Number(t.valor);
    }
    return acc;
  }, {} as Record<string, { paid: number; open: number }>) || {};

  const clientRanking = Object.entries(clientTotals)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => (b.paid + b.open) - (a.paid + a.open))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-income" />
          <h2 className="text-xl font-bold">Entradas Recorrentes</h2>
          <Badge variant="outline" className="ml-2">Contratos</Badge>
        </div>
        <Button onClick={() => setShowContractModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Contrato
        </Button>
      </div>

      <MonthYearNavigator 
        month={selectedMonth} 
        year={selectedYear} 
        onMonthChange={setSelectedMonth} 
        onYearChange={setSelectedYear} 
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-info">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-info" />
              Clientes Recorrentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recurringKpis.totalClients}</p>
            <p className="text-xs text-muted-foreground">{contracts?.length || 0} contratos ativos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
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
              Recebido
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
              Inadimplência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-expense">{formatCurrency(kpis.totalAtrasado)}</p>
            <p className="text-xs text-muted-foreground">{kpis.quantidadeAtrasado} atrasados</p>
          </CardContent>
        </Card>
      </div>

      {/* Annual KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Previsto Anual ({selectedYear})</p>
            <p className="text-2xl font-bold">{formatCurrency(recurringKpis.expectedValueYearly)}</p>
            <p className="text-xs text-muted-foreground mt-1">{recurringKpis.totalMinimumWagesYearly.toFixed(1)} SM total</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-income/10 to-income/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Recebido Anual</p>
            <p className="text-2xl font-bold text-income">{formatCurrency(recurringKpis.paidValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {((recurringKpis.paidValue / (recurringKpis.expectedValueYearly || 1)) * 100).toFixed(0)}% do previsto
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-expense/10 to-expense/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Inadimplência Total</p>
            <p className="text-2xl font-bold text-expense">{formatCurrency(recurringKpis.overdueValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{recurringKpis.overdueClients.length} clientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Previsto x Realizado ({selectedYear})
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
                  <Bar dataKey="previsto" name="Previsto" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realizado" name="Recebido" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Ranking de Clientes ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {clientRanking.map((client, idx) => (
                <div key={client.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-sm truncate max-w-[200px]">{client.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-income">{formatCurrency(client.paid)}</p>
                    {client.open > 0 && (
                      <p className="text-xs text-warning">{formatCurrency(client.open)} em aberto</p>
                    )}
                  </div>
                </div>
              ))}
              {clientRanking.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhum cliente encontrado</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transações do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsList 
            filters={{ 
              competencia_mes: selectedMonth, 
              competencia_ano: selectedYear,
              tipo_movimento: 'ENTRADA',
              natureza: 'RECORRENTE'
            }}
            bulkContext="ENTRADAS_RECORRENTES"
          />
        </CardContent>
      </Card>

      <NewRecurringContractModal
        open={showContractModal}
        onClose={() => setShowContractModal(false)}
        defaultYear={selectedYear}
      />
    </div>
  );
}
