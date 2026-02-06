import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/data/mockData';

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  type?: 'income' | 'expense' | 'warning' | 'info' | 'default';
  trend?: number;
  subtitle?: string;
  isCurrency?: boolean;
  isPercentage?: boolean;
}

export function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  type = 'default',
  trend,
  subtitle,
  isCurrency = true,
  isPercentage = false
}: KPICardProps) {
  const typeClasses = {
    income: 'kpi-card-income',
    expense: 'kpi-card-expense',
    warning: 'kpi-card-warning',
    info: 'kpi-card-info',
    default: ''
  };

  const iconBgClasses = {
    income: 'bg-income-muted text-income',
    expense: 'bg-expense-muted text-expense',
    warning: 'bg-warning-muted text-warning',
    info: 'bg-info-muted text-info',
    default: 'bg-muted text-muted-foreground'
  };

  const formatValue = () => {
    if (isPercentage) return `${value.toFixed(1)}%`;
    if (isCurrency) return formatCurrency(value);
    return value.toLocaleString('pt-BR');
  };

  return (
    <div className={cn('kpi-card p-3 lg:p-6', typeClasses[type])}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-0.5 lg:mb-1 truncate">{title}</p>
          <p className={cn(
            "text-lg lg:text-2xl font-bold truncate",
            type === 'income' && "text-income",
            type === 'expense' && "text-expense",
            type === 'warning' && "text-warning",
            type === 'info' && "text-info"
          )}>
            {formatValue()}
          </p>
          {subtitle && (
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5 lg:mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0 ml-2",
          iconBgClasses[type]
        )}>
          <Icon className="w-4 h-4 lg:w-6 lg:h-6" />
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2 lg:mt-3 pt-2 lg:pt-3 border-t border-border/50">
          {trend >= 0 ? (
            <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4 text-income" />
          ) : (
            <TrendingDown className="w-3 h-3 lg:w-4 lg:h-4 text-expense" />
          )}
          <span className={cn(
            "text-xs lg:text-sm font-medium",
            trend >= 0 ? "text-income" : "text-expense"
          )}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
          <span className="text-[10px] lg:text-xs text-muted-foreground">vs mês anterior</span>
        </div>
      )}
    </div>
  );
}
