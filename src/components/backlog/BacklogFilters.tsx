import { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  useBacklogProjects,
  BacklogFilters as FiltersType,
  BacklogCategory,
  BacklogStatus,
  BacklogPriority,
  categoryLabels,
  statusLabels,
  priorityLabels
} from '@/hooks/useBacklog';

interface BacklogFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

export function BacklogFilters({ filters, onFiltersChange }: BacklogFiltersProps) {
  const { data: projects } = useBacklogProjects();
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchValue });
  };

  const clearFilter = (key: keyof FiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    if (key === 'search') setSearchValue('');
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const categories: BacklogCategory[] = [
    'NOVA_FUNCIONALIDADE', 'MELHORIA_EXISTENTE', 'CORRECAO_BUG', 'AJUSTE_TECNICO',
    'UX_UI_VISUAL', 'RELATORIOS_INDICADORES', 'SEGURANCA_PERMISSOES', 'INFRAESTRUTURA_CREDITOS'
  ];

  const statuses: BacklogStatus[] = [
    'IDEIA', 'EM_ANALISE', 'REFINADO', 'AGUARDANDO_RECURSOS',
    'EM_IMPLEMENTACAO', 'EM_TESTES', 'IMPLEMENTADO', 'LANCADO', 'VALIDADO', 'ARQUIVADO'
  ];

  const priorities: BacklogPriority[] = ['ALTA', 'MEDIA', 'BAIXA'];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>

        {/* Project Filter */}
        <Select
          value={filters.projectId || 'all'}
          onValueChange={(v) => onFiltersChange({ ...filters, projectId: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Projetos</SelectItem>
            {projects?.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={filters.category || 'all'}
          onValueChange={(v) => onFiltersChange({ ...filters, category: v === 'all' ? undefined : v as BacklogCategory })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(v) => onFiltersChange({ ...filters, status: v === 'all' ? undefined : v as BacklogStatus })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {statuses.map(s => (
              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={filters.priority || 'all'}
          onValueChange={(v) => onFiltersChange({ ...filters, priority: v === 'all' ? undefined : v as BacklogPriority })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {priorities.map(p => (
              <SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Resources Filter */}
        <Select
          value={filters.dependsOnCredits === undefined ? 'all' : filters.dependsOnCredits ? 'yes' : 'no'}
          onValueChange={(v) => onFiltersChange({ 
            ...filters, 
            dependsOnCredits: v === 'all' ? undefined : v === 'yes' 
          })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Recursos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="yes">Depende de Créditos</SelectItem>
            <SelectItem value="no">Não Depende</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {filters.search}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('search')} />
            </Badge>
          )}
          
          {filters.projectId && (
            <Badge variant="secondary" className="gap-1">
              Projeto: {projects?.find(p => p.id === filters.projectId)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('projectId')} />
            </Badge>
          )}
          
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              {categoryLabels[filters.category]}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('category')} />
            </Badge>
          )}
          
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              {statusLabels[filters.status]}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('status')} />
            </Badge>
          )}
          
          {filters.priority && (
            <Badge variant="secondary" className="gap-1">
              Prioridade: {priorityLabels[filters.priority]}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('priority')} />
            </Badge>
          )}
          
          {filters.dependsOnCredits !== undefined && (
            <Badge variant="secondary" className="gap-1">
              {filters.dependsOnCredits ? 'Depende de Créditos' : 'Não Depende de Créditos'}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('dependsOnCredits')} />
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 text-xs">
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  );
}
