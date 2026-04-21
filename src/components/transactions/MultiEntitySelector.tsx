import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, X, Search, ChevronDown } from 'lucide-react';
import { useFinancialEntities, EntityType } from '@/hooks/useFinancialEntities';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MultiEntitySelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  required?: boolean;
}

const TYPE_COLORS: Record<EntityType, string> = {
  COLABORADOR: 'bg-primary/10 text-primary border-primary/30',
  FORNECEDOR: 'bg-warning/10 text-warning border-warning/30',
  SOCIO: 'bg-income/10 text-income border-income/30',
  GRUPO: 'bg-info/10 text-info border-info/30',
};

const TYPE_FILTER_LABELS: Record<EntityType | 'all', string> = {
  all: 'Todos',
  COLABORADOR: 'Colaborador',
  SOCIO: 'Sócio',
  FORNECEDOR: 'Fornecedor',
  GRUPO: 'Cliente',
};

export function MultiEntitySelector({ selectedIds, onChange, label = 'Vinculado a (Entidade)', required }: MultiEntitySelectorProps) {
  const { data: entities } = useFinancialEntities();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<EntityType | 'all'>('all');

  const activeEntities = entities?.filter(e => e.active) || [];
  
  const filtered = activeEntities.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || e.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group entities by type
  const grouped = filtered.reduce((acc, e) => {
    const type = e.type as EntityType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(e);
    return acc;
  }, {} as Record<EntityType, typeof filtered>);

  const toggleEntity = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedEntities = activeEntities.filter(e => selectedIds.includes(e.id));

  const selectAllFiltered = () => {
    const ids = filtered.map(e => e.id);
    onChange(Array.from(new Set([...selectedIds, ...ids])));
  };

  const clearFiltered = () => {
    const filteredSet = new Set(filtered.map(e => e.id));
    onChange(selectedIds.filter(id => !filteredSet.has(id)));
  };

  return (
    <div>
      <Label>{label} {required && '*'}</Label>
      <p className="text-[10px] text-muted-foreground -mt-0.5 mb-1">
        Pessoa(s) ou grupo beneficiário(s) desta transação (ex.: FGTS → Darley, Luz → Grupo).
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between h-auto min-h-10 font-normal"
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedEntities.length === 0 ? (
                <span className="text-muted-foreground">Vincular pessoas ou clientes</span>
              ) : (
                selectedEntities.map(e => (
                  <Badge
                    key={e.id}
                    variant="outline"
                    className={cn("text-[10px] gap-1", TYPE_COLORS[e.type as EntityType])}
                  >
                    {e.name}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        toggleEntity(e.id);
                      }}
                    />
                  </Badge>
                ))
              )}
            </div>
            <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {(['all', 'COLABORADOR', 'SOCIO', 'FORNECEDOR', 'GRUPO'] as const).map(t => (
                <Badge
                  key={t}
                  variant={filterType === t ? 'default' : 'outline'}
                  className="text-[10px] cursor-pointer"
                  onClick={() => setFilterType(t)}
                >
                  {TYPE_FILTER_LABELS[t]}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={selectAllFiltered}>
                Selecionar visíveis
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearFiltered}>
                Limpar visíveis
              </Button>
            </div>
          </div>
          <ScrollArea className="max-h-60">
            <div className="p-1">
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {`${TYPE_FILTER_LABELS[type as EntityType]}s`}
                  </div>
                  {items.map(e => (
                    <div
                      key={e.id}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer"
                      onClick={() => toggleEntity(e.id)}
                    >
                      <Checkbox
                        checked={selectedIds.includes(e.id)}
                        className="pointer-events-none"
                      />
                      <span className="text-sm flex-1">{e.name}</span>
                      <Badge variant="outline" className={cn("text-[9px]", TYPE_COLORS[e.type as EntityType])}>
                        {TYPE_FILTER_LABELS[e.type as EntityType]}
                      </Badge>
                    </div>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">Nenhuma entidade encontrada</p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
