import { useMemo, useState } from 'react';
import { useAccounts, type Account } from '@/hooks/useFinancialConfig';
import { useAccountsSnapshot } from '@/hooks/useAccountsSnapshot';
import { AccountsHeader } from './AccountsHeader';
import { AccountCard } from './AccountCard';
import { AccountModal } from './AccountModal';
import { TransferModal } from './TransferModal';
import { AccountsEvolutionChart } from './AccountsEvolutionChart';
import { AccountsDistributionPanel } from './AccountsDistributionPanel';
import { AccountsToolbar, type SortKey, type GroupKey, type FilterKey } from './AccountsToolbar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Wallet, CalendarClock, LayoutGrid } from 'lucide-react';
import { PlannedTransfersTab } from './PlannedTransfersTab';

interface AccountsViewProps {
  onOpenDetail?: (accountId: string) => void;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function AccountsView({ onOpenDetail }: AccountsViewProps = {}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('saldo_desc');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [group, setGroup] = useState<GroupKey>('none');

  const { data: accounts, isLoading } = useAccounts();
  const { data: snapshots, isLoading: snapLoading } = useAccountsSnapshot(year, month);

  const activeAccounts = (accounts || []).filter((a) => a.active);

  const totalSaldo = activeAccounts.reduce(
    (s, a) => s + (snapshots?.[a.id]?.saldo_fim_mes ?? Number(a.current_balance) ?? 0),
    0,
  );
  const totalEntradas = activeAccounts.reduce((s, a) => s + (snapshots?.[a.id]?.entradas_mes ?? 0), 0);
  const totalSaidas = activeAccounts.reduce((s, a) => s + (snapshots?.[a.id]?.saidas_mes ?? 0), 0);

  const visible = useMemo(() => {
    let list = activeAccounts;
    const s = search.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(s) ||
          (a.bank || '').toLowerCase().includes(s) ||
          (a.category?.name || '').toLowerCase().includes(s),
      );
    }
    list = list.filter((a) => {
      const snap = snapshots?.[a.id];
      const saldo = snap?.saldo_fim_mes ?? Number(a.current_balance) ?? 0;
      const mov = (snap?.entradas_mes ?? 0) + (snap?.saidas_mes ?? 0)
        + (snap?.transferencias_in ?? 0) + (snap?.transferencias_out ?? 0);
      switch (filter) {
        case 'positive': return saldo > 0.01;
        case 'negative': return saldo < -0.01;
        case 'zero': return Math.abs(saldo) < 0.01;
        case 'with_movement': return mov > 0;
        case 'no_movement': return mov === 0;
        default: return true;
      }
    });
    list = [...list].sort((a, b) => {
      const sa = snapshots?.[a.id]?.saldo_fim_mes ?? Number(a.current_balance) ?? 0;
      const sb = snapshots?.[b.id]?.saldo_fim_mes ?? Number(b.current_balance) ?? 0;
      const ma = (snapshots?.[a.id]?.entradas_mes ?? 0) + (snapshots?.[a.id]?.saidas_mes ?? 0);
      const mb = (snapshots?.[b.id]?.entradas_mes ?? 0) + (snapshots?.[b.id]?.saidas_mes ?? 0);
      switch (sort) {
        case 'saldo_asc': return sa - sb;
        case 'name': return a.name.localeCompare(b.name);
        case 'movimento': return mb - ma;
        case 'saldo_desc':
        default: return sb - sa;
      }
    });
    return list;
  }, [activeAccounts, snapshots, search, filter, sort]);

  const groups = useMemo(() => {
    if (group === 'none') return [{ key: '__all', label: '', items: visible }];
    const map = new Map<string, Account[]>();
    visible.forEach((a) => {
      const key = group === 'bank'
        ? (a.bank || 'Sem banco')
        : (a.category?.name || 'Sem categoria');
      const arr = map.get(key) || [];
      arr.push(a);
      map.set(key, arr);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, items]) => ({ key, label: key, items }));
  }, [visible, group]);

  const renderCard = (a: Account) => (
    <AccountCard
      key={a.id}
      account={a}
      snapshot={snapshots?.[a.id]}
      onClick={() => onOpenDetail?.(a.id)}
      onEdit={() => { setEditingAccount(a); setAccountModalOpen(true); }}
    />
  );

  const gridCls = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5';

  return (
    <div className="space-y-4">
      <AccountsHeader
        month={month}
        year={year}
        onMonthChange={setMonth}
        onYearChange={setYear}
        onNewAccount={() => { setEditingAccount(null); setAccountModalOpen(true); }}
        onTransfer={() => setTransferOpen(true)}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5" /> Visão geral
          </TabsTrigger>
          <TabsTrigger value="planned" className="gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" /> Planejadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Totais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Wallet className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Saldo total</p>
                  <p className="text-lg font-bold">{fmt(totalSaldo)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Entradas no período</p>
                <p className="text-lg font-bold text-primary">{fmt(totalEntradas)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Saídas no período</p>
                <p className="text-lg font-bold text-destructive">{fmt(totalSaidas)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Visão estratégica: evolução + distribuição */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <AccountsEvolutionChart year={year} month={month} />
            <AccountsDistributionPanel
              accounts={activeAccounts}
              snapshots={snapshots}
              isLoading={isLoading || snapLoading}
            />
          </div>

          {/* Toolbar */}
          <AccountsToolbar
            search={search} onSearch={setSearch}
            sort={sort} onSort={setSort}
            filter={filter} onFilter={setFilter}
            group={group} onGroup={setGroup}
          />

          {/* Grid de contas */}
          {isLoading || snapLoading ? (
            <div className={gridCls}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)}
            </div>
          ) : visible.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                Nenhuma conta corresponde aos filtros.
              </CardContent>
            </Card>
          ) : group === 'none' ? (
            <div className={gridCls}>
              {visible.map(renderCard)}
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => {
                const sub = g.items.reduce(
                  (s, a) => s + (snapshots?.[a.id]?.saldo_fim_mes ?? Number(a.current_balance) ?? 0),
                  0,
                );
                return (
                  <div key={g.key} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-border pb-1">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {g.label} <span className="text-foreground/60 normal-case">({g.items.length})</span>
                      </h4>
                      <span className="text-xs font-semibold">{fmt(sub)}</span>
                    </div>
                    <div className={gridCls}>
                      {g.items.map(renderCard)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="planned" className="mt-4">
          <PlannedTransfersTab />
        </TabsContent>
      </Tabs>

      <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} account={editingAccount} />
      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} />
    </div>
  );
}
