import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowDownCircle, ArrowUpCircle, Plus, RefreshCw, 
  TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle,
  FileText, BarChart3, Eye, EyeOff
} from 'lucide-react';
import { TransactionsListWithTabs } from './TransactionsListWithTabs';
import { NewTransactionWizard } from './NewTransactionWizard';
import { TransactionAnalytics } from './TransactionAnalytics';
import { TransactionsAnnualChart } from './TransactionsAnnualChart';
import { useTransactionKPIs, useTransactions } from '@/hooks/useTransactions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/data/mockData';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const MONTH_ABBREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function TransactionsHub() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const isMobile = useIsMobile();
  const { isFinanceiro } = useAuth();
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [mainTab, setMainTab] = useState('all');
  const [entrySubTab, setEntrySubTab] = useState('recorrentes');
  const [exitSubTab, setExitSubTab] = useState('fixas');
  const [showWizard, setShowWizard] = useState(false);
  const [showChartValues, setShowChartValues] = useState(false);
  const [chartFilter, setChartFilter] = useState<'all' | 'ENTRADA' | 'SAIDA'>('all');

  const getFiltersForTab = () => {
    const baseFilters = { 
      competencia_mes: selectedMonth, 
      competencia_ano: selectedYear 
    };

    if (mainTab === 'entradas') {
      return { 
        ...baseFilters, 
        tipo_movimento: 'ENTRADA' as const,
        natureza: entrySubTab === 'recorrentes' ? 'RECORRENTE' as const : 'AVULSA' as const
      };
    }
    if (mainTab === 'saidas') {
      return { 
        ...baseFilters, 
        tipo_movimento: 'SAIDA' as const,
        natureza: exitSubTab === 'fixas' ? 'RECORRENTE' as const : 'AVULSA' as const
      };
    }
    return baseFilters;
  };

  const { kpis, isLoading: kpisLoading } = useTransactionKPIs(getFiltersForTab());
  const { kpis: entryKpis } = useTransactionKPIs({ 
    competencia_mes: selectedMonth, 
    competencia_ano: selectedYear,
    tipo_movimento: 'ENTRADA'
  });
  const { kpis: exitKpis } = useTransactionKPIs({ 
    competencia_mes: selectedMonth, 
    competencia_ano: selectedYear,
    tipo_movimento: 'SAIDA'
  });

  // Sub-KPIs for Entradas breakdown
  const { kpis: entryRecurringKpis } = useTransactionKPIs({
    competencia_mes: selectedMonth,
    competencia_ano: selectedYear,
    tipo_movimento: 'ENTRADA',
    natureza: 'RECORRENTE'
  });
  const { kpis: entryAvulsaKpis } = useTransactionKPIs({
    competencia_mes: selectedMonth,
    competencia_ano: selectedYear,
    tipo_movimento: 'ENTRADA',
    natureza: 'AVULSA'
  });

  // Sub-KPIs for Saídas breakdown
  const { kpis: exitFixasKpis } = useTransactionKPIs({
    competencia_mes: selectedMonth,
    competencia_ano: selectedYear,
    tipo_movimento: 'SAIDA',
    natureza: 'RECORRENTE'
  });
  const { kpis: exitVariaveisKpis } = useTransactionKPIs({
    competencia_mes: selectedMonth,
    competencia_ano: selectedYear,
    tipo_movimento: 'SAIDA',
    natureza: 'AVULSA'
  });

  // Only show years that have transactions (lightweight query — full useTransactions
  // is capped at 1000 rows and would hide older years like 2024).
  const { data: availableYears } = useQuery({
    queryKey: ['transaction-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('competencia_ano')
        .order('competencia_ano', { ascending: true });
      if (error) throw error;
      const set = new Set<number>();
      (data || []).forEach((r: any) => set.add(r.competencia_ano));
      return Array.from(set).sort();
    },
    staleTime: 60_000,
  });
  const years = useMemo(() => {
    const yearSet = new Set<number>(availableYears || []);
    yearSet.add(currentYear);
    return Array.from(yearSet).sort();
  }, [availableYears, currentYear]);

  // Auto-update chart filter based on tab
  const effectiveChartFilter = mainTab === 'entradas' ? 'ENTRADA' : mainTab === 'saidas' ? 'SAIDA' : chartFilter;

  const renderKPICards = () => {
    if (mainTab === 'all') {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
          <Card className="border-l-4 border-l-income">
            <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-income" />
                <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Total Entradas</span>
              </div>
              <p className="text-lg lg:text-2xl font-bold text-income">{formatCurrency(entryKpis.totalEsperado)}</p>
              <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">
                {entryKpis.quantidadeTotal} lançamentos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-expense">
            <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-expense" />
                <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Total Saídas</span>
              </div>
              <p className="text-lg lg:text-2xl font-bold text-expense">{formatCurrency(exitKpis.totalEsperado)}</p>
              <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">
                {exitKpis.quantidadeTotal} lançamentos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Saldo Previsto</span>
              </div>
              <p className={`text-lg lg:text-2xl font-bold ${entryKpis.totalEsperado - exitKpis.totalEsperado >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(entryKpis.totalEsperado - exitKpis.totalEsperado)}
              </p>
              <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">Entradas - Saídas</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Em Aberto</span>
              </div>
              <p className="text-lg lg:text-2xl font-bold text-warning">
                {formatCurrency(entryKpis.totalEmAberto + exitKpis.totalEmAberto)}
              </p>
              <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">
                {entryKpis.quantidadeEmAberto + exitKpis.quantidadeEmAberto} pendentes
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (mainTab === 'entradas') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Total Esperado</span>
                </div>
                <p className="text-lg lg:text-2xl font-bold">{formatCurrency(kpis.totalEsperado)}</p>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{kpis.quantidadeTotal} lançamentos</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-income">
              <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-income" />
                  <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Pago</span>
                </div>
                <p className="text-lg lg:text-2xl font-bold text-income">{formatCurrency(kpis.totalPago)}</p>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{kpis.quantidadePago} de {kpis.quantidadeTotal}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-warning">
              <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-warning" />
                  <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Em Aberto</span>
                </div>
                <p className="text-lg lg:text-2xl font-bold text-warning">{formatCurrency(kpis.totalEmAberto)}</p>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{kpis.quantidadeEmAberto} pendentes</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-expense">
              <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-expense" />
                  <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Atrasado</span>
                </div>
                <p className="text-lg lg:text-2xl font-bold text-expense">{formatCurrency(kpis.totalAtrasado)}</p>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{kpis.quantidadeAtrasado} atrasados</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Receita Recorrente vs Avulsa breakdown */}
          <div className="grid grid-cols-2 gap-2 lg:gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <RefreshCw className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] lg:text-xs font-medium text-muted-foreground">Receita Recorrente</span>
                </div>
                <p className="text-base lg:text-lg font-bold">{formatCurrency(entryRecurringKpis.totalEsperado)}</p>
                <p className="text-[10px] text-muted-foreground">{entryRecurringKpis.quantidadeTotal} contratos</p>
              </CardContent>
            </Card>
            <Card className="bg-info/5 border-info/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-info" />
                  <span className="text-[10px] lg:text-xs font-medium text-muted-foreground">Receita Avulsa</span>
                </div>
                <p className="text-base lg:text-lg font-bold">{formatCurrency(entryAvulsaKpis.totalEsperado)}</p>
                <p className="text-[10px] text-muted-foreground">{entryAvulsaKpis.quantidadeTotal} serviços</p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (mainTab === 'saidas') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Total Esperado</span>
                </div>
                <p className="text-lg lg:text-2xl font-bold">{formatCurrency(kpis.totalEsperado)}</p>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{kpis.quantidadeTotal} lançamentos</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-income">
              <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-income" />
                  <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Pago</span>
                </div>
                <p className="text-lg lg:text-2xl font-bold text-income">{formatCurrency(kpis.totalPago)}</p>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{kpis.quantidadePago} pagos</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-warning">
              <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-warning" />
                  <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Em Aberto</span>
                </div>
                <p className="text-lg lg:text-2xl font-bold text-warning">{formatCurrency(kpis.totalEmAberto)}</p>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{kpis.quantidadeEmAberto} pendentes</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-expense">
              <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-expense" />
                  <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Atrasado</span>
                </div>
                <p className="text-lg lg:text-2xl font-bold text-expense">{formatCurrency(kpis.totalAtrasado)}</p>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{kpis.quantidadeAtrasado} atrasados</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Despesas Fixas vs Variáveis breakdown */}
          <div className="grid grid-cols-2 gap-2 lg:gap-4">
            <Card className="bg-expense/5 border-expense/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <RefreshCw className="w-3.5 h-3.5 text-expense" />
                  <span className="text-[10px] lg:text-xs font-medium text-muted-foreground">Despesas Fixas</span>
                </div>
                <p className="text-base lg:text-lg font-bold">{formatCurrency(exitFixasKpis.totalEsperado)}</p>
                <p className="text-[10px] text-muted-foreground">{exitFixasKpis.quantidadeTotal} lançamentos</p>
              </CardContent>
            </Card>
            <Card className="bg-warning/5 border-warning/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-warning" />
                  <span className="text-[10px] lg:text-xs font-medium text-muted-foreground">Despesas Variáveis</span>
                </div>
                <p className="text-base lg:text-lg font-bold">{formatCurrency(exitVariaveisKpis.totalEsperado)}</p>
                <p className="text-[10px] text-muted-foreground">{exitVariaveisKpis.quantidadeTotal} lançamentos</p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Default for analysis tab
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Total Esperado</span>
            </div>
            <p className="text-lg lg:text-2xl font-bold">{formatCurrency(kpis.totalEsperado)}</p>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{kpis.quantidadeTotal} lançamentos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-income">
          <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-income" />
              <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Pago</span>
            </div>
            <p className="text-lg lg:text-2xl font-bold text-income">{formatCurrency(kpis.totalPago)}</p>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{kpis.quantidadePago} de {kpis.quantidadeTotal}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-warning" />
              <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Em Aberto</span>
            </div>
            <p className="text-lg lg:text-2xl font-bold text-warning">{formatCurrency(kpis.totalEmAberto)}</p>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{kpis.quantidadeEmAberto} pendentes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-expense">
          <CardContent className="p-3 lg:p-6 pt-3 lg:pt-6">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-expense" />
              <span className="text-[10px] lg:text-sm font-medium text-muted-foreground">Atrasado</span>
            </div>
            <p className="text-lg lg:text-2xl font-bold text-expense">{formatCurrency(kpis.totalAtrasado)}</p>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{kpis.quantidadeAtrasado} atrasados</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-3 lg:space-y-6">
      {/* Header: Year selector + New button */}
      <div className="flex items-center justify-between gap-2">
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

        {!isFinanceiro && (
          <Button onClick={() => setShowWizard(true)} size={isMobile ? "sm" : "default"} className="gap-1.5">
            <Plus className="w-4 h-4" />
            {!isMobile && 'Novo Lançamento'}
          </Button>
        )}
      </div>

      {/* Month strip - 12 months compact */}
      <div className="overflow-x-auto -mx-3 px-3 lg:mx-0 lg:px-0">
        <div className="flex gap-1 min-w-max lg:grid lg:grid-cols-12 lg:min-w-0">
          {MONTH_ABBREV.map((label, idx) => {
            const monthNum = idx + 1;
            const isSelected = monthNum === selectedMonth;
            const isCurrent = monthNum === currentMonth && selectedYear === currentYear;
            return (
              <button
                key={monthNum}
                onClick={() => setSelectedMonth(monthNum)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium transition-all text-center min-w-[44px]",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isCurrent
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards - dynamic per tab */}
      {renderKPICards()}

      {/* Annual Chart with filter controls */}
      {!isMobile && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 justify-end">
            {mainTab === 'all' && (
              <div className="flex gap-1">
                {(['all', 'ENTRADA', 'SAIDA'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setChartFilter(f)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                      chartFilter === f
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {f === 'all' ? 'Tudo' : f === 'ENTRADA' ? 'Entradas' : 'Saídas'}
                  </button>
                ))}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChartValues(!showChartValues)}
              className="gap-1.5 h-7 text-xs"
            >
              {showChartValues ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showChartValues ? 'Ocultar' : 'Valores'}
            </Button>
          </div>
          <TransactionsAnnualChart 
            year={selectedYear} 
            filterType={effectiveChartFilter === 'all' ? undefined : effectiveChartFilter}
            showValues={showChartValues}
          />
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <div className="overflow-x-auto -mx-3 px-3 lg:mx-0 lg:px-0">
          <TabsList className={cn(
            "inline-flex w-auto min-w-full lg:min-w-0",
            isMobile ? "h-9" : ""
          )}>
            <TabsTrigger value="all" className="gap-1.5 text-xs lg:text-sm">
              <RefreshCw className="w-3.5 h-3.5" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="entradas" className="gap-1.5 text-xs lg:text-sm">
              <ArrowDownCircle className="w-3.5 h-3.5 text-income" />
              Entradas
            </TabsTrigger>
            <TabsTrigger value="saidas" className="gap-1.5 text-xs lg:text-sm">
              <ArrowUpCircle className="w-3.5 h-3.5 text-expense" />
              Saídas
            </TabsTrigger>
            <TabsTrigger value="analise" className="gap-1.5 text-xs lg:text-sm">
              <BarChart3 className="w-3.5 h-3.5" />
              Análise
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-4 lg:mt-6">
          <TransactionsListWithTabs 
            filters={{ 
              competencia_mes: selectedMonth, 
              competencia_ano: selectedYear 
            }}
          />
        </TabsContent>

        <TabsContent value="analise" className="mt-4 lg:mt-6">
          <TransactionAnalytics 
            month={selectedMonth}
            year={selectedYear}
          />
        </TabsContent>

        <TabsContent value="entradas" className="mt-4 lg:mt-6 space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <Badge 
              variant={entrySubTab === 'recorrentes' ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1.5 text-xs whitespace-nowrap"
              onClick={() => setEntrySubTab('recorrentes')}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Recorrentes
            </Badge>
            <Badge 
              variant={entrySubTab === 'avulsas' ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1.5 text-xs whitespace-nowrap"
              onClick={() => setEntrySubTab('avulsas')}
            >
              <FileText className="w-3 h-3 mr-1" />
              Avulsas
            </Badge>
          </div>
          
          <TransactionsListWithTabs 
            filters={{ 
              competencia_mes: selectedMonth, 
              competencia_ano: selectedYear,
              tipo_movimento: 'ENTRADA',
              natureza: entrySubTab === 'recorrentes' ? 'RECORRENTE' : 'AVULSA'
            }}
          />
        </TabsContent>

        <TabsContent value="saidas" className="mt-4 lg:mt-6 space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <Badge 
              variant={exitSubTab === 'fixas' ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1.5 text-xs whitespace-nowrap"
              onClick={() => setExitSubTab('fixas')}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Fixas
            </Badge>
            <Badge 
              variant={exitSubTab === 'pontuais' ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1.5 text-xs whitespace-nowrap"
              onClick={() => setExitSubTab('pontuais')}
            >
              <FileText className="w-3 h-3 mr-1" />
              Pontuais
            </Badge>
          </div>
          
          <TransactionsListWithTabs 
            filters={{ 
              competencia_mes: selectedMonth, 
              competencia_ano: selectedYear,
              tipo_movimento: 'SAIDA',
              natureza: exitSubTab === 'fixas' ? 'RECORRENTE' : 'AVULSA'
            }}
          />
        </TabsContent>
      </Tabs>

      <NewTransactionWizard 
        open={showWizard} 
        onClose={() => setShowWizard(false)}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
      />
    </div>
  );
}
