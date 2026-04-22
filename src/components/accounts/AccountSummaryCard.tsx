import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, AlertTriangle, ChevronRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import type { AccountOverviewItem } from '@/hooks/useAccountsOverview';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  item: AccountOverviewItem;
  onSelect: () => void;
  onViewDetails: () => void;
}

const STATUS_STYLES = {
  positiva: { label: 'Positiva', cls: 'bg-income/10 text-income border-income/30' },
  negativa: { label: 'Negativa', cls: 'bg-expense/10 text-expense border-expense/30' },
  zerada: { label: 'Zerada', cls: 'bg-muted text-muted-foreground border-border' },
  alerta: { label: 'Em Alerta', cls: 'bg-warning/10 text-warning border-warning/40' },
} as const;

export function AccountSummaryCard({ item, onSelect, onViewDetails }: Props) {
  const { account, category, balance, status, needsReview, reviewReasons, pctOfTotal, movementCount, monthlyIn, monthlyOut, sparkline } = item;
  const computed = balance.computedBalance;
  const statusStyle = STATUS_STYLES[status];

  const balanceColor =
    status === 'negativa' ? 'text-expense' :
    status === 'positiva' ? 'text-income' :
    status === 'alerta' ? 'text-warning' :
    'text-muted-foreground';

  return (
    <Card className={cn('hover:shadow-md transition-all cursor-pointer group', needsReview && 'border-warning/40')} onClick={onSelect}>
      <CardContent className="p-3 lg:p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: (category?.color || 'hsl(var(--muted))') + '20' }}
            >
              <Wallet className="w-4 h-4" style={{ color: category?.color || 'hsl(var(--muted-foreground))' }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate leading-tight">{account.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {category?.name || 'Sem categoria'}
                {account.bank ? ` • ${account.bank}` : ''}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn('text-[10px] h-5 flex-shrink-0', statusStyle.cls)}>
            {statusStyle.label}
          </Badge>
        </div>

        {/* Saldo + sparkline */}
        <div className="flex items-end justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className={cn('text-xl lg:text-2xl font-bold leading-tight truncate', balanceColor)}>
              {formatCurrency(computed)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {pctOfTotal >= 0 ? '+' : ''}{pctOfTotal.toFixed(1)}% do total
            </p>
          </div>
          {sparkline.length > 1 && (
            <div className="w-20 h-10 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkline}>
                  <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Movimentações */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <Badge variant="outline" className="text-[10px] h-5 text-income border-income/40">
            ↑ {formatCurrency(monthlyIn)}
          </Badge>
          <Badge variant="outline" className="text-[10px] h-5 text-expense border-expense/40">
            ↓ {formatCurrency(monthlyOut)}
          </Badge>
          <Badge variant="secondary" className="text-[10px] h-5">
            {movementCount} mov.
          </Badge>
        </div>

        {/* Selo de revisão */}
        {needsReview && (
          <div className="flex items-start gap-1.5 mb-2 p-1.5 rounded-md bg-warning/10 border border-warning/30">
            <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-warning leading-tight">
              Revisar: {reviewReasons.join(' • ')}
            </p>
          </div>
        )}

        {/* Ação */}
        <div className="pt-1 border-t" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="w-full h-7 text-[11px] justify-between" onClick={onViewDetails}>
            Ver detalhes <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
