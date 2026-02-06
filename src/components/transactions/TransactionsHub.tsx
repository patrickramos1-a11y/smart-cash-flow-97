import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowDownCircle, ArrowUpCircle, Plus, RefreshCw, 
  TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle,
  FileText, BarChart3
} from 'lucide-react';
import { TransactionsList } from './TransactionsList';
import { NewTransactionWizard } from './NewTransactionWizard';
import { TransactionAnalytics } from './TransactionAnalytics';
import { TransactionsAnnualChart } from './TransactionsAnnualChart';
import { useTransactionKPIs } from '@/hooks/useTransactions';
import { formatCurrency } from '@/data/mockData';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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

export function TransactionsHub() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const isMobile = useIsMobile();
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [mainTab, setMainTab] = useState('all');
  const [entrySubTab, setEntrySubTab] = useState('recorrentes');
  const [exitSubTab, setExitSubTab] = useState('fixas');
  const [showWizard, setShowWizard] = useState(false);

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

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const renderKPICards = () => {
    if (mainTab === 'all') {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 mb-4 lg:mb-6">
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

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 mb-4 lg:mb-6">
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
      {/* Header with filters and new button */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 items-center">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-28 lg:w-36 h-8 lg:h-10 text-xs lg:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
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

          <Button onClick={() => setShowWizard(true)} size={isMobile ? "sm" : "default"} className="gap-1.5 ml-auto lg:ml-0">
            <Plus className="w-4 h-4" />
            {!isMobile && 'Novo Lançamento'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {renderKPICards()}

      {/* Annual Chart - hidden on mobile to save space, shown in a collapsible */}
      {!isMobile && <TransactionsAnnualChart year={selectedYear} />}

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
          <TransactionsList 
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
          
          <TransactionsList 
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
          
          <TransactionsList 
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
