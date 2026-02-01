import { useBacklogStats, statusLabels, BacklogStatus } from '@/hooks/useBacklog';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Lightbulb, 
  Search, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  TestTube, 
  Package, 
  Rocket, 
  ShieldCheck, 
  Archive 
} from 'lucide-react';

const statusIcons: Record<BacklogStatus, React.ReactNode> = {
  IDEIA: <Lightbulb className="w-4 h-4" />,
  EM_ANALISE: <Search className="w-4 h-4" />,
  REFINADO: <CheckCircle2 className="w-4 h-4" />,
  AGUARDANDO_RECURSOS: <Clock className="w-4 h-4" />,
  EM_IMPLEMENTACAO: <Wrench className="w-4 h-4" />,
  EM_TESTES: <TestTube className="w-4 h-4" />,
  IMPLEMENTADO: <Package className="w-4 h-4" />,
  LANCADO: <Rocket className="w-4 h-4" />,
  VALIDADO: <ShieldCheck className="w-4 h-4" />,
  ARQUIVADO: <Archive className="w-4 h-4" />
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

export function BacklogIndicators() {
  const { data: stats, isLoading } = useBacklogStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3">
              <div className="h-8 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const displayStatuses: BacklogStatus[] = [
    'IDEIA', 'EM_ANALISE', 'REFINADO', 'AGUARDANDO_RECURSOS',
    'EM_IMPLEMENTACAO', 'EM_TESTES', 'IMPLEMENTADO', 'LANCADO', 'VALIDADO', 'ARQUIVADO'
  ];

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground text-lg">{stats.total}</span>
        <span>itens no backlog</span>
      </div>

      {/* Status Pills */}
      <div className="flex flex-wrap gap-2">
        {displayStatuses.map(status => (
          <div
            key={status}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}
          >
            {statusIcons[status]}
            <span>{stats.byStatus[status]}</span>
            <span className="hidden sm:inline">{statusLabels[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
