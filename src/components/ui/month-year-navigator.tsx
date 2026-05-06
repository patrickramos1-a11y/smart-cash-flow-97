import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const MONTHS = [
  { value: 1, label: 'Jan', full: 'Janeiro' },
  { value: 2, label: 'Fev', full: 'Fevereiro' },
  { value: 3, label: 'Mar', full: 'Março' },
  { value: 4, label: 'Abr', full: 'Abril' },
  { value: 5, label: 'Mai', full: 'Maio' },
  { value: 6, label: 'Jun', full: 'Junho' },
  { value: 7, label: 'Jul', full: 'Julho' },
  { value: 8, label: 'Ago', full: 'Agosto' },
  { value: 9, label: 'Set', full: 'Setembro' },
  { value: 10, label: 'Out', full: 'Outubro' },
  { value: 11, label: 'Nov', full: 'Novembro' },
  { value: 12, label: 'Dez', full: 'Dezembro' },
];

interface MonthYearNavigatorProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  className?: string;
}

export function MonthYearNavigator({ month, year, onMonthChange, onYearChange, className }: MonthYearNavigatorProps) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  // Histórico desde 2021 + 2 anos no futuro
  const startYear = 2021;
  const endYear = currentYear + 2;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  const goBack = () => {
    if (month === 1) {
      onMonthChange(12);
      onYearChange(year - 1);
    } else {
      onMonthChange(month - 1);
    }
  };

  const goForward = () => {
    if (month === 12) {
      onMonthChange(1);
      onYearChange(year + 1);
    } else {
      onMonthChange(month + 1);
    }
  };

  return (
    <div className={cn("flex items-center gap-1.5 bg-card border border-border rounded-xl px-2 py-1.5 overflow-x-auto", className)}>
      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={goBack}>
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="flex gap-0.5 flex-shrink-0">
        {MONTHS.map((m) => (
          <button
            key={m.value}
            onClick={() => onMonthChange(m.value)}
            className={cn(
              "px-2 py-1 text-xs rounded-md font-medium transition-all whitespace-nowrap",
              month === m.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : m.value === currentMonth && year === currentYear
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={goForward}>
        <ChevronRight className="w-4 h-4" />
      </Button>

      <Select value={year.toString()} onValueChange={(v) => onYearChange(Number(v))}>
        <SelectTrigger className="w-16 h-7 text-xs border-0 bg-muted/50 flex-shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
