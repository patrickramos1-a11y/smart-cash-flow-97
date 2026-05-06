import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/data/mockData';
import type { MonthBucket } from '@/hooks/useDashboardYTD';

interface HeroKPIsProps {
  receitaYTD: number;
  despesaYTD: number;
  resultadoYTD: number;
  totalBalance: number;
  receitaYoY: number;
  despesaYoY: number;
  resultadoYoY: number;
  monthly: MonthBucket[];
  periodLabel: string;
}

interface CardProps {
  title: string;
  value: number;
  subtitle: string;
  yoy?: number;
  invertYoY?: boolean; // for expense, growth is bad
  data: { v: number }[];
  color: 'income' | 'expense' | 'info' | 'neutral';
  Icon: any;
}

function HeroCard({ title, value, subtitle, yoy, invertYoY, data, color, Icon }: CardProps) {
  const colorMap = {
    income: { text: 'text-income', stroke: 'hsl(var(--income))', bg: 'bg-income-muted' },
    expense: { text: 'text-expense', stroke: 'hsl(var(--expense))', bg: 'bg-expense-muted' },
    info: { text: 'text-info', stroke: 'hsl(var(--info))', bg: 'bg-info-muted' },
    neutral: { text: 'text-foreground', stroke: 'hsl(var(--primary))', bg: 'bg-muted' },
  }[color];

  const showTrend = yoy !== undefined;
  const isUp = (yoy ?? 0) >= 0;
  const positiveTrend = invertYoY ? !isUp : isUp;

  return (
    <div className="rounded-xl border border-border bg-card p-4 lg:p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs lg:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className={cn("text-xl lg:text-3xl font-bold truncate", colorMap.text)}>
            {formatCurrency(value)}
          </p>
          <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        </div>
        <div className={cn("w-9 h-9 lg:w-11 lg:h-11 rounded-lg flex items-center justify-center flex-shrink-0", colorMap.bg)}>
          <Icon className={cn("w-4 h-4 lg:w-5 lg:h-5", colorMap.text)} />
        </div>
      </div>

      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Tooltip
              cursor={false}
              contentStyle={{ display: 'none' }}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke={colorMap.stroke}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {showTrend && (
        <div className="flex items-center gap-1 pt-2 border-t border-border/50">
          {isUp ? (
            <TrendingUp className={cn("w-3.5 h-3.5", positiveTrend ? 'text-income' : 'text-expense')} />
          ) : (
            <TrendingDown className={cn("w-3.5 h-3.5", positiveTrend ? 'text-income' : 'text-expense')} />
          )}
          <span className={cn("text-xs font-semibold", positiveTrend ? 'text-income' : 'text-expense')}>
            {isUp ? '+' : ''}{(yoy ?? 0).toFixed(1)}%
          </span>
          <span className="text-[10px] lg:text-xs text-muted-foreground">vs mesmo período ano anterior</span>
        </div>
      )}
    </div>
  );
}

export function HeroKPIs({
  receitaYTD, despesaYTD, resultadoYTD, totalBalance,
  receitaYoY, despesaYoY, resultadoYoY,
  monthly, periodLabel,
}: HeroKPIsProps) {
  const receitaSpark = monthly.map(m => ({ v: m.receita }));
  const despesaSpark = monthly.map(m => ({ v: m.despesa }));
  const resultadoSpark = monthly.map(m => ({ v: m.resultado }));
  const balanceSpark = monthly.map(m => ({ v: totalBalance })); // placeholder flat

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <HeroCard
        title="Receita YTD"
        value={receitaYTD}
        subtitle={periodLabel}
        yoy={receitaYoY}
        data={receitaSpark}
        color="income"
        Icon={TrendingUp}
      />
      <HeroCard
        title="Despesa YTD"
        value={despesaYTD}
        subtitle={periodLabel}
        yoy={despesaYoY}
        invertYoY
        data={despesaSpark}
        color="expense"
        Icon={TrendingDown}
      />
      <HeroCard
        title="Resultado YTD"
        value={resultadoYTD}
        subtitle={periodLabel}
        yoy={resultadoYoY}
        data={resultadoSpark}
        color={resultadoYTD >= 0 ? 'income' : 'expense'}
        Icon={Wallet}
      />
      <HeroCard
        title="Saldo em Caixa"
        value={totalBalance}
        subtitle="Total atual de todas as contas"
        data={balanceSpark}
        color="info"
        Icon={CreditCard}
      />
    </div>
  );
}
