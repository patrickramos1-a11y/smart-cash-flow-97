import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowDownCircle, ArrowUpCircle, XCircle, Trash2,
  CalendarDays, CalendarRange, CalendarClock, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/data/mockData';
import { NewFixedExpenseModal } from './NewFixedExpenseModal';
import { NewRecurringContractModal } from '@/components/contracts/NewRecurringContractModal';
import { TransactionEditModal } from './TransactionEditModal';
import { MonthYearNavigator } from '@/components/ui/month-year-navigator';
import { InlineLancamentoForm } from './InlineLancamentoForm';
import { TransactionsList } from './TransactionsList';
import type { TransactionFilters } from '@/hooks/useTransactions';

type ApprovalFilter = 'all' | 'pendente' | 'aprovado' | 'rejeitado';
type PeriodFilter = 'today' | 'week' | 'fortnight' | 'month';

const APPROVAL_LABELS: Record<ApprovalFilter, string> = {
  all: 'Tudo',
  pendente: 'Pendentes',
  aprovado: 'Aprovadas',
  rejeitado: 'Não aprovadas',
};

const PERIOD_OPTIONS: { key: PeriodFilter; label: string; icon: any; days: number }[] = [
  { key: 'today',     label: 'Hoje',     icon: CalendarClock, days: 1 },
  { key: 'week',      label: 'Semana',   icon: CalendarDays,  days: 7 },
  { key: 'fortnight', label: '15 dias',  icon: CalendarRange, days: 15 },
  { key: 'month',     label: 'Mês',      icon: Calendar,      days: 30 },
];

function isoNDaysAgo(days: number) {
  const d = new Date();
  if (days <= 1) {
    d.setHours(0, 0, 0, 0);
  } else {
    d.setDate(d.getDate() - (days - 1));
    d.setHours(0, 0, 0, 0);
  }
  return d.toISOString();
}

export function LancamentoPage() {
  const { isFinanceiro, user } = useAuth();
  const queryClient = useQueryClient();
  const now = new Date();
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [dedicatedModal, setDedicatedModal] = useState<null | 'recurring' | 'fixa'>(null);
  const [approval, setApproval] = useState<ApprovalFilter>('all');
  const [period, setPeriod] = useState<PeriodFilter>('week');

  // Rejected entries for the current user — she can dismiss them after relaunching.
  const { data: rejectedMine } = useQuery({
    queryKey: ['my-rejected', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = supabase
        .from('rejected_transactions')
        .select(`
          id, descricao, valor, tipo_movimento, data_vencimento,
          competencia_mes, competencia_ano, rejection_reason, rejected_at,
          recurring_clients:cliente_id(name),
          transaction_categories:transaction_category_id(name)
        `)
        .order('rejected_at', { ascending: false })
        .limit(50);
      if (isFinanceiro) q = q.eq('created_by', user!.id);
      const { data } = await q;
      return data || [];
    },
    staleTime: 15_000,
  });

  const dismissRejected = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rejected_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rejected'] });
      queryClient.invalidateQueries({ queryKey: ['rejected-transactions'] });
      toast.success('Lançamento rejeitado descartado.');
    },
    onError: (e: any) => toast.error('Erro ao descartar: ' + (e?.message || '')),
  });

  // Filtros aplicados à tabela rica.
  const tableFilters: TransactionFilters = useMemo(() => {
    const days = PERIOD_OPTIONS.find(p => p.key === period)?.days ?? 7;
    const f: TransactionFilters = {
      created_after: isoNDaysAgo(days),
    };
    if (approval !== 'all') f.approval_status = approval;
    if (isFinanceiro && user?.id) f.created_by = user.id;
    return f;
  }, [approval, period, isFinanceiro, user?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Lançamentos</h1>
          <p className="text-xs text-muted-foreground">Caixa de lançamento financeiro — rápido e direto.</p>
        </div>
        <MonthYearNavigator
          month={periodMonth}
          year={periodYear}
          onMonthChange={setPeriodMonth}
          onYearChange={setPeriodYear}
        />
      </div>

      {/* Inline form */}
      <InlineLancamentoForm
        defaultMonth={periodMonth}
        defaultYear={periodYear}
        onNeedsDedicatedFlow={(k) => setDedicatedModal(k)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['recent-launches'] });
        }}
      />
      {isFinanceiro && (
        <p className="text-xs text-muted-foreground -mt-3 px-1">
          Lançamentos criados por você ficam <strong>pendentes de aprovação</strong> até serem revisados pelo administrador.
        </p>
      )}

      {/* Rejected entries */}
      {(rejectedMine?.length || 0) > 0 && (
        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="p-4 lg:p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Lançamentos rejeitados
                </h3>
                <p className="text-xs text-red-700/80 mt-0.5">
                  Após relançar o item corretamente, descarte aqui para limpar o histórico.
                </p>
              </div>
              <Badge variant="outline" className="border-red-300 text-red-700">
                {rejectedMine!.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {rejectedMine!.map((r: any) => {
                const isIn = r.tipo_movimento === 'ENTRADA';
                return (
                  <div
                    key={r.id}
                    className="flex items-start gap-3 bg-card border border-red-200 rounded-lg p-3"
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      isIn ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'
                    )}>
                      {isIn ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.descricao || r.transaction_categories?.name || 'Lançamento'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.transaction_categories?.name || 'Sem categoria'}
                        {r.recurring_clients?.name && ` • ${r.recurring_clients.name}`}
                        {' • '}
                        {String(r.competencia_mes).padStart(2, '0')}/{r.competencia_ano}
                      </p>
                      {r.rejection_reason && (
                        <p className="text-[11px] text-red-700 mt-1 line-clamp-2">
                          <strong>Motivo:</strong> {r.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className={cn('text-sm font-bold', isIn ? 'text-income' : 'text-expense')}>
                        {isIn ? '+' : '-'} {formatCurrency(Number(r.valor) || 0)}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => dismissRejected.mutate(r.id)}
                        disabled={dismissRejected.isPending}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Descartar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent table — same engine as Planilha Anual */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold">Últimos lançamentos realizados</h3>
            <p className="text-xs text-muted-foreground">
              {isFinanceiro ? 'Seus lançamentos mais recentes' : 'Atividade recente do sistema'}
              {' • '}por data de criação
            </p>
          </div>
        </div>

        {/* Period filters */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PERIOD_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const active = period === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setPeriod(opt.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border inline-flex items-center gap-1.5',
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card hover:bg-muted text-muted-foreground border-border'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Approval filters */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(Object.keys(APPROVAL_LABELS) as ApprovalFilter[]).map(k => (
            <button
              key={k}
              onClick={() => setApproval(k)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                approval === k
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted text-muted-foreground border-border'
              )}
            >
              {APPROVAL_LABELS[k]}
            </button>
          ))}
        </div>

        <TransactionsList filters={tableFilters} bulkContext="GERAL" />
      </div>

      {dedicatedModal === 'recurring' && (
        <NewRecurringContractModal
          open
          onClose={() => setDedicatedModal(null)}
          defaultYear={periodYear}
        />
      )}
      {dedicatedModal === 'fixa' && (
        <NewFixedExpenseModal
          open
          onClose={() => setDedicatedModal(null)}
          defaultMonth={periodMonth}
          defaultYear={periodYear}
        />
      )}
    </div>
  );
}
