import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, Plus, ArrowRight, TrendingUp } from 'lucide-react';
import { useAccountTransfers, useAccounts } from '@/hooks/useFinancialConfig';
import { TransferModal } from './TransferModal';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  selectedYear: number;
}

export function AccountsTransfersTab({ selectedYear }: Props) {
  const { data: transfers } = useAccountTransfers();
  const { data: accounts } = useAccounts();
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  const yearTransfers = useMemo(
    () => (transfers ?? []).filter(t => new Date(t.transfer_date).getFullYear() === selectedYear),
    [transfers, selectedYear],
  );

  const filtered = useMemo(() => {
    if (accountFilter === 'all') return yearTransfers;
    return yearTransfers.filter(t => t.from_account_id === accountFilter || t.to_account_id === accountFilter);
  }, [yearTransfers, accountFilter]);

  const totalTransferred = filtered.reduce((s, t) => s + Number(t.amount), 0);

  const flowMatrix = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of yearTransfers) {
      const key = `${t.from_account_id}→${t.to_account_id}`;
      map.set(key, (map.get(key) ?? 0) + Number(t.amount));
    }
    return Array.from(map.entries())
      .map(([key, total]) => {
        const [from, to] = key.split('→');
        return {
          from: accounts?.find(a => a.id === from)?.name ?? '?',
          to: accounts?.find(a => a.id === to)?.name ?? '?',
          total,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [yearTransfers, accounts]);

  const topOrigin = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of yearTransfers) map.set(t.from_account_id, (map.get(t.from_account_id) ?? 0) + Number(t.amount));
    const top = Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0];
    return top ? { name: accounts?.find(a => a.id === top[0])?.name ?? '?', value: top[1] } : null;
  }, [yearTransfers, accounts]);

  const topDest = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of yearTransfers) map.set(t.to_account_id, (map.get(t.to_account_id) ?? 0) + Number(t.amount));
    const top = Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0];
    return top ? { name: accounts?.find(a => a.id === top[0])?.name ?? '?', value: top[1] } : null;
  }, [yearTransfers, accounts]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">Total transferido em {selectedYear}</p>
            <p className="text-lg font-bold">{formatCurrency(totalTransferred)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">Quantidade</p>
            <p className="text-lg font-bold">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">Maior origem</p>
            <p className="text-sm font-semibold truncate">{topOrigin?.name ?? '—'}</p>
            {topOrigin && <p className="text-[11px] text-muted-foreground">{formatCurrency(topOrigin.value)}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">Maior destino</p>
            <p className="text-sm font-semibold truncate">{topDest?.name ?? '—'}</p>
            {topDest && <p className="text-[11px] text-muted-foreground">{formatCurrency(topDest.value)}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Fluxo entre contas (consolidado do ano)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {flowMatrix.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum fluxo no período.</p>
          ) : (
            <div className="space-y-2">
              {flowMatrix.map((f, i) => {
                const max = flowMatrix[0].total;
                const pct = (f.total / max) * 100;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{f.from}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{f.to}</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(f.total)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" /> Histórico de Transferências
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="h-8 text-xs w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts?.filter(a => a.active).map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8" onClick={() => setShowModal(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Nova
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] text-muted-foreground mb-3">
            Transferências não afetam o DRE — apenas redistribuem o saldo entre contas.
          </p>
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma transferência registrada.</p>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(t => {
                const from = accounts?.find(a => a.id === t.from_account_id);
                const to = accounts?.find(a => a.id === t.to_account_id);
                return (
                  <div key={t.id} className="flex items-center justify-between p-2.5 rounded-md border text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-info flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{from?.name ?? '?'} → {to?.name ?? '?'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(t.transfer_date).toLocaleDateString('pt-BR')}
                          {t.notes ? ` • ${t.notes}` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[11px] text-info border-info/40">{formatCurrency(Number(t.amount))}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TransferModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
