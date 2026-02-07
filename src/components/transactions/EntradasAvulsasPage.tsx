import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, Users, FileText, DollarSign, Plus,
  BarChart3, PieChart
} from 'lucide-react';
import { useTransactions, useTransactionKPIs } from '@/hooks/useTransactions';
import { TransactionsList } from './TransactionsList';
import { QuickTransactionModal } from './QuickTransactionModal';
import { formatCurrency } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';

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
const COLORS = ['hsl(var(--primary))', 'hsl(var(--income))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--expense))'];

export function EntradasAvulsasPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showModal, setShowModal] = useState(false);

  const { kpis } = useTransactionKPIs({
    competencia_ano: selectedYear,
    competencia_mes: selectedMonth,
    tipo_movimento: 'ENTRADA',
    natureza: 'AVULSA'
  });

  const { kpis: yearKpis } = useTransactionKPIs({
    competencia_ano: selectedYear,
    tipo_movimento: 'ENTRADA',
    natureza: 'AVULSA'
  });

  // Get yearly data for chart
  const { data: yearlyTransactions } = useTransactions({
    competencia_ano: selectedYear,
    tipo_movimento: 'ENTRADA',
    natureza: 'AVULSA'
  });

  // Build chart data by month
  const chartData = MONTH_LABELS.map((label, idx) => {
    const monthTransactions = yearlyTransactions?.filter(t => t.competencia_mes === idx + 1) || [];
    const total = monthTransactions.reduce((sum, t) => sum + Number(t.valor), 0);
    return { month: label, valor: total };
  });

  // Count unique clients
  const uniqueClients = new Set(yearlyTransactions?.map(t => t.cliente_id).filter(Boolean) || []);

  // Calculate ticket médio
  const ticketMedio = yearKpis.quantidadeTotal > 0 
    ? yearKpis.totalEsperado / yearKpis.quantidadeTotal 
    : 0;

  // Top clients ranking for avulsos
  const clientTotals = yearlyTransactions?.reduce((acc, t) => {
    const clientName = t.recurring_clients?.name || 'Sem cliente';
    if (!acc[clientName]) acc[clientName] = 0;
    acc[clientName] += Number(t.valor_pago || t.valor);
    return acc;
  }, {} as Record<string, number>) || {};

  const clientRanking = Object.entries(clientTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-income" />
          <h2 className="text-xl font-bold">Entradas Avulsas</h2>
          <Badge variant="outline" className="ml-2">Pontuais</Badge>
        </div>
        
        <div className="flex gap-2">
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

          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Entrada
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Receita do Mês
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
              <DollarSign className="w-4 h-4 text-income" />
              Receita Anual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-income">{formatCurrency(yearKpis.totalEsperado)}</p>
            <p className="text-xs text-muted-foreground">{yearKpis.quantidadeTotal} lançamentos no ano</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-info" />
              Clientes Avulsos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{uniqueClients.size}</p>
            <p className="text-xs text-muted-foreground">clientes únicos no ano</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-warning" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(ticketMedio)}</p>
            <p className="text-xs text-muted-foreground">por transação</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Entradas Avulsas por Mês ({selectedYear})
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
                  <Bar dataKey="valor" name="Valor" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Client ranking pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Top Clientes Avulsos ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={clientRanking}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name.substring(0, 10)}${name.length > 10 ? '...' : ''} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {clientRanking.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
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
              natureza: 'AVULSA'
            }}
          />
        </CardContent>
      </Card>

      {/* Quick Transaction Modal - pre-configured for Entrada Avulsa */}
      <QuickTransactionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        tipo="ENTRADA"
        natureza="AVULSA"
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
      />
    </div>
  );
}
