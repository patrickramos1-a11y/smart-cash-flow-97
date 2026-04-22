import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, CalendarRange, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface Props {
  year: number;
  month: number | null; // null = ano completo
  onYearChange: (y: number) => void;
  onMonthChange: (m: number | null) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function AccountsHeader({ year, month, onYearChange, onMonthChange, onRefresh, isRefreshing }: Props) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const isCurrentMonth = year === currentYear && month === currentMonth;
  const isFullYear = month === null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={year.toString()} onValueChange={(v) => onYearChange(Number(v))}>
        <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={month?.toString() ?? 'all'} onValueChange={(v) => onMonthChange(v === 'all' ? null : Number(v))}>
        <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Ano completo</SelectItem>
          {MONTHS.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
        </SelectContent>
      </Select>

      <Button
        variant={isCurrentMonth ? 'default' : 'outline'}
        size="sm"
        className="h-9 text-xs"
        onClick={() => { onYearChange(currentYear); onMonthChange(currentMonth); }}
      >
        <CalendarDays className="w-3.5 h-3.5 mr-1" /> Mês atual
      </Button>

      <Button
        variant={isFullYear ? 'default' : 'outline'}
        size="sm"
        className="h-9 text-xs"
        onClick={() => onMonthChange(null)}
      >
        <CalendarRange className="w-3.5 h-3.5 mr-1" /> Ano completo
      </Button>

      <Button variant="outline" size="sm" className="h-9 text-xs ml-auto" onClick={onRefresh} disabled={isRefreshing}>
        <RefreshCw className={cn('w-3.5 h-3.5 mr-1', isRefreshing && 'animate-spin')} />
        Atualizar saldos
      </Button>
    </div>
  );
}
