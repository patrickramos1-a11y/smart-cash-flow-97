import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Moon, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AccountOverviewItem, AccountsOverviewRankings } from '@/hooks/useAccountsOverview';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  rankings: AccountsOverviewRankings;
}

export function AccountsRankings({ rankings }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      <RankingCard
        title="Top 5 maiores saldos"
        icon={TrendingUp}
        tone="income"
        items={rankings.topPositive}
        renderValue={(i) => (
          <span className="text-income font-semibold text-xs">{formatCurrency(i.balance.computedBalance)}</span>
        )}
        empty="Nenhuma conta positiva."
      />
      <RankingCard
        title="Top 5 maiores déficits"
        icon={TrendingDown}
        tone="expense"
        items={rankings.topNegative}
        renderValue={(i) => (
          <span className="text-expense font-semibold text-xs">{formatCurrency(i.balance.computedBalance)}</span>
        )}
        empty="Nenhuma conta negativa."
      />
      <RankingCard
        title="Sem movimentação"
        icon={Moon}
        tone="muted"
        items={rankings.idle}
        renderValue={() => <span className="text-[11px] text-muted-foreground">0 mov.</span>}
        empty="Todas as contas têm movimento."
      />
      <RankingCard
        title="Mais utilizadas"
        icon={Activity}
        tone="primary"
        items={rankings.mostUsed}
        renderValue={(i) => <span className="text-primary font-semibold text-xs">{i.movementCount} mov.</span>}
        empty="Sem movimentações no período."
      />
    </div>
  );
}

interface RankingCardProps {
  title: string;
  icon: typeof TrendingUp;
  tone: 'income' | 'expense' | 'muted' | 'primary';
  items: AccountOverviewItem[];
  renderValue: (i: AccountOverviewItem) => React.ReactNode;
  empty: string;
}

function RankingCard({ title, icon: Icon, tone, items, renderValue, empty }: RankingCardProps) {
  const toneClass = {
    income: 'text-income',
    expense: 'text-expense',
    muted: 'text-muted-foreground',
    primary: 'text-primary',
  }[tone];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <Icon className={cn('w-3.5 h-3.5', toneClass)} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <p className="text-[11px] text-muted-foreground py-2">{empty}</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((i, idx) => (
              <li key={i.account.id} className="flex items-center gap-2 text-[12px]">
                <span className="text-[10px] text-muted-foreground w-4">{idx + 1}.</span>
                <span className="flex-1 truncate">{i.account.name}</span>
                {renderValue(i)}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
