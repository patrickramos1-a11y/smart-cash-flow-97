import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccountSummaryCard } from './AccountSummaryCard';
import type { AccountOverviewItem, AccountStatus } from '@/hooks/useAccountsOverview';

type Filter = 'all' | AccountStatus;

interface Props {
  items: AccountOverviewItem[];
  selectedAccountId: string | null;
  onSelect: (id: string | null) => void;
  onViewDetails: (id: string) => void;
  onNewAccount: () => void;
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'positiva', label: 'Positivas' },
  { value: 'negativa', label: 'Negativas' },
  { value: 'zerada', label: 'Zeradas' },
  { value: 'alerta', label: 'Em Alerta' },
];

export function AccountsGrid({ items, selectedAccountId, onSelect, onViewDetails, onNewAccount }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchesSearch = i.account.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === 'all' ? true :
        filter === 'alerta' ? i.needsReview :
        i.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [items, filter, search]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-sm lg:text-base">Contas</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-xs w-full sm:w-56"
              />
            </div>
            <Button size="sm" className="h-8 text-xs" onClick={onNewAccount}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Nova
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pt-2 -mx-1 px-1">
          {FILTERS.map(f => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? 'default' : 'outline'}
              className={cn('h-7 text-[11px] flex-shrink-0', filter === f.value && f.value === 'alerta' && 'bg-warning text-warning-foreground hover:bg-warning/90')}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma conta encontrada com esses filtros.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(item => (
              <div
                key={item.account.id}
                className={cn(selectedAccountId === item.account.id && 'ring-2 ring-primary rounded-lg')}
              >
                <AccountSummaryCard
                  item={item}
                  onSelect={() => onSelect(selectedAccountId === item.account.id ? null : item.account.id)}
                  onViewDetails={() => onViewDetails(item.account.id)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
