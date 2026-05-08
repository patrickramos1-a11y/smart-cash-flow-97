import {
  LayoutDashboard,
  ArrowDownUp,
  Wallet,
  AlertCircle,
  Menu,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMenuOpen: () => void;
}

const leftItems = [
  { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transações', icon: ArrowDownUp },
];

const rightItems = [
  { id: 'accounts', label: 'Contas', icon: Wallet },
  { id: 'open-payments', label: 'Em Aberto', icon: AlertCircle, alert: true },
];

export function MobileBottomNav({ activeTab, onTabChange, onMenuOpen }: MobileBottomNavProps) {
  const isTransactionPage = ['transactions', 'entradas-recorrentes', 'entradas-avulsas', 'despesas-fixas', 'despesas-variaveis', 'lancamento'].includes(activeTab);

  const renderItem = (item: typeof leftItems[number] & { alert?: boolean }) => {
    const Icon = item.icon;
    const isActive = item.id === 'transactions' ? isTransactionPage : activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onTabChange(item.id)}
        className={cn(
          'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors active:bg-muted/50 relative',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        <div className="relative">
          <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')} />
          {item.alert && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-expense rounded-full animate-pulse" />
          )}
        </div>
        <span className={cn('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom px-3 pb-2">
      <div className="relative mx-auto max-w-md">
        {/* FAB central */}
        <button
          onClick={() => onTabChange('lancamento')}
          aria-label="Novo lançamento"
          className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full gradient-brand text-white shadow-brand flex items-center justify-center active:scale-95 transition-transform ring-4 ring-background"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>

        <div className="glass rounded-2xl shadow-elevated border border-border/40 flex items-stretch overflow-hidden h-16">
          {leftItems.map(renderItem)}
          <div className="w-14 flex-shrink-0" aria-hidden /> {/* spacer for FAB */}
          {rightItems.map(renderItem)}
          <button
            onClick={onMenuOpen}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground active:bg-muted/50 transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
