import { 
  FileText, Receipt, Scale, Percent, Hash, 
  DollarSign, BarChart3, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFiscalIndicators } from '@/hooks/useFiscalConfig';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface FiscalIndicatorsProps {
  month?: number;
  year?: number;
}

export function FiscalIndicators({ month, year }: FiscalIndicatorsProps) {
  const { data: indicators, isLoading } = useFiscalIndicators(month, year);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!indicators) return null;

  const fiscalCards = [
    {
      label: '% Receitas com NF',
      value: `${indicators.pctReceitasComNF.toFixed(1)}%`,
      icon: FileText,
      color: indicators.pctReceitasComNF >= 70 ? 'text-income' : 'text-warning',
      bg: indicators.pctReceitasComNF >= 70 ? 'bg-income/10' : 'bg-warning/10',
    },
    {
      label: '% Receitas sem NF',
      value: `${indicators.pctReceitasSemNF.toFixed(1)}%`,
      icon: AlertTriangle,
      color: indicators.pctReceitasSemNF <= 30 ? 'text-income' : 'text-expense',
      bg: indicators.pctReceitasSemNF <= 30 ? 'bg-income/10' : 'bg-expense/10',
    },
    {
      label: '% Recorrentes s/ NF',
      value: `${indicators.pctRecorrentesSemNF.toFixed(1)}%`,
      icon: Receipt,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: '% Avulsos com NF',
      value: `${indicators.pctAvulsosComNF.toFixed(1)}%`,
      icon: ShieldCheck,
      color: 'text-info',
      bg: 'bg-info/10',
    },
    {
      label: 'Total NFs Emitidas',
      value: indicators.totalNFsEmitidas.toString(),
      icon: Hash,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  const taxCards = [
    {
      label: 'Total Impostos (NF)',
      value: formatCurrency(indicators.totalImpostosNF),
      icon: Scale,
      color: 'text-expense',
      bg: 'bg-expense/10',
    },
    {
      label: '% Formalização',
      value: `${indicators.pctReceitasFormalizadas.toFixed(1)}%`,
      icon: Percent,
      color: indicators.pctReceitasFormalizadas >= 50 ? 'text-income' : 'text-warning',
      bg: indicators.pctReceitasFormalizadas >= 50 ? 'bg-income/10' : 'bg-warning/10',
    },
    {
      label: 'Total Entradas',
      value: formatCurrency(indicators.totalValorEntradas),
      icon: DollarSign,
      color: 'text-income',
      bg: 'bg-income/10',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Fiscal Indicators */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Indicadores Fiscais</h3>
        <Badge variant="outline" className="text-[10px]">
          {indicators.totalEntradas} entradas
        </Badge>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {fiscalCards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", card.bg)}>
                    <Icon className={cn("w-3.5 h-3.5", card.color)} />
                  </div>
                </div>
                <p className={cn("text-lg font-bold", card.color)}>{card.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{card.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tax & Strategic Indicators */}
      <div className="flex items-center gap-2">
        <Scale className="w-4 h-4 text-expense" />
        <h3 className="text-sm font-semibold text-foreground">Indicadores Tributários & Estratégicos</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {taxCards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", card.bg)}>
                    <Icon className={cn("w-3.5 h-3.5", card.color)} />
                  </div>
                </div>
                <p className={cn("text-lg font-bold", card.color)}>{card.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{card.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
