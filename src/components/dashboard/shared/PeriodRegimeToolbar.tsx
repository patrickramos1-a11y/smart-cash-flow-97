import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { Regime } from '@/hooks/useAnnualBreakdown';

interface Props {
  year: number;
  onYearChange: (y: number) => void;
  regime: Regime;
  onRegimeChange: (r: Regime) => void;
  yearsRange?: number[];
  rightSlot?: React.ReactNode;
}

export function PeriodRegimeToolbar({ year, onYearChange, regime, onRegimeChange, yearsRange, rightSlot }: Props) {
  const cy = new Date().getFullYear();
  const years = yearsRange ?? Array.from({ length: 5 }, (_, i) => cy - 2 + i);

  return (
    <div className="flex flex-wrap items-center gap-2 lg:gap-3 bg-card border border-border rounded-xl px-3 py-2.5 lg:px-4 lg:py-3">
      <span className="text-xs lg:text-sm font-medium text-muted-foreground">Ano:</span>
      <Select value={String(year)} onValueChange={(v) => onYearChange(Number(v))}>
        <SelectTrigger className="w-24 h-8 lg:h-9 text-xs lg:text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="h-6 w-px bg-border mx-1" />

      <Label htmlFor="regime-toolbar" className="text-xs lg:text-sm text-muted-foreground">
        {regime === 'competencia' ? 'Competência' : 'Caixa'}
      </Label>
      <Switch
        id="regime-toolbar"
        checked={regime === 'caixa'}
        onCheckedChange={(c) => onRegimeChange(c ? 'caixa' : 'competencia')}
      />

      {rightSlot && <div className="ml-auto flex items-center gap-2">{rightSlot}</div>}
    </div>
  );
}
