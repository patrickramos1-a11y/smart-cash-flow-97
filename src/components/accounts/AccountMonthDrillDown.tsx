import { useAccountDetail } from '@/hooks/useAccountDetail';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (s: string | null) => {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y.slice(-2)}`;
};

interface Props {
  accountId: string;
  year: number;
  month: number;
  /** valores agregados que devem bater com a soma dos lançamentos */
  expected: {
    totalIn: number;
    totalOut: number;
    transferIn: number;
    transferOut: number;
    endBalance: number;
  };
}

function Section({
  title,
  icon: Icon,
  tone,
  total,
  children,
  emptyText,
}: {
  title: string;
  icon: any;
  tone: 'in' | 'out' | 'transfer-in' | 'transfer-out';
  total: number;
  emptyText: string;
  children: React.ReactNode;
}) {
  const colorClass =
    tone === 'in' || tone === 'transfer-in'
      ? 'text-primary'
      : tone === 'out' || tone === 'transfer-out'
        ? 'text-destructive'
        : 'text-foreground';
  return (
    <div className="rounded-md border border-border/60 bg-background">
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Icon className={cn('w-3.5 h-3.5', colorClass)} /> {title}
        </div>
        <span className={cn('text-xs font-mono font-bold', colorClass)}>
          {tone === 'out' || tone === 'transfer-out' ? '−' : '+'}
          {fmt(total)}
        </span>
      </div>
      <div className="divide-y divide-border/40">{children || (
        <p className="text-[11px] text-muted-foreground px-2.5 py-2">{emptyText}</p>
      )}</div>
    </div>
  );
}

export function AccountMonthDrillDown({ accountId, year, month, expected }: Props) {
  const { data, isLoading } = useAccountDetail(accountId, year, month);

  if (isLoading || !data) return <Skeleton className="h-40 w-full" />;

  const entradas = data.paid.filter((t) => t.tipo_movimento === 'ENTRADA');
  const saidas = data.paid.filter((t) => t.tipo_movimento === 'SAIDA');
  const trIn = data.transfers.filter((t) => t.direction === 'IN');
  const trOut = data.transfers.filter((t) => t.direction === 'OUT');

  const sumIn = entradas.reduce((s, t) => s + (t.valor_pago ?? t.valor), 0);
  const sumOut = saidas.reduce((s, t) => s + (t.valor_pago ?? t.valor), 0);
  const sumTrIn = trIn.reduce((s, t) => s + t.amount, 0);
  const sumTrOut = trOut.reduce((s, t) => s + t.amount, 0);
  const transfNet = sumTrIn - sumTrOut;
  const result = sumIn - sumOut + transfNet;

  // Auditoria: cada total da seção deve bater com expected (vindo da tabela anual)
  const checks = [
    { label: 'Entradas', a: sumIn, b: expected.totalIn },
    { label: 'Saídas', a: sumOut, b: expected.totalOut },
    { label: 'Transf. recebidas', a: sumTrIn, b: expected.transferIn },
    { label: 'Transf. enviadas', a: sumTrOut, b: expected.transferOut },
  ];
  const inconsistencies = checks.filter((c) => Math.abs(c.a - c.b) > 0.01);

  return (
    <div className="p-3 space-y-3 bg-muted/20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Section
          title="Entradas"
          icon={ArrowDownLeft}
          tone="in"
          total={sumIn}
          emptyText="Sem recebimentos no mês."
        >
          {entradas.map((t) => (
            <TxRow key={t.id} t={t} positive />
          ))}
        </Section>
        <Section
          title="Saídas"
          icon={ArrowUpRight}
          tone="out"
          total={sumOut}
          emptyText="Sem despesas no mês."
        >
          {saidas.map((t) => (
            <TxRow key={t.id} t={t} positive={false} />
          ))}
        </Section>
        <Section
          title="Transf. recebidas"
          icon={ArrowLeftRight}
          tone="transfer-in"
          total={sumTrIn}
          emptyText="Sem transferências recebidas."
        >
          {trIn.map((t) => (
            <TransferRow key={t.id} t={t} />
          ))}
        </Section>
        <Section
          title="Transf. enviadas"
          icon={ArrowLeftRight}
          tone="transfer-out"
          total={sumTrOut}
          emptyText="Sem transferências enviadas."
        >
          {trOut.map((t) => (
            <TransferRow key={t.id} t={t} />
          ))}
        </Section>
      </div>

      {/* Resumo / conferência */}
      <div className="rounded-md border border-border bg-card p-2.5 text-xs space-y-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-semibold">Resumo do mês</span>
          <span className="font-mono">
            <span className="text-primary">+{fmt(sumIn)}</span> {' '}
            <span className="text-destructive">−{fmt(sumOut)}</span> {' '}
            <span className={transfNet >= 0 ? 'text-primary' : 'text-destructive'}>
              {transfNet >= 0 ? '+' : ''}
              {fmt(transfNet)}
            </span> {' = '}
            <strong className={result >= 0 ? 'text-primary' : 'text-destructive'}>
              {result >= 0 ? '+' : ''}
              {fmt(result)}
            </strong>
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Saldo final do mês</span>
          <span className="font-mono font-semibold text-foreground">{fmt(expected.endBalance)}</span>
        </div>
        {inconsistencies.length > 0 && (
          <div className="mt-1 pt-1 border-t border-destructive/30 text-destructive">
            <p className="font-semibold">⚠ Divergências detectadas:</p>
            {inconsistencies.map((c) => (
              <p key={c.label} className="font-mono text-[11px]">
                {c.label}: lançamentos {fmt(c.a)} ≠ tabela {fmt(c.b)} (Δ {fmt(c.a - c.b)})
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TxRow({ t, positive }: { t: any; positive: boolean }) {
  const v = t.valor_pago ?? t.valor;
  return (
    <div className="px-2.5 py-1.5 flex items-center gap-2 text-[11px] hover:bg-muted/30">
      <span className="text-muted-foreground font-mono w-12 flex-shrink-0">
        {fmtDate(t.data_pagamento || t.data_vencimento)}
      </span>
      {t.category_color && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: t.category_color }}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{t.descricao || '(sem descrição)'}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {t.category_name || 'Sem categoria'} · {t.natureza}
        </p>
      </div>
      <Badge variant="outline" className="h-4 text-[9px] px-1 flex-shrink-0">
        {t.status}
      </Badge>
      <span className={cn('font-mono font-semibold flex-shrink-0', positive ? 'text-primary' : 'text-destructive')}>
        {positive ? '+' : '−'}
        {fmt(v)}
      </span>
    </div>
  );
}

function TransferRow({ t }: { t: any }) {
  const isIn = t.direction === 'IN';
  return (
    <div className="px-2.5 py-1.5 flex items-center gap-2 text-[11px] hover:bg-muted/30">
      <span className="text-muted-foreground font-mono w-12 flex-shrink-0">
        {fmtDate(t.transfer_date)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {isIn ? 'De ' : 'Para '} {t.counterparty_name}
        </p>
        {t.notes && <p className="text-[10px] text-muted-foreground truncate">{t.notes}</p>}
      </div>
      <span className={cn('font-mono font-semibold flex-shrink-0', isIn ? 'text-primary' : 'text-destructive')}>
        {isIn ? '+' : '−'}
        {fmt(t.amount)}
      </span>
    </div>
  );
}
