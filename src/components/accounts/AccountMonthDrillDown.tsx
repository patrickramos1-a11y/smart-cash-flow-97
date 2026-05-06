import { useMemo, useState } from 'react';
import { useAccountDetail, type DetailPeriodMode } from '@/hooks/useAccountDetail';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Search, AlertTriangle } from 'lucide-react';
import { TransactionEditModal } from '@/components/transactions/TransactionEditModal';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (s: string | null) => {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y.slice(-2)}`;
};

type FilterTab = 'todos' | 'entradas' | 'saidas' | 'transferencias';

interface Props {
  accountId: string;
  year: number;
  month: number;
  mode?: DetailPeriodMode;
  expected: {
    totalIn: number;
    totalOut: number;
    transferIn: number;
    transferOut: number;
    endBalance: number;
  };
}

export function AccountMonthDrillDown({ accountId, year, month, mode = 'competencia', expected }: Props) {
  const { data, isLoading } = useAccountDetail(accountId, year, month, mode);
  const [filter, setFilter] = useState<FilterTab>('todos');
  const [search, setSearch] = useState('');
  const [editingTx, setEditingTx] = useState<any | null>(null);

  // Hooks must run unconditionally — compute even while loading
  const txs = data?.all ?? [];
  const transfers = data?.transfers ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return txs.filter((t) => {
      if (filter === 'entradas' && t.tipo_movimento !== 'ENTRADA') return false;
      if (filter === 'saidas' && t.tipo_movimento !== 'SAIDA') return false;
      if (filter === 'transferencias') return false;
      if (q) {
        const hay = `${t.descricao || ''} ${t.category_name || ''} ${t.cost_center_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [txs, filter, search]);

  const showTransfers = filter === 'todos' || filter === 'transferencias';

  // sums from raw lists (auditoria)
  const sumIn = txs.filter((t) => t.tipo_movimento === 'ENTRADA').reduce((s, t) => s + (t.valor_pago ?? t.valor), 0);
  const sumOut = txs.filter((t) => t.tipo_movimento === 'SAIDA').reduce((s, t) => s + (t.valor_pago ?? t.valor), 0);
  const sumTrIn = transfers.filter((t) => t.direction === 'IN').reduce((s, t) => s + t.amount, 0);
  const sumTrOut = transfers.filter((t) => t.direction === 'OUT').reduce((s, t) => s + t.amount, 0);
  const result = sumIn - sumOut + (sumTrIn - sumTrOut);

  const checks = [
    { label: 'Entradas', a: sumIn, b: expected.totalIn },
    { label: 'Saídas', a: sumOut, b: expected.totalOut },
    { label: 'Transf. recebidas', a: sumTrIn, b: expected.transferIn },
    { label: 'Transf. enviadas', a: sumTrOut, b: expected.transferOut },
  ];
  const inconsistencies = checks.filter((c) => Math.abs(c.a - c.b) > 0.01);

  if (isLoading || !data) return <Skeleton className="h-60 w-full" />;

  const counts = {
    todos: txs.length + transfers.length,
    entradas: txs.filter((t) => t.tipo_movimento === 'ENTRADA').length,
    saidas: txs.filter((t) => t.tipo_movimento === 'SAIDA').length,
    transferencias: transfers.length,
  };

  return (
    <div className="p-3 space-y-3 bg-muted/20">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
          {(['todos', 'entradas', 'saidas', 'transferencias'] as FilterTab[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-2.5 py-1 text-[11px] rounded font-medium capitalize transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {f === 'transferencias' ? 'Transf.' : f}{' '}
              <span className="opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px] max-w-[320px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar descrição, categoria, centro de custo…"
            className="h-7 pl-7 text-xs"
          />
        </div>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {mode === 'competencia' ? 'Regime: competência' : 'Regime: caixa (data de pagamento)'}
        </span>
      </div>

      {/* Tabela */}
      <div className="rounded-md border border-border bg-background overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-2 py-1.5 font-medium w-[68px]">Data</th>
              <th className="px-2 py-1.5 font-medium">Descrição</th>
              <th className="px-2 py-1.5 font-medium">Categoria</th>
              <th className="px-2 py-1.5 font-medium">Centro de custo</th>
              <th className="px-2 py-1.5 font-medium w-[90px]">Status</th>
              <th className="px-2 py-1.5 font-medium text-right w-[110px]">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !showTransfers && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-muted-foreground text-[11px]">
                  Sem lançamentos para este filtro.
                </td>
              </tr>
            )}
            {filtered.map((t) => {
              const v = t.valor_pago ?? t.valor;
              const positive = t.tipo_movimento === 'ENTRADA';
              return (
                <tr
                  key={t.id}
                  className="border-t border-border/50 hover:bg-muted/30 cursor-pointer"
                  onClick={() => setEditingTx(t)}
                >
                  <td className="px-2 py-1.5 font-mono text-muted-foreground">
                    {fmtDate(t.data_pagamento || t.data_vencimento)}
                  </td>
                  <td className="px-2 py-1.5">
                    <p className="font-medium">{t.descricao || '(sem descrição)'}</p>
                    <p className="text-[10px] text-muted-foreground">{t.natureza}</p>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      {t.category_color && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: t.category_color }}
                        />
                      )}
                      <span className="truncate">{t.category_name || 'Sem categoria'}</span>
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground truncate">
                    {t.cost_center_name || '—'}
                  </td>
                  <td className="px-2 py-1.5">
                    <Badge variant="outline" className="h-5 text-[10px]">
                      {t.status}
                    </Badge>
                  </td>
                  <td
                    className={cn(
                      'px-2 py-1.5 text-right font-mono font-semibold',
                      positive ? 'text-primary' : 'text-destructive',
                    )}
                  >
                    {positive ? '+' : '−'}
                    {fmt(v)}
                  </td>
                </tr>
              );
            })}

            {showTransfers && transfers.length > 0 && (
              <>
                <tr className="bg-muted/30">
                  <td colSpan={6} className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
                    Transferências internas
                  </td>
                </tr>
                {transfers.map((t) => {
                  const isIn = t.direction === 'IN';
                  return (
                    <tr key={t.id} className="border-t border-border/50 hover:bg-muted/30">
                      <td className="px-2 py-1.5 font-mono text-muted-foreground">{fmtDate(t.transfer_date)}</td>
                      <td className="px-2 py-1.5">
                        <p className="font-medium flex items-center gap-1.5">
                          <ArrowLeftRight className="w-3 h-3 text-muted-foreground" />
                          {isIn ? 'De ' : 'Para '} {t.counterparty_name}
                        </p>
                        {t.notes && <p className="text-[10px] text-muted-foreground">{t.notes}</p>}
                      </td>
                      <td className="px-2 py-1.5 text-muted-foreground italic">Transferência</td>
                      <td className="px-2 py-1.5 text-muted-foreground">—</td>
                      <td className="px-2 py-1.5">
                        <Badge variant="outline" className="h-5 text-[10px]">
                          {isIn ? 'RECEBIDA' : 'ENVIADA'}
                        </Badge>
                      </td>
                      <td
                        className={cn(
                          'px-2 py-1.5 text-right font-mono font-semibold',
                          isIn ? 'text-primary' : 'text-destructive',
                        )}
                      >
                        {isIn ? '+' : '−'}
                        {fmt(t.amount)}
                      </td>
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>
          <tfoot className="bg-muted/30 border-t border-border">
            <tr className="text-[11px]">
              <td colSpan={5} className="px-2 py-1.5 font-semibold text-right">
                Resultado do mês
              </td>
              <td
                className={cn(
                  'px-2 py-1.5 text-right font-mono font-bold',
                  result >= 0 ? 'text-primary' : 'text-destructive',
                )}
              >
                {result >= 0 ? '+' : ''}
                {fmt(result)}
              </td>
            </tr>
            <tr className="text-[10px] text-muted-foreground">
              <td colSpan={5} className="px-2 pb-1.5 text-right">
                <span className="text-primary">+{fmt(sumIn)}</span>{' '}
                <span className="text-destructive">−{fmt(sumOut)}</span>{' '}
                <span>(transf. líq. {sumTrIn - sumTrOut >= 0 ? '+' : ''}{fmt(sumTrIn - sumTrOut)})</span>
              </td>
              <td className="px-2 pb-1.5 text-right">
                Saldo final: <span className="font-mono text-foreground">{fmt(expected.endBalance)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {inconsistencies.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-[11px]">
          <p className="font-semibold text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Divergências entre lançamentos e tabela anual:
          </p>
          {inconsistencies.map((c) => (
            <p key={c.label} className="font-mono text-destructive">
              {c.label}: lançamentos {fmt(c.a)} ≠ resumo {fmt(c.b)} (Δ {fmt(c.a - c.b)})
            </p>
          ))}
        </div>
      )}

      {editingTx && (
        <TransactionEditModal
          open
          onClose={() => setEditingTx(null)}
          transaction={editingTx}
        />
      )}
    </div>
  );
}
