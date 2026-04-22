import { Card, CardContent } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, CircleDot, AlertTriangle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AccountsOverviewKPIs } from '@/hooks/useAccountsOverview';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  kpis: AccountsOverviewKPIs;
}

export function AccountsKpiGrid({ kpis }: Props) {
  const cards = [
    {
      label: 'Saldo Consolidado',
      value: formatCurrency(kpis.consolidated),
      sub: `${kpis.totalAccounts} contas ativas`,
      icon: Wallet,
      tone: 'primary' as const,
      span: true,
    },
    {
      label: 'Positivas',
      value: formatCurrency(kpis.positiveSum),
      sub: `${kpis.positiveCount} contas`,
      icon: TrendingUp,
      tone: 'income' as const,
    },
    {
      label: 'Negativas',
      value: formatCurrency(kpis.negativeSum),
      sub: `${kpis.negativeCount} contas`,
      icon: TrendingDown,
      tone: 'expense' as const,
    },
    {
      label: 'Zeradas',
      value: kpis.zeroedCount.toString(),
      sub: 'sem saldo',
      icon: CircleDot,
      tone: 'muted' as const,
    },
    {
      label: 'Em Alerta',
      value: kpis.alertCount.toString(),
      sub: 'requerem revisão',
      icon: AlertTriangle,
      tone: 'warning' as const,
    },
    {
      label: 'Total de Contas',
      value: kpis.totalAccounts.toString(),
      sub: 'cadastradas',
      icon: Layers,
      tone: 'neutral' as const,
    },
  ];

  const toneClass = {
    primary: 'border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 text-primary',
    income: 'border-income/30 bg-income/5 text-income',
    expense: 'border-expense/30 bg-expense/5 text-expense',
    muted: 'border-border bg-muted/30 text-muted-foreground',
    warning: 'border-warning/40 bg-warning/10 text-warning',
    neutral: 'border-border bg-card text-foreground',
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <Card key={idx} className={cn('border', toneClass[c.tone])}>
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wide truncate">{c.label}</p>
                <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 opacity-70 flex-shrink-0" />
              </div>
              <p className={cn('text-base lg:text-lg font-bold leading-tight truncate', c.tone === 'primary' && 'text-foreground')}>
                {c.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.sub}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
