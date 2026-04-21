import { useEffect, useMemo, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, AlertTriangle } from 'lucide-react';
import { useAccounts, useCostCenters, useTransactionCategories, type CategorySubtype } from '@/hooks/useFinancialConfig';
import { getEntityIcon } from '@/utils/entityIcons';
import { CategorySearchInput, normalizeForSearch } from './CategorySearchInput';
import { resolveAccountAndCostCenter } from '@/lib/financial/categoryResolution';

interface CategoryFilteredSelectorProps {
  tipo: 'ENTRADA' | 'SAIDA';
  subtype: CategorySubtype;
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  filterAccountId: string;
  onFilterAccountChange: (accountId: string) => void;
  filterCostCenterId: string;
  onFilterCostCenterChange: (costCenterId: string) => void;
  /** Conta override quando categoria não tem default_account_id */
  overrideAccountId?: string;
  onOverrideAccountChange?: (accountId: string) => void;
  /** Notifica o pai sobre a conta efetiva resolvida (default → override → null) */
  onResolvedAccountChange?: (accountId: string | null) => void;
  /** Notifica o pai sobre o centro de custo herdado da categoria */
  onResolvedCostCenterChange?: (costCenterId: string | null) => void;
}

// Garante contraste mínimo escurecendo cores muito claras
function ensureDarkColor(hex: string): string {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance > 0.6) {
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
  overrideAccountId = '',
  onOverrideAccountChange,
  onResolvedAccountChange,
  onResolvedCostCenterChange,
}: CategoryFilteredSelectorProps) {
  const { data: accounts } = useAccounts();
  const { data: costCenters } = useCostCenters();
  const { data: categories } = useTransactionCategories();
  const [search, setSearch] = useState('');

  const baseCategories = categories?.filter(c => c.type === tipo && c.subtype === subtype && c.active) || [];

  const categoryAccountIds = new Set(baseCategories.map(c => c.default_account_id).filter(Boolean));
  const categoryCostCenterIds = new Set(baseCategories.map(c => c.cost_center_id).filter(Boolean));

  const allAccounts = accounts || [];
  const accountMap = new Map(allAccounts.map(a => [a.id, a]));

  const availableAccounts = Array.from(categoryAccountIds)
    .map(id => accountMap.get(id as string))
    .filter(Boolean)
    .sort((a, b) => (a!.name).localeCompare(b!.name));

  const availableCostCenters = costCenters?.filter(c => categoryCostCenterIds.has(c.id)) || [];

  let filteredCategories = [...baseCategories];
  if (filterAccountId) {
    filteredCategories = filteredCategories.filter(c => c.default_account_id === filterAccountId);
  }
  if (filterCostCenterId) {
    filteredCategories = filteredCategories.filter(c => c.cost_center_id === filterCostCenterId);
  }
  if (search.trim()) {
    const q = normalizeForSearch(search);
    filteredCategories = filteredCategories.filter(c => normalizeForSearch(c.name).includes(q));
  }

  const groupedCategories = useMemo(() => {
    const groups: { accountName: string; accountId: string | null; categories: typeof filteredCategories }[] = [];
    const byAccount = new Map<string, typeof filteredCategories>();

    for (const cat of filteredCategories) {
      const accId = cat.default_account_id || '__none__';
      if (!byAccount.has(accId)) byAccount.set(accId, []);
      byAccount.get(accId)!.push(cat);
    }

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

  // Resolução central (Conta default da categoria → override do usuário)
  const resolution = useMemo(
    () => resolveAccountAndCostCenter(selectedCategory as any, overrideAccountId),
    [selectedCategory, overrideAccountId],
  );

  // Notifica o pai sempre que a resolução muda
  useEffect(() => {
    onResolvedAccountChange?.(resolution.accountId);
    onResolvedCostCenterChange?.(resolution.costCenterId);
  }, [resolution.accountId, resolution.costCenterId, onResolvedAccountChange, onResolvedCostCenterChange]);

  // Auto-sincroniza os dropdowns de filtro (Conta + C. Custo) com a categoria escolhida,
  // exibindo visualmente o vínculo herdado direto nos próprios selects.
  const lastSyncedCategoryRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedCategoryId) {
      lastSyncedCategoryRef.current = null;
      return;
    }
    if (lastSyncedCategoryRef.current === selectedCategoryId) return;
    lastSyncedCategoryRef.current = selectedCategoryId;
    const targetAccount = selectedCategory?.default_account_id ?? '';
    const targetCC = selectedCategory?.cost_center_id ?? '';
    if (targetAccount !== filterAccountId) onFilterAccountChange(targetAccount || 'all');
    if (targetCC !== filterCostCenterId) onFilterCostCenterChange(targetCC || 'all');
  }, [selectedCategoryId, selectedCategory, filterAccountId, filterCostCenterId, onFilterAccountChange, onFilterCostCenterChange]);

  const hasActiveFilters = !!filterAccountId || !!filterCostCenterId || !!search;

  const handleClearFilters = () => {
    if (filterAccountId) onFilterAccountChange('all');
    if (filterCostCenterId) onFilterCostCenterChange('all');
    setSearch('');
  };

  return (
    <div className="space-y-3">
      {/* Pre-filters with clear button */}
      <div className="flex items-end gap-2">
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Filtrar por Conta</Label>
            <Select value={filterAccountId || 'all'} onValueChange={onFilterAccountChange}>
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
            <Select value={filterCostCenterId || 'all'} onValueChange={onFilterCostCenterChange}>
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
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Limpar filtros (mantém a categoria selecionada)"
          >
            <X className="w-3 h-3 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Category selector grouped by account */}
      <div>
        <Label>Categoria *</Label>
        <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
          <SelectTrigger className={!selectedCategoryId ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selecionar categoria" />
          </SelectTrigger>
          <SelectContent className="max-h-[360px]">
            <CategorySearchInput value={search} onChange={setSearch} />
            {groupedCategories.map((group) => (
              <div key={group.accountName}>
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
      </div>

      {/* Heranças agora refletem nos próprios dropdowns acima — sem painel extra. */}

      {/* Override de Conta — quando a categoria não tem default_account_id */}
      {resolution.needsAccountOverride && onOverrideAccountChange && (
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 space-y-2">
          <Label className="text-warning flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Conta * (categoria sem conta padrão)
          </Label>
          <Select
            value={overrideAccountId}
            onValueChange={onOverrideAccountChange}
          >
            <SelectTrigger className={!overrideAccountId ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecionar conta para esta transação" />
            </SelectTrigger>
            <SelectContent>
              {accounts?.filter(a => a.active).map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            Esta conta será usada apenas neste lançamento. Para mudar o padrão da categoria,
            edite-a em Configurações.
          </p>
        </div>
      )}
    </div>
  );
}
