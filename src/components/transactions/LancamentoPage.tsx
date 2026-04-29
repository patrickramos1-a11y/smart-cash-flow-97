import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Loader2, ArrowDownCircle, ArrowUpCircle,
  Clock, CheckCircle2, XCircle, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/data/mockData';
import { NewTransactionWizard } from './NewTransactionWizard';
import { TransactionEditModal } from './TransactionEditModal';
import type { TransactionWithClient } from '@/hooks/useTransactions';

type QuickFilter =
  | 'all'
  | 'today'
  | 'week'
  | 'month'
  | 'pending'
  | 'approved'
  | 'rejected';

const FILTER_LABELS: Record<QuickFilter, string> = {
  all: 'Tudo',
  today: 'Hoje',
  week: 'Esta semana',
  month: 'Este mês',
  pending: 'Pendentes',
  approved: 'Aprovadas',
  rejected: 'Não aprovadas',
};

function startOfToday() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}
function startOfWeek() {
  const d = startOfToday();
  d.setDate(d.getDate() - d.getDay());
  return d;
}
function startOfMonth() {
  const d = startOfToday(); d.setDate(1); return d;
}

function fmtDate(s: string | null) {
  if (!s) return '—';
  const [y, m, d] = s.slice(0, 10).split('-');
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}
function fmtDateTime(s: string) {
  const d = new Date(s);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function LancamentoPage() {
  const { isFinanceiro, user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [filter, setFilter] = useState<QuickFilter>('all');
  const [editTx, setEditTx] = useState<TransactionWithClient | null>(null);
  const [limit, setLimit] = useState(50);

  const { data: items, isLoading } = useQuery({
    queryKey: ['recent-launches', isFinanceiro ? user?.id : 'all', limit],
    queryFn: async () => {
      let q = supabase
        .from('transactions')
        .select(`
          *,
          recurring_clients ( id, name, email, phone ),
          transaction_categories!transactions_transaction_category_id_fkey ( id, name, color ),
          accounts!transactions_account_id_fkey ( id, name ),
          cost_centers!transactions_cost_center_id_fkey ( id, name )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Financeiro: prioriza ver os próprios lançamentos.
      if (isFinanceiro && user?.id) {
        q = q.eq('created_by', user.id);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 15_000,
  });

  // Profiles map for "Criado por"
  const creatorIds = useMemo(
    () => Array.from(new Set((items || []).map((i: any) => i.created_by).filter(Boolean))),
    [items]
  );
  const { data: creators } = useQuery({
    queryKey: ['profiles-by-ids', creatorIds],
    enabled: creatorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', creatorIds);
      return data || [];
    },
  });
  const creatorById = useMemo(() => {
    const m = new Map<string, string>();
    (creators || []).forEach((c: any) => m.set(c.user_id, c.display_name));
    return m;
  }, [creators]);

  const filtered = useMemo(() => {
    const list = items || [];
    const today = startOfToday();
    const week = startOfWeek();
    const month = startOfMonth();
    return list.filter((t: any) => {
      const created = new Date(t.created_at);
      if (filter === 'today' && created < today) return false;
      if (filter === 'week' && created < week) return false;
      if (filter === 'month' && created < month) return false;
      if (filter === 'pending' && t.approval_status !== 'pendente') return false;
      if (filter === 'approved' && t.approval_status !== 'aprovado') return false;
      if (filter === 'rejected' && t.approval_status !== 'rejeitado') return false;
      return true;
    });
  }, [items, filter]);

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6 lg:p-8 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
            <Plus className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold">Novo Lançamento</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Registre uma entrada ou despesa. O sistema identifica o tipo pela categoria.
            </p>
          </div>
          <Button size="lg" className="gap-2 mt-2" onClick={() => setShowWizard(true)}>
            <Plus className="w-4 h-4" /> Criar lançamento
          </Button>
          {isFinanceiro && (
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Lançamentos criados por você ficam <strong>pendentes de aprovação</strong> até serem revisados pelo administrador.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold">Últimos lançamentos realizados</h3>
            <p className="text-xs text-muted-foreground">
              {isFinanceiro ? 'Seus lançamentos mais recentes' : 'Atividade recente do sistema'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(Object.keys(FILTER_LABELS) as QuickFilter[]).map(k => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                filter === k
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted text-muted-foreground border-border'
              )}
            >
              {FILTER_LABELS[k]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nenhum lançamento encontrado neste filtro.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((t: any) => {
              const isIn = t.tipo_movimento === 'ENTRADA';
              const cat = t.transaction_categories;
              const acc = t.accounts;
              const cc = t.cost_centers;
              const cli = t.recurring_clients;
              const valor = Number(t.valor_pago ?? t.valor) || 0;
              const approval = t.approval_status as 'pendente' | 'aprovado' | 'rejeitado';
              const status = t.status as 'PAGO' | 'EM_ABERTO' | 'ATRASADO';
              const creator = t.created_by ? creatorById.get(t.created_by) : null;

              return (
                <button
                  key={t.id}
                  onClick={() => setEditTx(t)}
                  className="w-full text-left bg-card hover:bg-muted/40 transition-colors border border-border rounded-xl p-3 lg:p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                        isIn ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'
                      )}
                    >
                      {isIn ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{t.descricao || cat?.name || 'Lançamento'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {cat?.name || 'Sem categoria'}
                            {acc?.name && ` • ${acc.name}`}
                            {cc?.name && ` • ${cc.name}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn('font-bold text-sm lg:text-base', isIn ? 'text-income' : 'text-expense')}>
                            {isIn ? '+' : '-'} {formatCurrency(valor)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Venc {fmtDate(t.data_vencimento)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {/* Approval */}
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] gap-1',
                            approval === 'pendente' && 'border-amber-400 text-amber-600',
                            approval === 'aprovado' && 'border-emerald-500 text-emerald-600',
                            approval === 'rejeitado' && 'border-red-500 text-red-600'
                          )}
                        >
                          {approval === 'pendente' && <Clock className="w-3 h-3" />}
                          {approval === 'aprovado' && <CheckCircle2 className="w-3 h-3" />}
                          {approval === 'rejeitado' && <XCircle className="w-3 h-3" />}
                          {approval === 'pendente' ? 'Pendente' : approval === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                        </Badge>
                        {/* Financial status */}
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            status === 'PAGO' && 'border-emerald-500 text-emerald-600',
                            status === 'EM_ABERTO' && 'border-blue-400 text-blue-600',
                            status === 'ATRASADO' && 'border-red-500 text-red-600'
                          )}
                        >
                          {status === 'PAGO' ? 'Pago' : status === 'EM_ABERTO' ? 'Em aberto' : 'Atrasado'}
                        </Badge>
                        {cli?.name && (
                          <Badge variant="outline" className="text-[10px]">
                            {cli.name}
                          </Badge>
                        )}
                        {t.documento_tipo && t.documento_tipo !== 'SEM_DOCUMENTO' && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <FileText className="w-3 h-3" />
                            {t.documento_tipo}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                        <span>Criado {fmtDateTime(t.created_at)}</span>
                        {creator && <span>por {creator}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {(items?.length || 0) >= limit && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" size="sm" onClick={() => setLimit(l => l + 50)}>
                  Carregar mais
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <NewTransactionWizard open={showWizard} onClose={() => setShowWizard(false)} />
      <TransactionEditModal
        open={!!editTx}
        onClose={() => setEditTx(null)}
        transaction={editTx}
      />
    </div>
  );
}
