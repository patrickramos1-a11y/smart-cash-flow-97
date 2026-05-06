import { Plus, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthYearNavigator } from '@/components/ui/month-year-navigator';

interface Props {
  month: number;
  year: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
  onNewAccount: () => void;
  onTransfer: () => void;
}

export function AccountsHeader({ month, year, onMonthChange, onYearChange, onNewAccount, onTransfer }: Props) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Contas</h1>
        <p className="text-xs lg:text-sm text-muted-foreground">
          Controle e distribuição de recursos por setor
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MonthYearNavigator
          month={month}
          year={year}
          onMonthChange={onMonthChange}
          onYearChange={onYearChange}
        />
        <Button variant="outline" size="sm" onClick={onTransfer} className="gap-1.5">
          <ArrowRightLeft className="w-4 h-4" /> Transferir
        </Button>
        <Button size="sm" onClick={onNewAccount} className="gap-1.5">
          <Plus className="w-4 h-4" /> Nova Conta
        </Button>
      </div>
    </div>
  );
}
