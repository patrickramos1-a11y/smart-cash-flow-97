import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, TrendingDown, Download, ChevronDown, ChevronRight,
  BarChart3, Percent, DollarSign
} from 'lucide-react';
import { useDREData } from '@/hooks/useDREReport';
import { cn } from '@/lib/utils';

const MONTHS = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

export function DRECompleteView() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useDREData(selectedYear);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Erro ao carregar dados do DRE
        </CardContent>
      </Card>
    );
  }

  const { totals, indicators, lines } = data;

  // Group lines by DRE section
  const revenueLines = lines.filter(l => !l.isExpense);
  const expenseLines = lines.filter(l => l.isExpense);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">DRE Completa - 15 Grupos</h2>
          <p className="text-sm text-muted-foreground">
            Demonstração do Resultado do Exercício
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-income">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Margem Bruta</p>
                <p className="text-2xl font-bold text-income">{formatPercent(indicators.margemBruta)}</p>
              </div>
              <Percent className="w-8 h-8 text-income/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Margem Operacional</p>
                <p className="text-2xl font-bold text-primary">{formatPercent(indicators.margemOperacional)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-l-4",
          indicators.margemLiquida >= 0 ? "border-l-income" : "border-l-expense"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Margem Líquida</p>
                <p className={cn(
                  "text-2xl font-bold",
                  indicators.margemLiquida >= 0 ? "text-income" : "text-expense"
                )}>
                  {formatPercent(indicators.margemLiquida)}
                </p>
              </div>
              <DollarSign className={cn(
                "w-8 h-8",
                indicators.margemLiquida >= 0 ? "text-income/60" : "text-expense/60"
              )} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DRE Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Demonstração de Resultado - {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold w-64">Descrição</th>
                  {MONTHS.map(m => (
                    <th key={m} className="text-right py-3 px-2 font-semibold text-xs">{m}</th>
                  ))}
                  <th className="text-right py-3 px-4 font-semibold">TOTAL</th>
                  <th className="text-right py-3 px-4 font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {/* Receita Bruta */}
                <tr className="bg-income/10 font-semibold">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-income" />
                    RECEITA BRUTA
                  </td>
                  {MONTHS.map((_, i) => {
                    const monthValue = revenueLines.reduce((sum, l) => sum + (l.values[i + 1] || 0), 0);
                    return (
                      <td key={i} className="text-right py-3 px-2 text-income">
                        {monthValue > 0 ? formatCurrency(monthValue) : '-'}
                      </td>
                    );
                  })}
                  <td className="text-right py-3 px-4 text-income font-bold">
                    {formatCurrency(totals.receitaBruta)}
                  </td>
                  <td className="text-right py-3 px-4 text-income">100%</td>
                </tr>

                {/* Revenue details (expandable) */}
                {revenueLines.map(line => (
                  <tr key={line.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-4 pl-8 text-muted-foreground">{line.label}</td>
                    {MONTHS.map((_, i) => (
                      <td key={i} className="text-right py-2 px-2 text-sm">
                        {line.values[i + 1] ? formatCurrency(line.values[i + 1]) : '-'}
                      </td>
                    ))}
                    <td className="text-right py-2 px-4">{formatCurrency(line.total)}</td>
                    <td className="text-right py-2 px-4 text-muted-foreground">
                      {totals.receitaBruta > 0 ? formatPercent((line.total / totals.receitaBruta) * 100) : '-'}
                    </td>
                  </tr>
                ))}

                {/* Deduções */}
                <tr className="bg-expense/5 font-medium">
                  <td className="py-3 px-4">(-) Deduções da Receita Bruta</td>
                  {MONTHS.map((_, i) => (
                    <td key={i} className="text-right py-3 px-2 text-expense">-</td>
                  ))}
                  <td className="text-right py-3 px-4 text-expense">
                    {formatCurrency(totals.deducoes)}
                  </td>
                  <td className="text-right py-3 px-4 text-expense">
                    {totals.receitaBruta > 0 ? formatPercent((totals.deducoes / totals.receitaBruta) * 100) : '-'}
                  </td>
                </tr>

                {/* Receita Líquida */}
                <tr className="bg-income/20 font-bold border-y border-income/30">
                  <td className="py-3 px-4">= RECEITA LÍQUIDA</td>
                  {MONTHS.map((_, i) => (
                    <td key={i} className="text-right py-3 px-2 text-income">-</td>
                  ))}
                  <td className="text-right py-3 px-4 text-income text-lg">
                    {formatCurrency(totals.receitaLiquida)}
                  </td>
                  <td className="text-right py-3 px-4 text-income">
                    {totals.receitaBruta > 0 ? formatPercent((totals.receitaLiquida / totals.receitaBruta) * 100) : '-'}
                  </td>
                </tr>

                {/* Custos Operacionais */}
                <tr className="bg-expense/5 font-medium">
                  <td className="py-3 px-4">(-) Custos Operacionais</td>
                  {MONTHS.map((_, i) => (
                    <td key={i} className="text-right py-3 px-2 text-expense">-</td>
                  ))}
                  <td className="text-right py-3 px-4 text-expense">
                    {formatCurrency(totals.custosOperacionais)}
                  </td>
                  <td className="text-right py-3 px-4 text-expense">
                    {totals.receitaBruta > 0 ? formatPercent((totals.custosOperacionais / totals.receitaBruta) * 100) : '-'}
                  </td>
                </tr>

                {/* Lucro Bruto */}
                <tr className="bg-income/20 font-bold border-y border-income/30">
                  <td className="py-3 px-4">= LUCRO BRUTO</td>
                  {MONTHS.map((_, i) => (
                    <td key={i} className="text-right py-3 px-2 text-income">-</td>
                  ))}
                  <td className="text-right py-3 px-4 text-income text-lg">
                    {formatCurrency(totals.lucroBruto)}
                  </td>
                  <td className="text-right py-3 px-4 text-income">
                    {formatPercent(indicators.margemBruta)}
                  </td>
                </tr>

                {/* Despesas Operacionais Header */}
                <tr className="bg-expense/10 font-semibold">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-expense" />
                    DESPESAS OPERACIONAIS
                  </td>
                  {MONTHS.map((_, i) => {
                    const monthValue = expenseLines.reduce((sum, l) => sum + (l.values[i + 1] || 0), 0);
                    return (
                      <td key={i} className="text-right py-3 px-2 text-expense">
                        {monthValue > 0 ? formatCurrency(monthValue) : '-'}
                      </td>
                    );
                  })}
                  <td className="text-right py-3 px-4 text-expense font-bold">
                    {formatCurrency(totals.despesasOperacionais)}
                  </td>
                  <td className="text-right py-3 px-4 text-expense">
                    {totals.receitaBruta > 0 ? formatPercent((totals.despesasOperacionais / totals.receitaBruta) * 100) : '-'}
                  </td>
                </tr>

                {/* Expense details */}
                {expenseLines.map(line => (
                  <tr key={line.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-4 pl-8 text-muted-foreground">{line.label}</td>
                    {MONTHS.map((_, i) => (
                      <td key={i} className="text-right py-2 px-2 text-sm">
                        {line.values[i + 1] ? formatCurrency(line.values[i + 1]) : '-'}
                      </td>
                    ))}
                    <td className="text-right py-2 px-4">{formatCurrency(line.total)}</td>
                    <td className="text-right py-2 px-4 text-muted-foreground">
                      {totals.receitaBruta > 0 ? formatPercent((line.total / totals.receitaBruta) * 100) : '-'}
                    </td>
                  </tr>
                ))}

                {/* Lucro Operacional */}
                <tr className={cn(
                  "font-bold text-lg border-t-2",
                  totals.lucroOperacional >= 0 
                    ? "bg-income/20 border-income" 
                    : "bg-expense/20 border-expense"
                )}>
                  <td className="py-4 px-4">= LUCRO OPERACIONAL</td>
                  {MONTHS.map((_, i) => (
                    <td key={i} className="text-right py-4 px-2">-</td>
                  ))}
                  <td className={cn(
                    "text-right py-4 px-4 text-xl",
                    totals.lucroOperacional >= 0 ? "text-income" : "text-expense"
                  )}>
                    {formatCurrency(totals.lucroOperacional)}
                  </td>
                  <td className={cn(
                    "text-right py-4 px-4",
                    totals.lucroOperacional >= 0 ? "text-income" : "text-expense"
                  )}>
                    {formatPercent(indicators.margemLiquida)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
