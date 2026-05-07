import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  category: {
    name: string;
    type: 'ENTRADA' | 'SAIDA';
    subtype?: string | null;
    color?: string | null;
    cost_center?: { name?: string | null } | null;
  };
  accountName?: string | null;
  onChange: () => void;
}

const SUBTYPE_LABEL: Record<string, string> = {
  RECORRENTE: 'Recorrente',
  AVULSA: 'Avulsa',
  FIXA: 'Fixa',
  VARIAVEL: 'Variável',
};

export function CategoryChip({ category, accountName, onChange }: Props) {
  const isIn = category.type === 'ENTRADA';
  const tone = isIn ? 'border-income/40 bg-income/5 text-income' : 'border-expense/40 bg-expense/5 text-expense';
  const Icon = category.subtype === 'RECORRENTE' || category.subtype === 'FIXA' ? RefreshCw : (isIn ? ArrowDownCircle : ArrowUpCircle);
  const subtypeLabel = SUBTYPE_LABEL[category.subtype || 'AVULSA'] || 'Avulsa';

  return (
    <div className={cn('flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2', tone)}>
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: category.color || '#6366f1' }} />
        <span className="font-bold text-sm text-foreground truncate">{category.name}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 ml-1">
        <Badge variant="outline" className="text-[10px] py-0 h-5">{isIn ? 'Entrada' : 'Saída'} {subtypeLabel}</Badge>
        {accountName && <Badge variant="outline" className="text-[10px] py-0 h-5">Conta: {accountName}</Badge>}
        {category.cost_center?.name && <Badge variant="outline" className="text-[10px] py-0 h-5">C. Custo: {category.cost_center.name}</Badge>}
      </div>
      <Button variant="ghost" size="sm" className="h-7 px-2 ml-auto text-xs" onClick={onChange}>
        <Pencil className="w-3 h-3 mr-1" /> Trocar
      </Button>
    </div>
  );
}
