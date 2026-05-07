import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Plus, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { normalizeForSearch } from '../CategorySearchInput';

interface ClientLite {
  id: string;
  name: string;
}

interface Props {
  clients: ClientLite[];
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
  placeholder?: string;
}

export function QuickClientCombobox({ clients, value, onChange, required, placeholder = 'Selecionar cliente' }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const selected = clients.find(c => c.id === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = normalizeForSearch(search);
    return clients.filter(c => normalizeForSearch(c.name).includes(q));
  }, [clients, search]);

  const exact = useMemo(
    () => clients.find(c => normalizeForSearch(c.name) === normalizeForSearch(search.trim())),
    [clients, search]
  );

  const handleCreate = async () => {
    const name = search.trim();
    if (!name) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('recurring_clients')
        .insert({ name, active: true } as any)
        .select('id, name')
        .single();
      if (error) throw error;
      toast.success(`Cliente "${name}" criado!`);
      await qc.invalidateQueries({ queryKey: ['recurring_clients'] });
      onChange(data.id);
      setSearch('');
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar cliente');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal h-9',
            required && !value && 'border-destructive',
            !selected && 'text-muted-foreground'
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{selected?.name || placeholder}</span>
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[320px]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar cliente..."
          />
          <CommandList>
            {filtered.length === 0 && !search.trim() && (
              <CommandEmpty>Nenhum cliente cadastrado.</CommandEmpty>
            )}
            {filtered.length > 0 && (
              <CommandGroup heading="Clientes">
                {filtered.map(c => (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    onSelect={() => { onChange(c.id); setOpen(false); setSearch(''); }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === c.id ? 'opacity-100' : 'opacity-0')} />
                    <span className="truncate">{c.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {search.trim() && !exact && (
              <CommandGroup heading="Criar novo">
                <CommandItem onSelect={handleCreate} disabled={creating}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Criar cliente: <span className="font-semibold ml-1">{search.trim()}</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
