import { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccounts, useCostCenters, useTransactionCategories, type CategorySubtype } from '@/hooks/useFinancialConfig';
import { getEntityIcon } from '@/utils/entityIcons';
import { CategorySearchInput, normalizeForSearch } from './CategorySearchInput';

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

// Ensure color is dark enough for good contrast (min luminance)
function ensureDarkColor(hex: string): string {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance > 0.6) {
    // Darken the color by 40%
    const factor = 0.5;
    const dr = Math.round(r * factor);
    const dg = Math.round(g * factor);
    const db = Math.round(b * factor);
    return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
  }
  return hex;
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

  // Base categories for this tipo+subtype
  const baseCategories = categories?.filter(c => c.type === tipo && c.subtype === subtype && c.active) || [];

  // Extract unique account IDs and cost center IDs from these categories
  const categoryAccountIds = new Set(baseCategories.map(c => c.default_account_id).filter(Boolean));
  const categoryCostCenterIds = new Set(baseCategories.map(c => c.cost_center_id).filter(Boolean));

  // Show accounts linked to categories (even inactive accounts, since legacy data references them)
  // Also fetch all accounts to build a name map
  const allAccounts = accounts || [];
  const accountMap = new Map(allAccounts.map(a => [a.id, a]));
  
  // Build list of accounts that have categories in this modality
  const availableAccounts = Array.from(categoryAccountIds)
    .map(id => accountMap.get(id as string))
    .filter(Boolean)
    .sort((a, b) => (a!.name).localeCompare(b!.name));

  const availableCostCenters = costCenters?.filter(c => categoryCostCenterIds.has(c.id)) || [];

  // Apply filters to categories
  let filteredCategories = [...baseCategories];
  if (filterAccountId) {
    filteredCategories = filteredCategories.filter(c => c.default_account_id === filterAccountId);
  }
  if (filterCostCenterId) {
    filteredCategories = filteredCategories.filter(c => c.cost_center_id === filterCostCenterId);
  }

  // Group categories by account name, then sort alphabetically within each group
  const groupedCategories = useMemo(() => {
    const groups: { accountName: string; accountId: string | null; categories: typeof filteredCategories }[] = [];
    const byAccount = new Map<string, typeof filteredCategories>();
    
    for (const cat of filteredCategories) {
      const accId = cat.default_account_id || '__none__';
      if (!byAccount.has(accId)) byAccount.set(accId, []);
      byAccount.get(accId)!.push(cat);
    }

    // Sort groups by account name
    const sortedKeys = Array.from(byAccount.keys()).sort((a, b) => {
      const nameA = a === '__none__' ? 'zzz' : (accountMap.get(a)?.name || 'zzz');
      const nameB = b === '__none__' ? 'zzz' : (accountMap.get(b)?.name || 'zzz');
      return nameA.localeCompare(nameB);
    });

    for (const key of sortedKeys) {
      const cats = byAccount.get(key)!.sort((a, b) => a.name.localeCompare(b.name));
      groups.push({
        accountName: key === '__none__' ? 'Sem conta vinculada' : (accountMap.get(key)?.name || 'Conta desconhecida'),
        accountId: key === '__none__' ? null : key,
        categories: cats,
      });
    }

    return groups;
  }, [filteredCategories, accountMap]);

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
              {availableAccounts.map(a => (
                <SelectItem key={a!.id} value={a!.id}>
                  {a!.name}
                </SelectItem>
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
              {availableCostCenters.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category selector grouped by account */}
      <div>
        <Label>Categoria *</Label>
        <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar categoria" />
          </SelectTrigger>
          <SelectContent>
            {groupedCategories.map((group) => (
              <div key={group.accountName}>
                {/* Account group header */}
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 sticky top-0">
                  {group.accountName}
                </div>
                {group.categories.map(c => {
                  const Icon = getEntityIcon(c.name);
                  const color = ensureDarkColor(c.color || '#6366f1');
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                        <span style={{ color }}>{c.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {group.accountName}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </div>
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
