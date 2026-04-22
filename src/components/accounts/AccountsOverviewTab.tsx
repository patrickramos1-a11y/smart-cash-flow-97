import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { type Account, useAccounts } from '@/hooks/useFinancialConfig';
import { useAccountsOverview } from '@/hooks/useAccountsOverview';
import { AccountsHeader } from './AccountsHeader';
import { AccountsKpiGrid } from './AccountsKpiGrid';
import { AccountsGrid } from './AccountsGrid';
import { AccountsRankings } from './AccountsRankings';

interface Props {
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  year: number;
  month: number | null;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number | null) => void;
  onNewAccount: () => void;
  onEditAccount: (account: Account) => void;
  onTransfer: (fromAccountId?: string) => void;
  onViewDetails: (accountId: string) => void;
}

export function AccountsOverviewTab({
  selectedAccountId, setSelectedAccountId, year, month,
  onYearChange, onMonthChange, onNewAccount, onViewDetails,
}: Props) {
  const queryClient = useQueryClient();
  const { data: accounts } = useAccounts();
  const [refreshing, setRefreshing] = useState(false);

  const { items, kpis, rankings, driftCount } = useAccountsOverview({ year, month });

  const handleRefresh = async () => {
    if (!accounts || accounts.length === 0) return;
    setRefreshing(true);
    try {
      const results = await Promise.allSettled(
        accounts.map(a =>
          supabase.rpc('recalculate_account_balance', { p_account_id: a.id } as any),
        ),
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      if (failed > 0) toast.warning(`Reconciliado com ${failed} falhas.`);
      else toast.success('Saldos reconciliados!');
    } catch (e: any) {
      toast.error('Erro ao reconciliar: ' + (e?.message ?? 'desconhecido'));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-3 lg:space-y-4">
      <AccountsHeader
        year={year}
        month={month}
        onYearChange={onYearChange}
        onMonthChange={onMonthChange}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
      />

      {driftCount > 0 && (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
            <p className="text-xs text-warning flex-1">
              <strong>{driftCount}</strong> {driftCount === 1 ? 'conta com saldo divergente' : 'contas com saldo divergente'} entre o calculado e o armazenado.
            </p>
            <Button size="sm" variant="outline" className="h-7 text-xs border-warning/40 text-warning hover:bg-warning/20" onClick={handleRefresh} disabled={refreshing}>
              Reconciliar agora
            </Button>
          </CardContent>
        </Card>
      )}

      <AccountsKpiGrid kpis={kpis} />

      <AccountsGrid
        items={items}
        selectedAccountId={selectedAccountId}
        onSelect={setSelectedAccountId}
        onViewDetails={onViewDetails}
        onNewAccount={onNewAccount}
      />

      <AccountsRankings rankings={rankings} />
    </div>
  );
}
