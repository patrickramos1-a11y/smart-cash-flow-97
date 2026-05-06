import { AlertTriangle, TrendingDown, AlertCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/data/mockData';

interface Account {
  id: string;
  name: string;
  current_balance: number;
}

interface AlertsBarProps {
  accounts?: Account[] | null;
  atrasados: number;
  monthlyReceita: number[]; // 12 months
}

export function AlertsBar({ accounts, atrasados, monthlyReceita }: AlertsBarProps) {
  const alerts: { type: 'danger' | 'warning'; icon: any; text: string }[] = [];

  const negativeAccounts = (accounts || []).filter(a => Number(a.current_balance) < 0);
  if (negativeAccounts.length > 0) {
    alerts.push({
      type: 'danger',
      icon: AlertCircle,
      text: `${negativeAccounts.length} conta(s) com saldo negativo: ${negativeAccounts.map(a => a.name).join(', ')}`,
    });
  }

  if (atrasados > 0) {
    alerts.push({
      type: 'danger',
      icon: AlertTriangle,
      text: `Atrasados: ${formatCurrency(atrasados)} em pagamentos vencidos`,
    });
  }

  // MoM revenue drop > 20%
  const today = new Date();
  const m = today.getMonth(); // 0-based; previous = m, before = m-1
  if (m >= 1) {
    const cur = monthlyReceita[m - 0]; // current month index
    const prev = monthlyReceita[m - 1];
    if (prev > 0 && cur < prev * 0.8) {
      const drop = ((prev - cur) / prev) * 100;
      alerts.push({
        type: 'warning',
        icon: TrendingDown,
        text: `Receita do mês caiu ${drop.toFixed(0)}% vs mês anterior`,
      });
    }
  }

  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border',
            a.type === 'danger'
              ? 'bg-expense-muted text-expense border-expense/30'
              : 'bg-warning-muted text-warning border-warning/30'
          )}
        >
          <a.icon className="w-3.5 h-3.5" />
          <span>{a.text}</span>
        </div>
      ))}
    </div>
  );
}
