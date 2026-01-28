import { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock,
  Download,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DatePickerModal } from '@/components/modals/DatePickerModal';
import { DRECompleteView } from './DRECompleteView';
import { ExpenseAnalysisView } from './ExpenseAnalysisView';
import { toast } from 'sonner';
import { useTransactions } from '@/hooks/useTransactions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function ReportsView() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const [selectedReport, setSelectedReport] = useState<string>('dre');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const reports = [
    { id: 'dre', name: 'DRE Completa', icon: BarChart3 },
    { id: 'expenses', name: 'Análise de Despesas', icon: TrendingDown },
    { id: 'cashflow', name: 'Fluxo de Caixa', icon: TrendingUp },
    { id: 'ranking', name: 'Ranking de Clientes', icon: Users },
    { id: 'aging', name: 'Envelhecimento', icon: Clock },
  ];

  const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 
    'Maio', 'Junho', 'Julho', 'Agosto', 
    'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Fetch transactions for the selected year
  const { data: transactions, isLoading: transactionsLoading } = useTransactions({
    competencia_ano: selectedYear,
  });

  // Fetch all clients for ranking
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['recurring_clients_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_clients')
        .select('id, name')
        .eq('active', true);
      if (error) throw error;
      return data;
    },
  });

  // Calculate Cash Flow data from real transactions
  const cashFlowData = useMemo(() => {
    if (!transactions) return [];

    // Get last 6 months of data
    const months: { month: string; entrada: number; saida: number; saldo: number }[] = [];
    let runningBalance = 0;

    for (let i = 5; i >= 0; i--) {
      let targetMonth = currentMonth - i;
      let targetYear = currentYear;
      
      if (targetMonth <= 0) {
        targetMonth += 12;
        targetYear -= 1;
      }

      const monthTransactions = transactions.filter(
        t => t.competencia_mes === targetMonth && t.competencia_ano === targetYear
      );

      const entrada = monthTransactions
        .filter(t => t.tipo_movimento === 'ENTRADA' && t.status === 'PAGO')
        .reduce((sum, t) => sum + Number(t.valor_pago || t.valor), 0);

      const saida = monthTransactions
        .filter(t => t.tipo_movimento === 'SAIDA' && t.status === 'PAGO')
        .reduce((sum, t) => sum + Number(t.valor_pago || t.valor), 0);

      runningBalance += entrada - saida;

      months.push({
        month: MONTHS[targetMonth - 1].substring(0, 3),
        entrada,
        saida,
        saldo: runningBalance,
      });
    }

    return months;
  }, [transactions, currentMonth, currentYear]);

  // Calculate Client Ranking from real transactions
  const clientRanking = useMemo(() => {
    if (!transactions || !clients) return [];

    const clientData: Record<string, { 
      clientId: string; 
      clientName: string; 
      totalRevenue: number; 
      totalExpenses: number; 
      profit: number; 
      margin: number 
    }> = {};

    transactions.forEach(t => {
      if (!t.cliente_id) return;

      if (!clientData[t.cliente_id]) {
        const client = clients.find(c => c.id === t.cliente_id);
        clientData[t.cliente_id] = {
          clientId: t.cliente_id,
          clientName: client?.name || t.recurring_clients?.name || 'Desconhecido',
          totalRevenue: 0,
          totalExpenses: 0,
          profit: 0,
          margin: 0,
        };
      }

      if (t.tipo_movimento === 'ENTRADA') {
        clientData[t.cliente_id].totalRevenue += Number(t.valor);
      } else {
        clientData[t.cliente_id].totalExpenses += Number(t.valor);
      }
    });

    // Calculate profit and margin
    Object.values(clientData).forEach(client => {
      client.profit = client.totalRevenue - client.totalExpenses;
      client.margin = client.totalRevenue > 0 
        ? (client.profit / client.totalRevenue) * 100 
        : 0;
    });

    return Object.values(clientData)
      .filter(c => c.totalRevenue > 0)
      .sort((a, b) => b.profit - a.profit);
  }, [transactions, clients]);

  // Calculate Aging Report from real transactions
  const agingData = useMemo(() => {
    if (!transactions) return [
      { range: '0-7 dias', value: 0, count: 0 },
      { range: '8-15 dias', value: 0, count: 0 },
      { range: '16-30 dias', value: 0, count: 0 },
      { range: '30+ dias', value: 0, count: 0 },
    ];

    const today = new Date();
    const openTransactions = transactions.filter(
      t => t.tipo_movimento === 'ENTRADA' && t.status !== 'PAGO'
    );

    const ranges = [
      { range: '0-7 dias', min: 0, max: 7, value: 0, count: 0 },
      { range: '8-15 dias', min: 8, max: 15, value: 0, count: 0 },
      { range: '16-30 dias', min: 16, max: 30, value: 0, count: 0 },
      { range: '30+ dias', min: 31, max: Infinity, value: 0, count: 0 },
    ];

    openTransactions.forEach(t => {
      const dueDate = new Date(t.data_vencimento);
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      for (const r of ranges) {
        if (daysOverdue >= r.min && daysOverdue <= r.max) {
          r.value += Number(t.valor);
          r.count += 1;
          break;
        }
      }
    });

    return ranges;
  }, [transactions]);

  // Open transactions for aging list
  const openTransactionsList = useMemo(() => {
    if (!transactions) return [];
    return transactions
      .filter(t => t.tipo_movimento === 'ENTRADA' && t.status !== 'PAGO')
      .slice(0, 10);
  }, [transactions]);

  const handleExport = (format: 'xlsx' | 'pdf') => {
    toast.success(`Exportando relatório em ${format.toUpperCase()}...`);
    
    if (format === 'xlsx') {
      let csvContent = '';
      
      if (selectedReport === 'ranking' && clientRanking.length > 0) {
        csvContent = 'Cliente,Receita,Despesas,Lucro,Margem\n';
        clientRanking.forEach(client => {
          csvContent += `${client.clientName},${client.totalRevenue},${client.totalExpenses},${client.profit},${client.margin.toFixed(1)}%\n`;
        });
      } else if (selectedReport === 'cashflow' && cashFlowData.length > 0) {
        csvContent = 'Mês,Entradas,Saídas,Saldo\n';
        cashFlowData.forEach(row => {
          csvContent += `${row.month},${row.entrada},${row.saida},${row.saldo}\n`;
        });
      }
      
      if (csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_${selectedReport}_${MONTHS[selectedMonth - 1]}_${selectedYear}.csv`;
        link.click();
        toast.success('Relatório exportado com sucesso!');
      }
    } else {
      toast.info('Abrindo visualização para impressão...');
      window.print();
    }
  };

  const handleDateSelect = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    toast.success(`Período alterado para ${MONTHS[month - 1]} ${year}`);
  };

  const isLoading = transactionsLoading || clientsLoading;

  return (
    <div className="space-y-6">
      {/* Report Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all",
                selectedReport === report.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4" />
              {report.name}
            </button>
          );
        })}
        
        {(selectedReport === 'cashflow' || selectedReport === 'ranking' || selectedReport === 'aging') && (
          <div className="ml-auto flex items-center gap-2">
            <button 
              className="btn-secondary"
              onClick={() => setShowDatePicker(true)}
            >
              <Calendar className="w-4 h-4" />
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </button>
            <div className="flex gap-1">
              <button 
                className="btn-primary"
                onClick={() => handleExport('xlsx')}
              >
                <Download className="w-4 h-4" />
                XLSX
              </button>
              <button 
                className="btn-secondary"
                onClick={() => handleExport('pdf')}
              >
                PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DRE Complete Report */}
      {selectedReport === 'dre' && <DRECompleteView />}

      {/* Expense Analysis Report */}
      {selectedReport === 'expenses' && <ExpenseAnalysisView />}

      {/* Cash Flow Report */}
      {selectedReport === 'cashflow' && (
        <div className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <div className="chart-container">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Fluxo de Caixa - Últimos 6 Meses
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cashFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                      dataKey="entrada" 
                      name="Entradas" 
                      stroke="hsl(var(--income))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--income))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saida" 
                      name="Saídas" 
                      stroke="hsl(var(--expense))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--expense))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saldo" 
                      name="Saldo Acumulado" 
                      stroke="hsl(var(--info))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--info))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Client Ranking Report */}
      {selectedReport === 'ranking' && (
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-foreground mb-4">Ranking de Clientes por Lucro</h3>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : clientRanking.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum cliente com transações encontrado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Receita</th>
                    <th>Despesas</th>
                    <th>Lucro</th>
                    <th>Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {clientRanking.map((client, index) => (
                    <tr key={client.clientId}>
                      <td>
                        <span className={cn(
                          "w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold text-white",
                          index === 0 && "bg-yellow-500",
                          index === 1 && "bg-gray-400",
                          index === 2 && "bg-amber-600",
                          index > 2 && "bg-muted text-muted-foreground"
                        )}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="font-medium">{client.clientName}</td>
                      <td className="text-income font-semibold">{formatCurrency(client.totalRevenue)}</td>
                      <td className="text-expense">{formatCurrency(client.totalExpenses)}</td>
                      <td className={cn(
                        "font-bold",
                        client.profit >= 0 ? "text-income" : "text-expense"
                      )}>
                        {formatCurrency(client.profit)}
                      </td>
                      <td>
                        <span className={cn(
                          "px-2 py-1 rounded text-sm font-medium",
                          client.margin >= 50 && "bg-income-muted text-income",
                          client.margin >= 20 && client.margin < 50 && "bg-warning-muted text-warning",
                          client.margin < 20 && "bg-expense-muted text-expense"
                        )}>
                          {client.margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Aging Report */}
      {selectedReport === 'aging' && (
        <div className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {agingData.map((item, index) => (
                  <div 
                    key={item.range}
                    className={cn(
                      "kpi-card",
                      index === 0 && "kpi-card-income",
                      index === 1 && "kpi-card-warning",
                      index === 2 && "kpi-card-expense",
                      index === 3 && "kpi-card-expense"
                    )}
                  >
                    <p className="text-sm text-muted-foreground mb-1">{item.range}</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      index === 0 && "text-income",
                      index === 1 && "text-warning",
                      index >= 2 && "text-expense"
                    )}>
                      {formatCurrency(item.value)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{item.count} títulos</p>
                  </div>
                ))}
              </div>

              <div className="chart-container">
                <h3 className="text-lg font-semibold text-foreground mb-4">Clientes com Valores em Aberto</h3>
                <div className="space-y-3">
                  {openTransactionsList.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma transação em aberto encontrada
                    </p>
                  ) : (
                    openTransactionsList.map((t) => (
                      <div 
                        key={t.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {t.recurring_clients?.name || 'Cliente não identificado'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t.descricao || 'Sem descrição'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-warning">{formatCurrency(Number(t.valor))}</p>
                          <p className="text-xs text-muted-foreground">
                            Venc: {new Date(t.data_vencimento).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Date Picker Modal */}
      <DatePickerModal
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={handleDateSelect}
        currentMonth={selectedMonth}
        currentYear={selectedYear}
      />
    </div>
  );
}
