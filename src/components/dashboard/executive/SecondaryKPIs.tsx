import { RefreshCw, DollarSign, Target, Percent, Receipt, CreditCard, AlertCircle, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/data/mockData';

interface SecondaryKPIsProps {
  receitaYTD: number;
  receitaRecorrente: number;
  ticketMedio: number;
  margemOperacional: number;
  aReceber: number;
  aPagar: number;
  atrasados: number;
  burnRate: number;
  mrrEstimado: number;
}

interface MiniProps {
  label: string;
  value: string;
  Icon: any;
  tone?: 'income' | 'expense' | 'warning' | 'info' | 'neutral';
}

function Mini({ label, value, Icon, tone = 'neutral' }: MiniProps) {
  const toneMap = {
    income: 'text-income',
    expense: 'text-expense',
    warning: 'text-warning',
    info: 'text-info',
    neutral: 'text-foreground',
  };
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className={cn("w-4 h-4", toneMap[tone])} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{label}</p>
        <p className={cn("text-sm font-semibold truncate", toneMap[tone])}>{value}</p>
      </div>
    </div>
  );
}

export function SecondaryKPIs({
  receitaYTD, receitaRecorrente, ticketMedio, margemOperacional,
  aReceber, aPagar, atrasados, burnRate, mrrEstimado,
}: SecondaryKPIsProps) {
  const recorrentePct = receitaYTD > 0 ? (receitaRecorrente / receitaYTD) * 100 : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2 lg:gap-3">
      <Mini label="% Recorrente" value={`${recorrentePct.toFixed(1)}%`} Icon={RefreshCw} tone="info" />
      <Mini label="MRR Estimado" value={formatCurrency(mrrEstimado)} Icon={DollarSign} tone="income" />
      <Mini label="Ticket Médio" value={formatCurrency(ticketMedio)} Icon={Target} tone="neutral" />
      <Mini label="Margem Op." value={`${margemOperacional.toFixed(1)}%`} Icon={Percent} tone={margemOperacional >= 0 ? 'income' : 'expense'} />
      <Mini label="A Receber" value={formatCurrency(aReceber)} Icon={Receipt} tone="warning" />
      <Mini label="A Pagar" value={formatCurrency(aPagar)} Icon={CreditCard} tone="expense" />
      <Mini label="Atrasados" value={formatCurrency(atrasados)} Icon={AlertCircle} tone="expense" />
      <Mini label="Burn Rate/mês" value={formatCurrency(burnRate)} Icon={Flame} tone="warning" />
    </div>
  );
}
