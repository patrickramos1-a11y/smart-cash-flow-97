import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccounts, useCostCenters, useTransactionCategories, type TransactionCategory, type CategorySubtype } from '@/hooks/useFinancialConfig';

interface CategoryFilteredSelectorProps {
  tipo: 'ENTRADA' | 'SAIDA';
  subtype: CategorySubtype;
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  filterAccountId: string;
  onFilterAccountChange: (accountId: string) => void;
  filterCostCenterId: string;
  onFilterCostCenterChange: (costCenterId: string) => void;
}

export function CategoryFilteredSelector({
  tipo,
  subtype,
  selectedCategoryId,
  onCategoryChange,
  filterAccountId,
  onFilterAccountChange,
  filterCostCenterId,
  onFilterCostCenterChange,
}: CategoryFilteredSelectorProps) {
  const { data: accounts } = useAccounts();
  const { data: costCenters } = useCostCenters();
  const { data: categories } = useTransactionCategories();

  const activeAccounts = accounts?.filter(a => a.active) || [];
  const activeCostCenters = costCenters?.filter(c => c.active) || [];

  let filteredCategories = categories?.filter(c => c.type === tipo && c.subtype === subtype && c.active) || [];
  
  if (filterAccountId) {
    filteredCategories = filteredCategories.filter(c => c.default_account_id === filterAccountId);
  }
  if (filterCostCenterId) {
    filteredCategories = filteredCategories.filter(c => c.cost_center_id === filterCostCenterId);
  }

  const selectedCategory = categories?.find(c => c.id === selectedCategoryId);

  return (
    <div className="space-y-3">
      {/* Pre-filters */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Filtrar por Conta</Label>
          <Select value={filterAccountId} onValueChange={onFilterAccountChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Todas as contas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {activeAccounts.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Filtrar por C. Custo</Label>
          <Select value={filterCostCenterId} onValueChange={onFilterCostCenterChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Todos os centros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os centros</SelectItem>
              {activeCostCenters.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category selector */}
      <div>
        <Label>Categoria *</Label>
        <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar categoria" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map(c => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color || '#6366f1' }} />
                  {c.name}
                </div>
              </SelectItem>
            ))}
            {filteredCategories.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                Nenhuma categoria encontrada
              </div>
            )}
          </SelectContent>
        </Select>
        {selectedCategory && (
          <div className="text-xs text-muted-foreground mt-1 flex gap-3">
            <span>Conta: <strong>{(selectedCategory as any).default_account?.name || '—'}</strong></span>
            <span>C. Custo: <strong>{selectedCategory.cost_center?.name || '—'}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
