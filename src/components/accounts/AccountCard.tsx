import { TrendingUp, TrendingDown, Wallet, Banknote, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Account } from '@/hooks/useFinancialConfig';
import type { AccountSnapshot } from '@/hooks/useAccountsSnapshot';

interface Props {
  account: Account;
  snapshot?: AccountSnapshot;
  onClick: () => void;
  onEdit: () => void;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function AccountCard({ account, snapshot, onClick, onEdit }: Props) {
  const saldo = snapshot?.saldo_fim_mes ?? Number(account.current_balance) ?? 0;
  const variacao = snapshot?.variacao ?? 0;
  const entradas = snapshot?.entradas_mes ?? 0;
  const saidas = snapshot?.saidas_mes ?? 0;
  const trIn = snapshot?.transferencias_in ?? 0;
  const trOut = snapshot?.transferencias_out ?? 0;
  const trNet = trIn - trOut;
  const Trend = variacao > 0 ? TrendingUp : variacao < 0 ? TrendingDown : Wallet;
  const trendColor =
    variacao > 0 ? 'text-primary' : variacao < 0 ? 'text-destructive' : 'text-muted-foreground';
  const color = account.category?.color || '#10b981';

  return (
    <button
      onClick={onClick}
      className="text-left bg-card border border-border rounded-lg p-3 hover:shadow-md hover:border-primary/40 transition-all flex flex-col gap-2 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}20` }}
          >
            <Banknote className="w-4 h-4" style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-xs truncate leading-tight">{account.name}</p>
            <p className="text-[10px] text-muted-foreground truncate leading-tight">
              {account.bank || account.category?.name || '—'}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Editar"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>

      <div>
        <p className={cn('text-lg font-bold leading-tight', saldo >= 0 ? 'text-foreground' : 'text-destructive')}>
          {fmt(saldo)}
        </p>
        <div className={cn('flex items-center gap-1 text-[10px]', trendColor)}>
          <Trend className="w-3 h-3" />
          <span className="font-medium">{variacao >= 0 ? '+' : ''}{fmt(variacao)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-border">
        <div className="flex items-center gap-1 text-primary">
          <ArrowDownLeft className="w-3 h-3" />
          <span className="font-semibold">{fmt(entradas)}</span>
        </div>
        <div className="flex items-center gap-1 text-destructive">
          <ArrowUpRight className="w-3 h-3" />
          <span className="font-semibold">{fmt(saidas)}</span>
        </div>
      </div>
      {(trIn > 0 || trOut > 0) && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground -mt-1">
          <div className="flex items-center gap-1">
            <ArrowLeftRight className="w-2.5 h-2.5" />
            <span>Transf.</span>
          </div>
          <span className={cn('font-medium', trNet >= 0 ? 'text-primary' : 'text-destructive')}>
            {trNet >= 0 ? '+' : ''}{fmt(trNet)}
          </span>
        </div>
      )}
    </button>
  );
}
