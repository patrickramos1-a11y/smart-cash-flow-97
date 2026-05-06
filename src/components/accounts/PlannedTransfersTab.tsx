import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CalendarClock,
  Plus,
  ArrowRightLeft,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  Pencil,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccounts } from '@/hooks/useFinancialConfig';
import {
  usePlannedTransfers,
  useUpdatePlannedTransfer,
  useDeletePlannedTransfer,
  useExecuteOccurrence,
  type PlannedTransferWithOccurrences,
  type PlannedFrequency,
} from '@/hooks/usePlannedTransfers';
import { PlannedTransferModal } from './PlannedTransferModal';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (s: string | null | undefined) => {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y.slice(-2)}`;
};

const freqLabel: Record<PlannedFrequency, string> = {
  AVULSA: 'Avulsa',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral',
  ANUAL: 'Anual',
  CUSTOM: 'Personalizada',
};

export function PlannedTransfersTab() {
  const { data, isLoading } = usePlannedTransfers();
  const { data: accounts } = useAccounts();
  const updateMut = useUpdatePlannedTransfer();
  const delMut = useDeletePlannedTransfer();
  const execMut = useExecuteOccurrence();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlannedTransferWithOccurrences | null>(null);
  const [confirmDel, setConfirmDel] = useState<PlannedTransferWithOccurrences | null>(null);

  const accMap = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    (accounts || []).forEach((a) =>
      m.set(a.id, { name: a.name, color: a.category?.color || 'hsl(var(--primary))' }),
    );
    return m;
  }, [accounts]);

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + '01';
  const monthEnd = (() => {
    const d = new Date();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return end.toISOString().slice(0, 10);
  })();
  const next7 = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  const kpis = useMemo(() => {
    let plannedThisMonth = 0;
    let next7Count = 0;
    let overdue = 0;
    let paused = 0;
    (data || []).forEach((p) => {
      if (p.status === 'PAUSADO') paused++;
      p.occurrences.forEach((o) => {
        if (o.status === 'EXECUTADA' || o.status === 'CANCELADA') return;
        if (o.scheduled_date >= monthStart && o.scheduled_date <= monthEnd) {
          plannedThisMonth += Number(o.expected_amount);
        }
        if (o.scheduled_date >= today && o.scheduled_date <= next7) next7Count++;
        if (o.scheduled_date < today && o.status !== 'EXECUTADA') overdue++;
      });
    });
    return { plannedThisMonth, next7Count, overdue, paused };
  }, [data, monthStart, monthEnd, today, next7]);

  const groups = useMemo(() => {
    const grouped = new Map<string, PlannedTransferWithOccurrences[]>();
    (data || []).forEach((p) => {
      const dest = accMap.get(p.to_account_id)?.name || 'Conta destino';
      const list = grouped.get(dest) || [];
      list.push(p);
      grouped.set(dest, list);
    });
    return Array.from(grouped.entries());
  }, [data, accMap]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary" />
            Transferências planejadas
          </h3>
          <p className="text-xs text-muted-foreground">
            Recorrências entre contas. Não impactam DRE.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-1.5" /> Novo planejamento
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <KPI label="Planejado no mês" value={fmt(kpis.plannedThisMonth)} icon={CalendarClock} />
        <KPI label="Próximos 7 dias" value={String(kpis.next7Count)} icon={Clock} tone="primary" />
        <KPI label="Atrasadas" value={String(kpis.overdue)} icon={AlertTriangle} tone={kpis.overdue ? 'destructive' : undefined} />
        <KPI label="Pausadas" value={String(kpis.paused)} icon={Pause} />
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <CalendarClock className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhuma transferência planejada ainda.
          </p>
          <Button size="sm" className="mt-3" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Criar primeira
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([dest, list]) => (
            <div key={dest} className="space-y-2">
              <p className="text-xs uppercase text-muted-foreground font-medium">→ {dest}</p>
              <div className="space-y-2">
                {list.map((p) => {
                  const from = accMap.get(p.from_account_id);
                  const to = accMap.get(p.to_account_id);
                  const next = p.next_occurrence;
                  const isOverdue = next && next.scheduled_date < today;
                  const total = p.occurrences.length;
                  const done = p.occurrences.filter((o) => o.status === 'EXECUTADA').length;

                  return (
                    <div
                      key={p.id}
                      className={cn(
                        'rounded-lg border p-3 flex items-center gap-3 flex-wrap',
                        p.status === 'PAUSADO'
                          ? 'border-muted bg-muted/30 opacity-70'
                          : 'border-border bg-card',
                      )}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${from?.color}20` }}
                      >
                        <ArrowRightLeft className="w-4 h-4" style={{ color: from?.color }} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">
                            {p.description || `${from?.name} → ${to?.name}`}
                          </p>
                          <Badge variant="outline" className="text-[10px] h-4">
                            {freqLabel[p.frequency]}
                          </Badge>
                          {p.status === 'PAUSADO' && (
                            <Badge variant="secondary" className="text-[10px] h-4">Pausada</Badge>
                          )}
                          {p.status === 'ENCERRADO' && (
                            <Badge variant="outline" className="text-[10px] h-4 text-muted-foreground">
                              Encerrada
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {from?.name} → {to?.name} · {done}/{total} executadas
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold">{fmt(p.amount)}</p>
                        {next ? (
                          <p
                            className={cn(
                              'text-[11px]',
                              isOverdue
                                ? 'text-destructive font-medium'
                                : 'text-muted-foreground',
                            )}
                          >
                            {isOverdue ? 'Atrasada · ' : 'Próxima: '}
                            {fmtDate(next.scheduled_date)}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3 h-3" /> Concluída
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {next && p.status === 'ATIVO' && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 gap-1.5"
                            disabled={execMut.isPending}
                            onClick={() => execMut.mutate({ occurrence_id: next.id })}
                          >
                            <Zap className="w-3.5 h-3.5" /> Executar
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditing(p); setModalOpen(true); }}>
                              <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                            </DropdownMenuItem>
                            {p.status === 'ATIVO' ? (
                              <DropdownMenuItem
                                onClick={() => updateMut.mutate({ id: p.id, status: 'PAUSADO' })}
                              >
                                <Pause className="w-3.5 h-3.5 mr-2" /> Pausar
                              </DropdownMenuItem>
                            ) : p.status === 'PAUSADO' ? (
                              <DropdownMenuItem
                                onClick={() => updateMut.mutate({ id: p.id, status: 'ATIVO' })}
                              >
                                <Play className="w-3.5 h-3.5 mr-2" /> Retomar
                              </DropdownMenuItem>
                            ) : null}
                            {p.status !== 'ENCERRADO' && (
                              <DropdownMenuItem
                                onClick={() => updateMut.mutate({ id: p.id, status: 'ENCERRADO' })}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Encerrar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setConfirmDel(p)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <PlannedTransferModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        planned={editing}
      />

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir planejamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as ocorrências futuras não executadas também serão removidas. Transferências
              já executadas serão preservadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDel) delMut.mutate(confirmDel.id);
                setConfirmDel(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KPI({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: any;
  tone?: 'primary' | 'destructive';
}) {
  const color =
    tone === 'destructive' ? 'text-destructive' : tone === 'primary' ? 'text-primary' : 'text-foreground';
  return (
    <div className="rounded-lg border border-border p-3 bg-card">
      <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground tracking-wide">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <p className={cn('text-base font-bold mt-1', color)}>{value}</p>
    </div>
  );
}
