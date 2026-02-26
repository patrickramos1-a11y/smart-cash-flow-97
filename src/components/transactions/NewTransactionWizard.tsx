import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowDownCircle, ArrowUpCircle, RefreshCw, FileText, 
  Search, Tags
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTransactionCategories, type TransactionCategory } from '@/hooks/useFinancialConfig';
import { QuickTransactionModal } from './QuickTransactionModal';
import { NewFixedExpenseModal } from './NewFixedExpenseModal';
import { NewRecurringContractModal } from '@/components/contracts/NewRecurringContractModal';

interface NewTransactionWizardProps {
  open: boolean;
  onClose: () => void;
  defaultMonth?: number;
  defaultYear?: number;
}

const SUBTYPE_INFO = {
  RECORRENTE: { label: 'Entrada Recorrente', icon: RefreshCw, color: 'text-income', desc: 'Contrato mensal' },
  AVULSA: { label: 'Entrada Avulsa', icon: FileText, color: 'text-income', desc: 'Lançamento pontual' },
  FIXA: { label: 'Despesa Fixa', icon: RefreshCw, color: 'text-expense', desc: 'Projeção automática' },
  VARIAVEL: { label: 'Despesa Variável', icon: FileText, color: 'text-expense', desc: 'Lançamento / parcelamento' },
};

export function NewTransactionWizard({ open, onClose, defaultMonth, defaultYear }: NewTransactionWizardProps) {
  const { data: categories } = useTransactionCategories();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | null>(null);
  const [redirectModal, setRedirectModal] = useState<string | null>(null);

  const resetWizard = () => {
    setSearch('');
    setSelectedCategory(null);
    setRedirectModal(null);
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const handleSelectCategory = (cat: TransactionCategory) => {
    setSelectedCategory(cat);
    const subtype = cat.subtype;
    
    if (subtype === 'RECORRENTE' && cat.type === 'ENTRADA') {
      setRedirectModal('recurring');
    } else if (subtype === 'AVULSA' && cat.type === 'ENTRADA') {
      setRedirectModal('avulsa_entrada');
    } else if (subtype === 'FIXA' && cat.type === 'SAIDA') {
      setRedirectModal('fixa');
    } else if (subtype === 'VARIAVEL' && cat.type === 'SAIDA') {
      setRedirectModal('variavel');
    }
  };

  // Filter categories by search
  const filteredCategories = categories?.filter(c => {
    if (!c.active) return false;
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase());
  }) || [];

  // Group for display
  const groups = [
    { key: 'RECORRENTE', type: 'ENTRADA' as const, items: filteredCategories.filter(c => c.type === 'ENTRADA' && c.subtype === 'RECORRENTE') },
    { key: 'AVULSA', type: 'ENTRADA' as const, items: filteredCategories.filter(c => c.type === 'ENTRADA' && c.subtype === 'AVULSA') },
    { key: 'FIXA', type: 'SAIDA' as const, items: filteredCategories.filter(c => c.type === 'SAIDA' && c.subtype === 'FIXA') },
    { key: 'VARIAVEL', type: 'SAIDA' as const, items: filteredCategories.filter(c => c.type === 'SAIDA' && c.subtype === 'VARIAVEL') },
  ];

  // Handle sub-modal rendering
  if (redirectModal === 'recurring') {
    return (
      <NewRecurringContractModal
        open={true}
        onClose={handleClose}
        defaultYear={defaultYear}
      />
    );
  }

  if (redirectModal === 'avulsa_entrada') {
    return (
      <QuickTransactionModal
        open={true}
        onClose={handleClose}
        tipo="ENTRADA"
        natureza="AVULSA"
        defaultMonth={defaultMonth}
        defaultYear={defaultYear}
        filterSubtype="AVULSA"
      />
    );
  }

  if (redirectModal === 'fixa') {
    return (
      <NewFixedExpenseModal
        open={true}
        onClose={handleClose}
        defaultMonth={defaultMonth}
        defaultYear={defaultYear}
      />
    );
  }

  if (redirectModal === 'variavel') {
    return (
      <QuickTransactionModal
        open={true}
        onClose={handleClose}
        tipo="SAIDA"
        natureza="AVULSA"
        defaultMonth={defaultMonth}
        defaultYear={defaultYear}
        filterSubtype="VARIAVEL"
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="w-5 h-5" />
            Novo Lançamento
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Selecione uma categoria para iniciar. O sistema identificará automaticamente o tipo de lançamento.
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar categoria..."
            className="pl-9"
          />
        </div>

        {/* Category list grouped */}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {groups.map(group => {
            if (group.items.length === 0) return null;
            const info = SUBTYPE_INFO[group.key as keyof typeof SUBTYPE_INFO];
            return (
              <div key={group.key}>
                <div className="flex items-center gap-2 mb-2">
                  <info.icon className={cn("w-3.5 h-3.5", info.color)} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {info.label}
                  </span>
                  <span className="text-xs text-muted-foreground">— {info.desc}</span>
                </div>
                <div className="grid gap-1.5">
                  {group.items.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat)}
                      className={cn(
                        "flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg border transition-colors",
                        "hover:bg-accent hover:border-primary/30"
                      )}
                    >
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#6366f1' }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{cat.name}</span>
                        <div className="flex gap-2 text-[10px] text-muted-foreground">
                          {(cat as any).default_account?.name && (
                            <span>Conta: {(cat as any).default_account.name}</span>
                          )}
                          {cat.cost_center?.name && (
                            <span>C.Custo: {cat.cost_center.name}</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {group.type === 'ENTRADA' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {search ? 'Nenhuma categoria encontrada.' : 'Nenhuma categoria cadastrada. Vá em Configurações > Categorias.'}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
