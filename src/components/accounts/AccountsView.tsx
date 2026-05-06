import { useState } from 'react';
import { useAccounts, type Account } from '@/hooks/useFinancialConfig';
import { useAccountsSnapshot } from '@/hooks/useAccountsSnapshot';
import { AccountsHeader } from './AccountsHeader';
import { AccountCard } from './AccountCard';
import { AccountModal } from './AccountModal';
import { TransferModal } from './TransferModal';
import { AccountsEvolutionChart } from './AccountsEvolutionChart';
import { AccountsDistributionPanel } from './AccountsDistributionPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function AccountsView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  const { data: accounts, isLoading } = useAccounts();
  const { data: snapshots, isLoading: snapLoading } = useAccountsSnapshot(year, month);

  const activeAccounts = (accounts || []).filter((a) => a.active);
  const totalSaldo = activeAccounts.reduce(
    (s, a) => s + (snapshots?.[a.id]?.saldo_fim_mes ?? Number(a.current_balance) ?? 0),
    0,
  );
  const totalEntradas = activeAccounts.reduce((s, a) => s + (snapshots?.[a.id]?.entradas_mes ?? 0), 0);
  const totalSaidas = activeAccounts.reduce((s, a) => s + (snapshots?.[a.id]?.saidas_mes ?? 0), 0);

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

      {/* Grid de contas */}
      {isLoading || snapLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : activeAccounts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhuma conta cadastrada. Clique em "Nova Conta" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {activeAccounts.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              snapshot={snapshots?.[a.id]}
              onClick={() => { /* drill-down: Fase 3 */ }}
              onEdit={() => { setEditingAccount(a); setAccountModalOpen(true); }}
            />
          ))}
        </div>
      )}

      <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} account={editingAccount} />
      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} />
    </div>
  );
}
