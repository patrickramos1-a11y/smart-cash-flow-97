import { useMemo } from 'react';
import { useAccountAnnual } from '@/hooks/useAccountAnnual';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

interface Insight {
  icon: any;
  text: string;
  tone: 'info' | 'warn' | 'good' | 'bad';
}

interface Props {
  accountId: string;
  year: number;
}

export function AccountInsights({ accountId, year }: Props) {
  const { data, isLoading } = useAccountAnnual(accountId, year);

  const insights = useMemo<Insight[]>(() => {
    if (!data) return [];
    const list: Insight[] = [];

    // 1) categoria que mais pesa nas saídas
    const topOut = data.categories.filter((c) => c.type === 'SAIDA')[0];
    if (topOut && data.totals.out > 0) {
      const pct = (topOut.total / data.totals.out) * 100;
      list.push({
        icon: pct > 50 ? AlertTriangle : Info,
        tone: pct > 50 ? 'warn' : 'info',
        text: `Categoria "${topOut.name}" representa ${pct.toFixed(0)}% das despesas do ano.`,
      });
    }

    // 2) mês com maior saída
    const maxOutIdx = data.months.reduce((best, m, i) => (m.totalOut > data.months[best].totalOut ? i : best), 0);
    if (data.months[maxOutIdx].totalOut > 0) {
      list.push({
        icon: TrendingDown,
        tone: 'bad',
        text: `Mês com maior saída: ${MONTHS[maxOutIdx]} (${fmt(data.months[maxOutIdx].totalOut)}).`,
      });
    }

    // 3) % entradas via transferência
    const totalIn = data.totals.in + data.totals.transferIn;
    if (totalIn > 0) {
      const pct = (data.totals.transferIn / totalIn) * 100;
      list.push({
        icon: pct > 40 ? AlertTriangle : Info,
        tone: pct > 40 ? 'warn' : 'info',
        text: `Transferências internas representam ${pct.toFixed(0)}% das entradas — ${
          pct > 40 ? 'atenção: receita real pode ser menor.' : 'mix saudável de origens.'
        }`,
      });
    }

    // 4) crescimento dos últimos 6 meses (saldo)
    const balances = data.months.map((m) => m.endBalance);
    const last = balances[11];
    const sixAgo = balances[5];
    if (Math.abs(sixAgo) > 0.01) {
      const delta = ((last - sixAgo) / Math.abs(sixAgo)) * 100;
      list.push({
        icon: delta >= 0 ? TrendingUp : TrendingDown,
        tone: delta >= 0 ? 'good' : 'bad',
        text: `Saldo ${delta >= 0 ? 'cresceu' : 'caiu'} ${Math.abs(delta).toFixed(0)}% no segundo semestre.`,
      });
    }

    // 5) abertura → fechamento
    const closing = balances[11];
    const opening = data.openingBalance;
    list.push({
      icon: closing >= opening ? TrendingUp : TrendingDown,
      tone: closing >= opening ? 'good' : 'bad',
      text: `Saldo passou de ${fmt(opening)} (jan) para ${fmt(closing)} (dez), variação de ${fmt(closing - opening)}.`,
    });

    return list;
  }, [data]);

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (insights.length === 0) return null;

  const toneClass = {
    info: 'border-border bg-muted/30 text-foreground',
    good: 'border-primary/30 bg-primary/5 text-primary',
    bad: 'border-destructive/30 bg-destructive/5 text-destructive',
    warn: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  };

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Insights da conta · {year}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          return (
            <div key={i} className={cn('flex items-start gap-2 rounded-lg border p-2.5 text-xs', toneClass[ins.tone])}>
              <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="leading-snug">{ins.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
