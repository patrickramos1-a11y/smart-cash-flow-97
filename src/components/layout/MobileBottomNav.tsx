import { 
  LayoutDashboard, 
  ArrowDownUp, 
  Wallet, 
  AlertCircle, 
  Menu 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMenuOpen: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transações', icon: ArrowDownUp },
  { id: 'accounts', label: 'Contas', icon: Wallet },
  { id: 'open-payments', label: 'Em Aberto', icon: AlertCircle },
  { id: 'menu', label: 'Menu', icon: Menu },
];

export function MobileBottomNav({ activeTab, onTabChange, onMenuOpen }: MobileBottomNavProps) {
  const isTransactionPage = ['transactions', 'entradas-recorrentes', 'entradas-avulsas', 'despesas-fixas', 'despesas-variaveis', 'lancamento'].includes(activeTab);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === 'menu' 
            ? false 
            : item.id === 'transactions' 
              ? isTransactionPage 
              : activeTab === item.id;

          if (item.id === 'menu') {
            return (
              <button
                key={item.id}
                onClick={onMenuOpen}
                className="flex-1 flex flex-col items-center justify-center py-2 pt-2.5 gap-0.5 text-muted-foreground active:bg-muted/50 transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 pt-2.5 gap-0.5 transition-colors active:bg-muted/50",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                {item.id === 'open-payments' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-expense rounded-full animate-pulse" />
                )}
              </div>
              <span className={cn(
                "text-[10px]",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
