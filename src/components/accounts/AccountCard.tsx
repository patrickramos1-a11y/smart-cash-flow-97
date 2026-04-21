import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, Pencil, ArrowLeftRight, ChevronRight, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { Account, AccountCategory } from '@/hooks/useFinancialConfig';
import { cn } from '@/lib/utils';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface AccountCardProps {
  account: Account;
  category?: AccountCategory;
  selected: boolean;
  monthlyIn: number;
  monthlyOut: number;
  variationPct: number | null;
  sparkline: { v: number }[];
  linkedCategoriesCount: number;
  onSelect: () => void;
  onEdit: () => void;
  onTransfer: () => void;
}

export function AccountCard({
  account, category, selected, monthlyIn, monthlyOut, variationPct, sparkline, linkedCategoriesCount,
  onSelect, onEdit, onTransfer,
}: AccountCardProps) {
  const balance = Number(account.current_balance);
  const orphan = linkedCategoriesCount === 0;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        selected && 'ring-2 ring-primary',
      )}
      onClick={onSelect}
    >
      <CardContent className="p-3 lg:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: (category?.color || 'hsl(var(--muted))') + '20' }}
            >
              <Wallet className="w-4 h-4" style={{ color: category?.color || 'hsl(var(--muted-foreground))' }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm truncate">{account.name}</p>
                {orphan && (
                  <span title="Nenhuma categoria de transação vinculada">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {category?.name || 'Sem categoria'}
                {account.bank ? ` • ${account.bank}` : ''}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block mt-1" />
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className={cn('text-lg lg:text-xl font-bold', balance >= 0 ? 'text-foreground' : 'text-expense')}>
              {formatCurrency(balance)}
            </p>
            {variationPct !== null && (
              <p className={cn('text-[11px] flex items-center gap-1', variationPct >= 0 ? 'text-income' : 'text-expense')}>
                {variationPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {variationPct >= 0 ? '+' : ''}{variationPct.toFixed(1)}% vs mês ant.
              </p>
            )}
          </div>
          {sparkline.length > 1 && (
            <div className="w-20 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkline}>
                  <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px] gap-1 h-5 text-income border-income/40">
            ↑ {formatCurrency(monthlyIn)}
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1 h-5 text-expense border-expense/40">
            ↓ {formatCurrency(monthlyOut)}
          </Badge>
          <Badge variant="secondary" className="text-[10px] h-5">{linkedCategoriesCount} cat.</Badge>
        </div>

        <div className="mt-2 flex items-center gap-1 pt-1 border-t" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-7 text-[11px] flex-1" onClick={onEdit}>
            <Pencil className="w-3 h-3 mr-1" /> Editar
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-[11px] flex-1" onClick={onTransfer}>
            <ArrowLeftRight className="w-3 h-3 mr-1" /> Transferir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
