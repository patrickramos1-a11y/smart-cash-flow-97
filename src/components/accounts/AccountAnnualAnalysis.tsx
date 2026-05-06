import { Fragment, useMemo, useState } from 'react';
import { useAccountAnnual, type AnnualPeriodMode } from '@/hooks/useAccountAnnual';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronRight,
} from 'lucide-react';
import { AccountAnnualChart } from './AccountAnnualChart';
import { AccountBalanceEvolutionChart } from './AccountBalanceEvolutionChart';
import { AccountMonthDrillDown } from './AccountMonthDrillDown';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface Props {
  accountId: string;
  year: number;
}

function KPI({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  hint,
}: {
  label: string;
  value: string;
  icon?: any;
  tone?: 'neutral' | 'in' | 'out' | 'transfer' | 'up' | 'down';
  hint?: string;
}) {
  const color =
    tone === 'in' || tone === 'up'
      ? 'text-primary'
      : tone === 'out' || tone === 'down'
        ? 'text-destructive'
        : tone === 'transfer'
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-foreground';
  return (
    <div className="rounded-lg border border-border p-3 bg-card">
      <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground tracking-wide">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </div>
      <p className={cn('text-base font-bold mt-1', color)}>{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

export function AccountAnnualAnalysis({ accountId, year }: Props) {
  const [mode, setMode] = useState<AnnualPeriodMode>('competencia');
  const { data, isLoading } = useAccountAnnual(accountId, year, mode);
  const [expanded, setExpanded] = useState<number | null>(null);

  const insights = useMemo(() => {
    if (!data) return null;
    const closing = data.months[11].endBalance;
    const variation = closing - data.openingBalance;
    const variationPct = data.openingBalance !== 0 ? (variation / Math.abs(data.openingBalance)) * 100 : 0;

    // Best / worst month by net flow
    const flows = data.months.map((m) => ({
      month: m.month,
      net: m.totalIn + m.transferIn - m.totalOut - m.transferOut,
    }));
    const best = flows.reduce((a, b) => (b.net > a.net ? b : a));
    const worst = flows.reduce((a, b) => (b.net < a.net ? b : a));

    // Active months (with any movement)
    const activeMonths = data.months.filter(
      (m) => m.totalIn || m.totalOut || m.transferIn || m.transferOut,
    ).length;

    const monthlyAvgIn = activeMonths ? data.totals.in / activeMonths : 0;
    const monthlyAvgOut = activeMonths ? data.totals.out / activeMonths : 0;

    return {
      closing,
      variation,
      variationPct,
      best,
      worst,
      activeMonths,
      monthlyAvgIn,
      monthlyAvgOut,
    };
  }, [data]);

  if (isLoading || !data || !insights) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  const topIn = data.categories.filter((c) => c.type === 'ENTRADA').slice(0, 5);
  const topOut = data.categories.filter((c) => c.type === 'SAIDA').slice(0, 5);
  const totalInTop = topIn.reduce((s, c) => s + c.total, 0);
  const totalOutTop = topOut.reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-4">
      {/* Annual KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <KPI
          label="Saldo abertura"
          value={fmt(data.openingBalance)}
          icon={Wallet}
        />
        <KPI label="Total recebido" value={fmt(data.totals.in)} tone="in" icon={ArrowDownLeft} />
        <KPI label="Total gasto" value={fmt(data.totals.out)} tone="out" icon={ArrowUpRight} />
        <KPI
          label="Transferências"
          value={`+${fmt(data.totals.transferIn)} / −${fmt(data.totals.transferOut)}`}
          tone="transfer"
          icon={ArrowLeftRight}
        />
        <KPI
          label="Saldo final"
          value={fmt(insights.closing)}
          icon={Wallet}
          hint={`Variação ${insights.variationPct >= 0 ? '+' : ''}${insights.variationPct.toFixed(1)}%`}
          tone={insights.variation >= 0 ? 'up' : 'down'}
        />
        <KPI
          label="Meses ativos"
          value={`${insights.activeMonths}/12`}
          hint={`Média entradas ${fmt(insights.monthlyAvgIn)}`}
        />
      </div>

      {/* Best / Worst */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase text-muted-foreground">Melhor mês</p>
            <p className="text-sm font-semibold">
              {MONTHS[insights.best.month - 1]} · {fmt(insights.best.net)}
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase text-muted-foreground">Pior mês</p>
            <p className="text-sm font-semibold">
              {MONTHS[insights.worst.month - 1]} · {fmt(insights.worst.net)}
            </p>
          </div>
        </div>
      </div>

      {/* Evolution */}
      <div className="rounded-lg border border-border p-3">
        <h3 className="text-sm font-semibold mb-2">Evolução do saldo · {year}</h3>
        <AccountBalanceEvolutionChart accountId={accountId} year={year} />
      </div>

      {/* Annual chart in/out */}
      <AccountAnnualChart accountId={accountId} year={year} />

      {/* Top categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border p-3">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <ArrowDownLeft className="w-3.5 h-3.5 text-primary" /> Top entradas do ano
          </h3>
          {topIn.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3">Sem entradas no ano.</p>
          ) : (
            <div className="space-y-2">
              {topIn.map((c) => {
                const pct = totalInTop ? (c.total / totalInTop) * 100 : 0;
                return (
                  <div key={c.id}>
                    <div className="flex justify-between text-xs">
                      <span className="truncate flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: c.color }}
                        />
                        {c.name}
                      </span>
                      <span className="font-mono font-semibold">{fmt(c.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                      <div
                        className="h-full"
                        style={{ width: `${pct}%`, background: c.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border p-3">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-destructive" /> Top saídas do ano
          </h3>
          {topOut.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3">Sem saídas no ano.</p>
          ) : (
            <div className="space-y-2">
              {topOut.map((c) => {
                const pct = totalOutTop ? (c.total / totalOutTop) * 100 : 0;
                return (
                  <div key={c.id}>
                    <div className="flex justify-between text-xs">
                      <span className="truncate flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: c.color }}
                        />
                        {c.name}
                      </span>
                      <span className="font-mono font-semibold">{fmt(c.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                      <div
                        className="h-full"
                        style={{ width: `${pct}%`, background: c.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Monthly summary table com drill-down */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold">Resumo mensal · {year}</h3>
          <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
            {(['competencia', 'caixa'] as AnnualPeriodMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'px-2.5 py-1 text-[11px] rounded font-medium capitalize transition-colors',
                  mode === m
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
                title={m === 'competencia' ? 'Por mês de competência (igual às páginas de despesas/entradas)' : 'Por data de pagamento real (caixa)'}
              >
                {m === 'competencia' ? 'Competência' : 'Caixa'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="p-2 font-medium w-8"></th>
              <th className="p-2 font-medium">Mês</th>
              <th className="p-2 font-medium text-right">Entradas</th>
              <th className="p-2 font-medium text-right">Saídas</th>
              <th className="p-2 font-medium text-right">Transf. líq.</th>
              <th className="p-2 font-medium text-right">Resultado</th>
              <th className="p-2 font-medium text-right">Saldo final</th>
            </tr>
          </thead>
          <tbody>
            {data.months.map((m) => {
              const transfNet = m.transferIn - m.transferOut;
              const result = m.totalIn - m.totalOut + transfNet;
              const isOpen = expanded === m.month;
              const hasMovement =
                m.totalIn || m.totalOut || m.transferIn || m.transferOut;
              return (
                <Fragment key={m.month}>
                  <tr
                    key={m.month}
                    className={cn(
                      'border-t border-border/50 cursor-pointer hover:bg-muted/30 transition-colors',
                      isOpen && 'bg-muted/40',
                    )}
                    onClick={() => setExpanded(isOpen ? null : m.month)}
                  >
                    <td className="p-2 text-muted-foreground">
                      <ChevronRight
                        className={cn(
                          'w-3.5 h-3.5 transition-transform',
                          isOpen && 'rotate-90',
                          !hasMovement && 'opacity-30',
                        )}
                      />
                    </td>
                    <td className="p-2 font-medium">{MONTHS[m.month - 1]}</td>
                    <td className="p-2 text-right text-primary">{fmt(m.totalIn)}</td>
                    <td className="p-2 text-right text-destructive">−{fmt(m.totalOut)}</td>
                    <td
                      className={cn(
                        'p-2 text-right',
                        transfNet > 0
                          ? 'text-primary'
                          : transfNet < 0
                            ? 'text-destructive'
                            : 'text-muted-foreground',
                      )}
                    >
                      {transfNet >= 0 ? '+' : ''}
                      {fmt(transfNet)}
                    </td>
                    <td
                      className={cn(
                        'p-2 text-right font-semibold',
                        result >= 0 ? 'text-primary' : 'text-destructive',
                      )}
                    >
                      {result >= 0 ? '+' : ''}
                      {fmt(result)}
                    </td>
                    <td className="p-2 text-right font-mono">{fmt(m.endBalance)}</td>
                  </tr>
                  {isOpen && (
                    <tr key={`${m.month}-detail`} className="border-t border-border/30">
                      <td colSpan={7} className="p-0">
                        <AccountMonthDrillDown
                          accountId={accountId}
                          year={year}
                          month={m.month}
                          expected={{
                            totalIn: m.totalIn,
                            totalOut: m.totalOut,
                            transferIn: m.transferIn,
                            transferOut: m.transferOut,
                            endBalance: m.endBalance,
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
