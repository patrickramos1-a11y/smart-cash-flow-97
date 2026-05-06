import { TrendingUp, TrendingDown, Wallet, Banknote } from 'lucide-react';
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

  return (
    <button
      onClick={onClick}
      className="text-left bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${account.category?.color || '#10b981'}20` }}
          >
            <Banknote className="w-5 h-5" style={{ color: account.category?.color || '#10b981' }} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{account.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {account.bank || account.category?.name || '—'}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="text-xs text-muted-foreground hover:text-primary"
        >
          editar
        </button>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">Saldo</p>
        <p className={cn('text-2xl font-bold', saldo >= 0 ? 'text-foreground' : 'text-destructive')}>
          {fmt(saldo)}
        </p>
        <div className={cn('flex items-center gap-1 text-xs mt-1', trendColor)}>
          <Trend className="w-3.5 h-3.5" />
          <span className="font-medium">{variacao >= 0 ? '+' : ''}{fmt(variacao)}</span>
          <span className="text-muted-foreground">no período</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">Entradas</p>
          <p className="text-sm font-semibold text-primary">{fmt(entradas)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">Saídas</p>
          <p className="text-sm font-semibold text-destructive">{fmt(saidas)}</p>
        </div>
      </div>
      {(trIn > 0 || trOut > 0) && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground -mt-1">
          <span>Transferências</span>
          <span className={cn('font-medium', trNet >= 0 ? 'text-primary' : 'text-destructive')}>
            {trNet >= 0 ? '+' : ''}{fmt(trNet)}
          </span>
        </div>
      )}
    </button>
  );
}
