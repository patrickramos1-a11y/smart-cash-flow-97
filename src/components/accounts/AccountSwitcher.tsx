import { useState } from 'react';
import { Check, ChevronsUpDown, ChevronLeft, ChevronRight, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { Account } from '@/hooks/useFinancialConfig';

interface Props {
  accounts: Account[];
  currentId: string;
  onChange: (id: string) => void;
}

export function AccountSwitcher({ accounts, currentId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const idx = accounts.findIndex((a) => a.id === currentId);
  const current = accounts[idx];
  const prev = idx > 0 ? accounts[idx - 1] : null;
  const next = idx >= 0 && idx < accounts.length - 1 ? accounts[idx + 1] : null;

  if (!current) return null;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2"
        disabled={!prev}
        onClick={() => prev && onChange(prev.id)}
        title={prev?.name || ''}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 min-w-[180px] justify-between text-xs">
            <span className="truncate flex items-center gap-1.5">
              <Banknote className="w-3 h-3" style={{ color: current.category?.color || '#10b981' }} />
              {current.name}
            </span>
            <ChevronsUpDown className="w-3 h-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0" align="center">
          <Command>
            <CommandInput placeholder="Buscar conta..." className="h-8 text-xs" />
            <CommandList>
              <CommandEmpty className="text-xs py-3 text-center">Nada encontrado.</CommandEmpty>
              <CommandGroup>
                {accounts.map((a) => (
                  <CommandItem
                    key={a.id}
                    value={a.name}
                    onSelect={() => { onChange(a.id); setOpen(false); }}
                    className="text-xs"
                  >
                    <Banknote className="w-3 h-3 mr-2" style={{ color: a.category?.color || '#10b981' }} />
                    <span className="flex-1 truncate">{a.name}</span>
                    <Check className={cn('w-3 h-3', a.id === currentId ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2"
        disabled={!next}
        onClick={() => next && onChange(next.id)}
        title={next?.name || ''}
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
