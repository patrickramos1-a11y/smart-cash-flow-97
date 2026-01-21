import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowDownCircle, ArrowUpCircle, Plus, RefreshCw, 
  TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle,
  FileText
} from 'lucide-react';
import { TransactionsList } from './TransactionsList';
import { NewTransactionWizard } from './NewTransactionWizard';
import { useTransactionKPIs } from '@/hooks/useTransactions';
import { formatCurrency } from '@/data/mockData';

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
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [mainTab, setMainTab] = useState('all');
  const [entrySubTab, setEntrySubTab] = useState('recorrentes');
  const [exitSubTab, setExitSubTab] = useState('fixas');
  const [showWizard, setShowWizard] = useState(false);

  // KPIs for current view
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

  // KPIs specifically for entries and exits (for main overview)
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-income">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-income" />
                Total Entradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-income">{formatCurrency(entryKpis.totalEsperado)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {entryKpis.quantidadeTotal} lançamentos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-expense">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-expense" />
                Total Saídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-expense">{formatCurrency(exitKpis.totalEsperado)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {exitKpis.quantidadeTotal} lançamentos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Saldo Previsto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${entryKpis.totalEsperado - exitKpis.totalEsperado >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(entryKpis.totalEsperado - exitKpis.totalEsperado)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Entradas - Saídas</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Em Aberto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-warning">
                {formatCurrency(entryKpis.totalEmAberto + exitKpis.totalEmAberto)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {entryKpis.quantidadeEmAberto + exitKpis.quantidadeEmAberto} pendentes
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Specific KPIs for entries or exits
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Esperado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(kpis.totalEsperado)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.quantidadeTotal} lançamentos
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.quantidadePago} de {kpis.quantidadeTotal}
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.quantidadeEmAberto} pendentes
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.quantidadeAtrasado} atrasados
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with filters and new button */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
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
        </div>

        <Button onClick={() => setShowWizard(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </Button>
      </div>

      {/* KPI Cards */}
      {renderKPICards()}

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="all" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="entradas" className="gap-2">
            <ArrowDownCircle className="w-4 h-4 text-income" />
            Entradas
          </TabsTrigger>
          <TabsTrigger value="saidas" className="gap-2">
            <ArrowUpCircle className="w-4 h-4 text-expense" />
            Saídas
          </TabsTrigger>
        </TabsList>

        {/* All Transactions */}
        <TabsContent value="all" className="mt-6">
          <TransactionsList 
            filters={{ 
              competencia_mes: selectedMonth, 
              competencia_ano: selectedYear 
            }}
          />
        </TabsContent>

        {/* Entries with sub-tabs */}
        <TabsContent value="entradas" className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Badge 
              variant={entrySubTab === 'recorrentes' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => setEntrySubTab('recorrentes')}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Recorrentes (Contratos)
            </Badge>
            <Badge 
              variant={entrySubTab === 'avulsas' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
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

        {/* Exits with sub-tabs */}
        <TabsContent value="saidas" className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Badge 
              variant={exitSubTab === 'fixas' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => setExitSubTab('fixas')}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Fixas (Recorrentes)
            </Badge>
            <Badge 
              variant={exitSubTab === 'pontuais' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
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

      {/* New Transaction Wizard */}
      <NewTransactionWizard 
        open={showWizard} 
        onClose={() => setShowWizard(false)}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
      />
    </div>
  );
}
