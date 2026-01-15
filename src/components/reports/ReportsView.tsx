import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock,
  Download,
  Calendar,
  FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { mockTransactions, formatCurrency, calculateClientProfitability } from '@/data/mockData';
import { cn } from '@/lib/utils';

const cashFlowData = [
  { date: '01/01', entrada: 5000, saida: 2000, saldo: 3000 },
  { date: '05/01', entrada: 8000, saida: 4500, saldo: 6500 },
  { date: '10/01', entrada: 12000, saida: 6000, saldo: 12500 },
  { date: '15/01', entrada: 15000, saida: 8000, saldo: 19500 },
  { date: '20/01', entrada: 18000, saida: 10000, saldo: 27500 },
];

const agingData = [
  { range: '0-7 dias', value: 6072, count: 2 },
  { range: '8-15 dias', value: 3036, count: 1 },
  { range: '16-30 dias', value: 0, count: 0 },
  { range: '30+ dias', value: 0, count: 0 },
];

export function ReportsView() {
  const [selectedReport, setSelectedReport] = useState<string>('cashflow');
  const clientProfitability = calculateClientProfitability(mockTransactions);

  const reports = [
    { id: 'cashflow', name: 'Fluxo de Caixa', icon: TrendingUp },
    { id: 'dre', name: 'DRE Simplificada', icon: BarChart3 },
    { id: 'ranking', name: 'Ranking de Clientes', icon: Users },
    { id: 'aging', name: 'Envelhecimento', icon: Clock },
  ];

  // Calculate DRE
  const totalRevenue = mockTransactions
    .filter(t => t.nature === 'ENTRADA')
    .reduce((sum, t) => sum + t.value, 0);
  const totalExpenses = mockTransactions
    .filter(t => t.nature === 'SAIDA')
    .reduce((sum, t) => sum + t.value, 0);
  const netResult = totalRevenue - totalExpenses;

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
        
        <div className="ml-auto flex items-center gap-2">
          <button className="btn-secondary">
            <Calendar className="w-4 h-4" />
            Janeiro 2026
          </button>
          <button className="btn-primary">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Cash Flow Report */}
      {selectedReport === 'cashflow' && (
        <div className="space-y-6">
          <div className="chart-container">
            <h3 className="text-lg font-semibold text-foreground mb-4">Fluxo de Caixa - Janeiro 2026</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
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
                    name="Saldo" 
                    stroke="hsl(var(--info))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--info))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* DRE Report */}
      {selectedReport === 'dre' && (
        <div className="chart-container max-w-2xl">
          <h3 className="text-lg font-semibold text-foreground mb-6">DRE Simplificada - Janeiro 2026</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-income-muted rounded-xl">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-income" />
                <span className="font-medium text-foreground">Receita Bruta</span>
              </div>
              <span className="text-xl font-bold text-income">{formatCurrency(totalRevenue)}</span>
            </div>

            <div className="ml-8 space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">(-) Receita Recorrente</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(mockTransactions.filter(t => t.nature === 'ENTRADA' && t.revenueType === 'RECORRENTE').reduce((s, t) => s + t.value, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">(-) Receita Pontual</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(mockTransactions.filter(t => t.nature === 'ENTRADA' && t.revenueType === 'PONTUAL').reduce((s, t) => s + t.value, 0))}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-expense-muted rounded-xl">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-expense" />
                <span className="font-medium text-foreground">(-) Despesas Totais</span>
              </div>
              <span className="text-xl font-bold text-expense">{formatCurrency(totalExpenses)}</span>
            </div>

            <div className="ml-8 space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">(-) Despesas Fixas</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(mockTransactions.filter(t => t.nature === 'SAIDA' && t.expenseType === 'FIXA').reduce((s, t) => s + t.value, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">(-) Despesas Variáveis</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(mockTransactions.filter(t => t.nature === 'SAIDA' && t.expenseType === 'VARIAVEL').reduce((s, t) => s + t.value, 0))}
                </span>
              </div>
            </div>

            <div className="h-px bg-border my-4" />

            <div className={cn(
              "flex items-center justify-between p-4 rounded-xl",
              netResult >= 0 ? "bg-income-muted" : "bg-expense-muted"
            )}>
              <div className="flex items-center gap-3">
                <FileText className={cn("w-5 h-5", netResult >= 0 ? "text-income" : "text-expense")} />
                <span className="font-semibold text-foreground">Resultado Líquido</span>
              </div>
              <span className={cn(
                "text-2xl font-bold",
                netResult >= 0 ? "text-income" : "text-expense"
              )}>
                {formatCurrency(netResult)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Client Ranking Report */}
      {selectedReport === 'ranking' && (
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-foreground mb-4">Ranking de Clientes por Lucro</h3>
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
                {clientProfitability.map((client, index) => (
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
        </div>
      )}

      {/* Aging Report */}
      {selectedReport === 'aging' && (
        <div className="space-y-6">
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
              {mockTransactions
                .filter(t => t.nature === 'ENTRADA' && t.status !== 'PAGO')
                .map((t) => (
                  <div 
                    key={t.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-foreground">{t.clientName}</p>
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-warning">{formatCurrency(t.value)}</p>
                      <p className="text-xs text-muted-foreground">
                        Venc: {t.dueDate?.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
