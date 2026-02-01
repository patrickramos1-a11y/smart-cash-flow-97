import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  AlertCircle, 
  Clock, 
  CreditCard, 
  MoreHorizontal,
  Eye,
  Edit,
  Archive
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BacklogItem,
  BacklogProject,
  BacklogStatus,
  BacklogPriority,
  BacklogCategory,
  categoryLabels,
  statusLabels,
  priorityLabels,
  useArchiveBacklogItem
} from '@/hooks/useBacklog';

interface BacklogListProps {
  items: (BacklogItem & { project: BacklogProject })[];
  isLoading: boolean;
  onItemClick: (item: BacklogItem) => void;
  onEditClick: (item: BacklogItem) => void;
}

const priorityColors: Record<BacklogPriority, string> = {
  ALTA: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  MEDIA: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  BAIXA: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
};

const statusColors: Record<BacklogStatus, string> = {
  IDEIA: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  EM_ANALISE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  REFINADO: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  AGUARDANDO_RECURSOS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  EM_IMPLEMENTACAO: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  EM_TESTES: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  IMPLEMENTADO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  LANCADO: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  VALIDADO: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  ARQUIVADO: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
};

const categoryColors: Record<BacklogCategory, string> = {
  NOVA_FUNCIONALIDADE: 'border-l-emerald-500',
  MELHORIA_EXISTENTE: 'border-l-blue-500',
  CORRECAO_BUG: 'border-l-red-500',
  AJUSTE_TECNICO: 'border-l-orange-500',
  UX_UI_VISUAL: 'border-l-pink-500',
  RELATORIOS_INDICADORES: 'border-l-purple-500',
  SEGURANCA_PERMISSOES: 'border-l-yellow-500',
  INFRAESTRUTURA_CREDITOS: 'border-l-gray-500'
};

export function BacklogList({ items, isLoading, onItemClick, onEditClick }: BacklogListProps) {
  const archiveItem = useArchiveBacklogItem();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum item encontrado</p>
          <p className="text-sm">Tente ajustar os filtros ou criar um novo item</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Card 
          key={item.id} 
          className={`border-l-4 ${categoryColors[item.category]} hover:shadow-md transition-shadow cursor-pointer`}
          onClick={() => onItemClick(item)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Title & Project */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-foreground truncate">{item.title}</h3>
                  {item.depends_on_credits && (
                    <CreditCard className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  )}
                </div>
                
                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{item.project?.name}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{categoryLabels[item.category]}</span>
                </div>
              </div>

              {/* Badges & Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={priorityColors[item.priority]} variant="secondary">
                  {priorityLabels[item.priority]}
                </Badge>
                
                <Badge className={statusColors[item.status]} variant="secondary">
                  {statusLabels[item.status]}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onItemClick(item); }}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditClick(item); }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    {item.status !== 'ARQUIVADO' && (
                      <DropdownMenuItem 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          archiveItem.mutate(item.id); 
                        }}
                        className="text-muted-foreground"
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Arquivar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Dates */}
            {(item.start_date || item.completion_date) && (
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                {item.start_date && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Início: {format(new Date(item.start_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                )}
                {item.completion_date && (
                  <div className="flex items-center gap-1">
                    <span>Conclusão: {format(new Date(item.completion_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
