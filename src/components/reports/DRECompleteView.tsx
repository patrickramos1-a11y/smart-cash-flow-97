import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, TrendingDown, Download, BarChart3, Percent, DollarSign,
  Monitor, Users, Building2, PiggyBank, Target
} from 'lucide-react';
import { useDREData } from '@/hooks/useDREReport';
import { cn } from '@/lib/utils';

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

interface DRESectionRowProps {
  label: string;
  values: Record<number, number>;
  total: number;
  receitaBruta: number;
  isIndented?: boolean;
}

function DRESectionRow({ label, values, total, receitaBruta, isIndented }: DRESectionRowProps) {
  return (
    <tr className="border-b border-border/50 hover:bg-muted/30">
      <td className={cn("py-2 px-4 text-muted-foreground", isIndented && "pl-8")}>{label}</td>
      {MONTHS.map((_, i) => (
        <td key={i} className="text-right py-2 px-2 text-sm">
          {values[i + 1] ? formatCurrency(values[i + 1]) : '-'}
        </td>
      ))}
      <td className="text-right py-2 px-4">{formatCurrency(total)}</td>
      <td className="text-right py-2 px-4 text-muted-foreground">
        {receitaBruta > 0 ? formatPercent((total / receitaBruta) * 100) : '-'}
      </td>
    </tr>
  );
}

export function DRECompleteView() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { data, isLoading, error } = useDREData(selectedYear);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-96 w-full" /></div>;
  if (error || !data) return <Card><CardContent className="p-8 text-center text-muted-foreground">Erro ao carregar dados do DRE</CardContent></Card>;

  const { totals, indicators, groupedLines } = data;

  const renderSectionHeader = (label: string, total: number, icon: React.ReactNode, colorClass: string, monthValues?: Record<number, number>[]) => {
    const monthTotals: Record<number, number> = {};
    if (monthValues) {
      monthValues.forEach(mv => {
        Object.entries(mv).forEach(([m, v]) => {
          monthTotals[Number(m)] = (monthTotals[Number(m)] || 0) + v;
        });
      });
    }
    return (
      <tr className={cn("font-semibold", colorClass)}>
        <td className="py-3 px-4 flex items-center gap-2">{icon}{label}</td>
        {MONTHS.map((_, i) => (
          <td key={i} className="text-right py-3 px-2">
            {monthTotals[i + 1] ? formatCurrency(monthTotals[i + 1]) : '-'}
          </td>
        ))}
        <td className="text-right py-3 px-4 font-bold">{formatCurrency(total)}</td>
        <td className="text-right py-3 px-4">
          {totals.receitaBruta > 0 ? formatPercent((total / totals.receitaBruta) * 100) : '-'}
        </td>
      </tr>
    );
  };

  const renderSubtotal = (label: string, value: number, colorPositive: string, colorNegative: string) => (
    <tr className={cn("font-bold border-y", value >= 0 ? `bg-income/20 border-income/30` : `bg-expense/20 border-expense/30`)}>
      <td className="py-3 px-4">{label}</td>
      {MONTHS.map((_, i) => <td key={i} className="text-right py-3 px-2">-</td>)}
      <td className={cn("text-right py-3 px-4 text-lg", value >= 0 ? "text-income" : "text-expense")}>{formatCurrency(value)}</td>
      <td className={cn("text-right py-3 px-4", value >= 0 ? "text-income" : "text-expense")}>
        {totals.receitaBruta > 0 ? formatPercent((value / totals.receitaBruta) * 100) : '-'}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">DRE Completa</h2>
          <p className="text-sm text-muted-foreground">Demonstração do Resultado do Exercício</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Exportar</Button>
        </div>
      </div>

      {/* KPI Indicators - 2 rows of 3 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-income">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Margem Bruta</p>
            <p className="text-xl font-bold text-income">{formatPercent(indicators.margemBruta)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Margem Operacional Real</p>
            <p className="text-xl font-bold text-primary">{formatPercent(indicators.margemOperacional)}</p>
          </CardContent>
        </Card>
        <Card className={cn("border-l-4", indicators.margemLiquida >= 0 ? "border-l-income" : "border-l-expense")}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Margem Líquida</p>
            <p className={cn("text-xl font-bold", indicators.margemLiquida >= 0 ? "text-income" : "text-expense")}>{formatPercent(indicators.margemLiquida)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-1 mb-1"><Monitor className="w-3 h-3 text-blue-500" /><p className="text-xs text-muted-foreground">% Tecnologia / Receita</p></div>
            <p className="text-xl font-bold text-blue-500">{formatPercent(indicators.custoTecnologia)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-1 mb-1"><Users className="w-3 h-3 text-purple-500" /><p className="text-xs text-muted-foreground">% Pessoal / Receita</p></div>
            <p className="text-xl font-bold text-purple-500">{formatPercent(indicators.despesasPessoais)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-1 mb-1"><Target className="w-3 h-3 text-amber-500" /><p className="text-xs text-muted-foreground">EBITDA (aprox.)</p></div>
            <p className="text-xl font-bold text-amber-500">{formatCurrency(indicators.ebitda)}</p>
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
                  {MONTHS.map(m => <th key={m} className="text-right py-3 px-2 font-semibold text-xs">{m}</th>)}
                  <th className="text-right py-3 px-4 font-semibold">TOTAL</th>
                  <th className="text-right py-3 px-4 font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. RECEITA BRUTA */}
                {renderSectionHeader('RECEITA BRUTA', totals.receitaBruta, <TrendingUp className="w-4 h-4 text-income" />, 'bg-income/10', groupedLines.receita.map(l => l.values))}
                {groupedLines.receita.map(line => (
                  <DRESectionRow key={line.id} label={line.label} values={line.values} total={line.total} receitaBruta={totals.receitaBruta} isIndented />
                ))}

                {/* 2. DEDUÇÕES */}
                {renderSectionHeader('(-) DEDUÇÕES DA RECEITA BRUTA', totals.deducoes, <TrendingDown className="w-4 h-4 text-expense" />, 'bg-expense/5', groupedLines.deducoes.map(l => l.values))}
                {groupedLines.deducoes.map(line => (
                  <DRESectionRow key={line.id} label={line.label} values={line.values} total={line.total} receitaBruta={totals.receitaBruta} isIndented />
                ))}

                {/* = RECEITA LÍQUIDA */}
                {renderSubtotal('= RECEITA LÍQUIDA', totals.receitaLiquida, 'text-income', 'text-expense')}

                {/* 3. CUSTOS OPERACIONAIS */}
                {groupedLines.custos.length > 0 && (
                  <>
                    {renderSectionHeader('(-) CUSTOS OPERACIONAIS', totals.custosOperacionais, <TrendingDown className="w-4 h-4 text-expense" />, 'bg-expense/5', groupedLines.custos.map(l => l.values))}
                    {groupedLines.custos.map(line => (
                      <DRESectionRow key={line.id} label={line.label} values={line.values} total={line.total} receitaBruta={totals.receitaBruta} isIndented />
                    ))}
                  </>
                )}

                {/* = LUCRO BRUTO */}
                {renderSubtotal('= LUCRO BRUTO', totals.lucroBruto, 'text-income', 'text-expense')}

                {/* 4. DESPESAS OPERACIONAIS */}
                {renderSectionHeader('(-) DESPESAS OPERACIONAIS', totals.despesasOperacionais, <TrendingDown className="w-4 h-4 text-expense" />, 'bg-expense/10', [...groupedLines.despesasOp, ...groupedLines.outrasDespesas].map(l => l.values))}
                {groupedLines.despesasOp.map(line => (
                  <DRESectionRow key={line.id} label={line.label} values={line.values} total={line.total} receitaBruta={totals.receitaBruta} isIndented />
                ))}
                {groupedLines.outrasDespesas.map(line => (
                  <DRESectionRow key={line.id} label={line.label} values={line.values} total={line.total} receitaBruta={totals.receitaBruta} isIndented />
                ))}

                {/* = LUCRO OPERACIONAL */}
                <tr className={cn("font-bold text-lg border-t-2", totals.lucroOperacional >= 0 ? "bg-income/20 border-income" : "bg-expense/20 border-expense")}>
                  <td className="py-4 px-4">= LUCRO OPERACIONAL</td>
                  {MONTHS.map((_, i) => <td key={i} className="text-right py-4 px-2">-</td>)}
                  <td className={cn("text-right py-4 px-4 text-xl", totals.lucroOperacional >= 0 ? "text-income" : "text-expense")}>{formatCurrency(totals.lucroOperacional)}</td>
                  <td className={cn("text-right py-4 px-4", totals.lucroOperacional >= 0 ? "text-income" : "text-expense")}>{formatPercent(indicators.margemOperacional)}</td>
                </tr>

                {/* 5. NÃO OPERACIONAL (Investimentos) */}
                {groupedLines.naoOperacional.length > 0 && (
                  <>
                    {renderSectionHeader('(-) INVESTIMENTOS E ATIVOS', totals.investimentos, <PiggyBank className="w-4 h-4 text-blue-500" />, 'bg-blue-500/5', groupedLines.naoOperacional.map(l => l.values))}
                    {groupedLines.naoOperacional.map(line => (
                      <DRESectionRow key={line.id} label={line.label} values={line.values} total={line.total} receitaBruta={totals.receitaBruta} isIndented />
                    ))}
                    {renderSubtotal('= RESULTADO FINAL', totals.resultadoFinal, 'text-income', 'text-expense')}
                  </>
                )}

                {/* 6. FORA DRE (Movimentações Patrimoniais) - apenas informativo */}
                {groupedLines.foraDre.length > 0 && (
                  <>
                    <tr className="bg-muted/30">
                      <td colSpan={15} className="py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Movimentações Patrimoniais (fora do DRE)
                      </td>
                    </tr>
                    {groupedLines.foraDre.map(line => (
                      <DRESectionRow key={line.id} label={line.label} values={line.values} total={line.total} receitaBruta={totals.receitaBruta} isIndented />
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
