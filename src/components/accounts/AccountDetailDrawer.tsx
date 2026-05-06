import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Account } from '@/hooks/useFinancialConfig';
import type { AccountSnapshot } from '@/hooks/useAccountsSnapshot';
import { useAccountDetail } from '@/hooks/useAccountDetail';
import { AccountAdjustmentModal } from './AccountAdjustmentModal';

interface Props {
  open: boolean;
  onClose: () => void;
  account: Account | null;
  snapshot?: AccountSnapshot;
  year: number;
  month: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (s: string | null) => {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y.slice(-2)}`;
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function AccountDetailDrawer({ open, onClose, account, snapshot, year, month }: Props) {
  const { data, isLoading } = useAccountDetail(account?.id || null, year, month);

  const [adjustOpen, setAdjustOpen] = useState(false);
  if (!account) return null;
  const periodLabel = `${MONTHS[month - 1]}/${year}`;
  const saldoFim = snapshot?.saldo_fim_mes ?? Number(account.current_balance) ?? 0;
  const saldoIni = snapshot?.saldo_inicio_mes ?? saldoFim;
  const variacao = snapshot?.variacao ?? 0;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: account.category?.color || '#10b981' }}
            />
            {account.name}
            <span className="text-xs text-muted-foreground font-normal">· {periodLabel}</span>
          </SheetTitle>
        </SheetHeader>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-lg border border-border p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Saldo inicial</p>
            <p className="text-sm font-bold">{fmt(saldoIni)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Variação</p>
            <p className={cn('text-sm font-bold', variacao >= 0 ? 'text-primary' : 'text-destructive')}>
              {variacao >= 0 ? '+' : ''}{fmt(variacao)}
            </p>
          </div>
          <div className="rounded-lg border border-border p-3 bg-muted/40">
            <p className="text-[10px] uppercase text-muted-foreground">Saldo final</p>
            <p className={cn('text-sm font-bold', saldoFim >= 0 ? 'text-foreground' : 'text-destructive')}>
              {fmt(saldoFim)}
            </p>
          </div>
        </div>

        <Tabs defaultValue="movimentos" className="mt-5">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="movimentos">Movimentos</TabsTrigger>
            <TabsTrigger value="abertas">Em aberto</TabsTrigger>
            <TabsTrigger value="transferencias">Transferências</TabsTrigger>
            <TabsTrigger value="composicao">Composição</TabsTrigger>
          </TabsList>

          <TabsContent value="movimentos" className="mt-3 space-y-1">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : data?.paid.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Sem movimentos pagos no período.
              </p>
            ) : (
              data?.paid.map((t) => {
                const v = t.valor_pago ?? t.valor;
                const isIn = t.tipo_movimento === 'ENTRADA';
                const ratio = t.valor > 0 ? (t.valor_pago ?? t.valor) / t.valor : 1;
                const suspeito = ratio > 50;
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 py-2 px-2 hover:bg-muted/50 rounded-lg border-b border-border/50"
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        isIn ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {isIn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{t.descricao || '—'}</p>
                        {suspeito && (
                          <Badge variant="destructive" className="h-5 text-[10px] gap-1">
                            <AlertTriangle className="w-3 h-3" /> suspeito
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {fmtDate(t.data_pagamento)} · {t.category_name || 'Sem categoria'}
                      </p>
                    </div>
                    <p
                      className={cn(
                        'text-sm font-bold flex-shrink-0',
                        isIn ? 'text-primary' : 'text-destructive',
                      )}
                    >
                      {isIn ? '+' : '−'} {fmt(v)}
                    </p>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="abertas" className="mt-3 space-y-1">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : data?.open.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sem pendências.</p>
            ) : (
              data?.open.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2 px-2 border-b border-border/50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.descricao || '—'}</p>
                    <p className="text-[11px] text-muted-foreground">
                      vence {fmtDate(t.data_vencimento)} · {t.status}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{fmt(t.valor)}</p>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="transferencias" className="mt-3 space-y-1">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : data?.transfers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhuma transferência no período.
              </p>
            ) : (
              data?.transfers.map((t) => {
                const isIn = t.direction === 'IN';
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 py-2 px-2 border-b border-border/50"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-foreground flex-shrink-0">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {isIn ? 'De ' : 'Para '} {t.counterparty_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {fmtDate(t.transfer_date)}
                        {t.notes ? ` · ${t.notes}` : ''}
                      </p>
                    </div>
                    <p className={cn('text-sm font-bold', isIn ? 'text-primary' : 'text-destructive')}>
                      {isIn ? '+' : '−'} {fmt(t.amount)}
                    </p>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="composicao" className="mt-3 space-y-2">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : data?.byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sem dados no período.</p>
            ) : (
              data?.byCategory.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ background: c.color }}
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className={cn('font-semibold', c.total >= 0 ? 'text-primary' : 'text-destructive')}>
                    {c.total >= 0 ? '+' : '−'} {fmt(Math.abs(c.total))}
                  </span>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
