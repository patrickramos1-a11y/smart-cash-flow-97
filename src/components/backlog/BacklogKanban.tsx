import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreditCard } from 'lucide-react';
import {
  BacklogItem,
  BacklogProject,
  BacklogStatus,
  BacklogPriority,
  statusLabels,
  priorityLabels,
  useBacklogByStatus
} from '@/hooks/useBacklog';

interface BacklogKanbanProps {
  onItemClick: (item: BacklogItem) => void;
}

const priorityColors: Record<BacklogPriority, string> = {
  ALTA: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  MEDIA: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  BAIXA: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
};

const statusColors: Record<BacklogStatus, string> = {
  IDEIA: 'border-t-purple-500',
  EM_ANALISE: 'border-t-blue-500',
  REFINADO: 'border-t-cyan-500',
  AGUARDANDO_RECURSOS: 'border-t-amber-500',
  EM_IMPLEMENTACAO: 'border-t-orange-500',
  EM_TESTES: 'border-t-pink-500',
  IMPLEMENTADO: 'border-t-emerald-500',
  LANCADO: 'border-t-green-500',
  VALIDADO: 'border-t-teal-500',
  ARQUIVADO: 'border-t-gray-500'
};

const displayColumns: BacklogStatus[] = [
  'IDEIA',
  'EM_ANALISE',
  'REFINADO',
  'AGUARDANDO_RECURSOS',
  'EM_IMPLEMENTACAO',
  'EM_TESTES',
  'IMPLEMENTADO',
  'LANCADO'
];

export function BacklogKanban({ onItemClick }: BacklogKanbanProps) {
  const { data: itemsByStatus, isLoading } = useBacklogByStatus();

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {displayColumns.map(status => (
          <div key={status} className="flex-shrink-0 w-72">
            <Card className="animate-pulse">
              <CardHeader className="p-4">
                <div className="h-6 bg-muted rounded" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="h-20 bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  if (!itemsByStatus) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {displayColumns.map(status => (
        <div key={status} className="flex-shrink-0 w-72">
          <Card className={`border-t-4 ${statusColors[status]}`}>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{statusLabels[status]}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {itemsByStatus[status]?.length || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-2 p-2">
                  {itemsByStatus[status]?.map((item: BacklogItem & { project: BacklogProject }) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onItemClick(item)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-medium line-clamp-2">{item.title}</h4>
                          {item.depends_on_credits && (
                            <CreditCard className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground truncate">
                            {item.project?.name}
                          </span>
                          <Badge className={`text-xs ${priorityColors[item.priority]}`} variant="secondary">
                            {priorityLabels[item.priority]}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!itemsByStatus[status] || itemsByStatus[status].length === 0) && (
                    <div className="text-center text-xs text-muted-foreground py-8">
                      Nenhum item
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
