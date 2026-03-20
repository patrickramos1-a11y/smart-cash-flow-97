import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle, XCircle, Clock, Search, AlertTriangle,
  ArrowDownCircle, ArrowUpCircle, Loader2, Eye, Filter
} from 'lucide-react';
import { formatCurrency } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface PendingTransaction {
  id: string;
  tipo_movimento: string;
  natureza: string;
  descricao: string | null;
  valor: number;
  data_vencimento: string;
  competencia_mes: number;
  competencia_ano: number;
  approval_status: string;
  rejection_reason: string | null;
  created_at: string;
  created_by: string | null;
  status: string;
  category_name?: string;
  account_name?: string;
  cost_center_name?: string;
  entity_name?: string;
  responsible_name?: string;
  client_name?: string;
  creator_name?: string;
}

export function ApprovalView() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pendente');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  // Fetch transactions with approval info
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['approval-transactions', filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          id, tipo_movimento, natureza, descricao, valor, data_vencimento,
          competencia_mes, competencia_ano, approval_status, rejection_reason,
          created_at, created_by, status,
          recurring_clients(name),
          transaction_categories:transaction_category_id(name),
          accounts:account_id(name),
          cost_centers:cost_center_id(name),
          entity:financial_entities!transactions_entity_id_fkey(name),
          responsible:financial_entities!transactions_responsavel_id_fkey(name),
          creator:profiles!transactions_created_by_fkey(display_name)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'todos') {
        query = query.eq('approval_status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((t: any) => ({
        ...t,
        category_name: t.transaction_categories?.name,
        account_name: t.accounts?.name,
        cost_center_name: t.cost_centers?.name,
        entity_name: t.entity?.name,
        responsible_name: t.responsible?.name,
        client_name: t.recurring_clients?.name,
        creator_name: t.creator?.display_name,
      })) as PendingTransaction[];
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          approval_status: 'aprovado',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', transactionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Lançamento aprovado!');
    },
    onError: () => toast.error('Erro ao aprovar'),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          approval_status: 'rejeitado',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Lançamento rejeitado');
      setRejectingId(null);
      setRejectReason('');
    },
    onError: () => toast.error('Erro ao rejeitar'),
  });

  const filtered = useMemo(() => {
    if (!transactions) return [];
    if (!search) return transactions;
    const s = search.toLowerCase();
    return transactions.filter(t =>
      t.descricao?.toLowerCase().includes(s) ||
      t.client_name?.toLowerCase().includes(s) ||
      t.category_name?.toLowerCase().includes(s) ||
      t.creator_name?.toLowerCase().includes(s)
    );
  }, [transactions, search]);

  const pendingCount = transactions?.filter(t => t.approval_status === 'pendente').length || 0;
  const detailTx = detailId ? filtered.find(t => t.id === detailId) : null;

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {pendingCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              Você tem <strong>{pendingCount}</strong> lançamento{pendingCount > 1 ? 's' : ''} pendente{pendingCount > 1 ? 's' : ''} de aprovação
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, cliente, categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="aprovado">Aprovados</SelectItem>
            <SelectItem value="rejeitado">Rejeitados</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Card><CardContent className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium">Tipo</th>
                    <th className="text-left p-3 text-xs font-medium">Descrição</th>
                    <th className="text-left p-3 text-xs font-medium">Cliente</th>
                    <th className="text-left p-3 text-xs font-medium">Categoria</th>
                    <th className="text-left p-3 text-xs font-medium">Criado por</th>
                    <th className="text-left p-3 text-xs font-medium">Vencimento</th>
                    <th className="text-right p-3 text-xs font-medium">Valor</th>
                    <th className="text-center p-3 text-xs font-medium">Status</th>
                    {isAdmin && <th className="text-center p-3 text-xs font-medium">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum lançamento encontrado
                      </td>
                    </tr>
                  ) : filtered.map(t => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        {t.tipo_movimento === 'ENTRADA' 
                          ? <ArrowDownCircle className="w-5 h-5 text-income" />
                          : <ArrowUpCircle className="w-5 h-5 text-expense" />
                        }
                      </td>
                      <td className="p-3">
                        <p className="text-sm font-medium">{t.descricao || '-'}</p>
                        <p className="text-xs text-muted-foreground">{t.competencia_mes.toString().padStart(2,'0')}/{t.competencia_ano}</p>
                      </td>
                      <td className="p-3 text-sm">{t.client_name || '-'}</td>
                      <td className="p-3 text-xs">{t.category_name || '-'}</td>
                      <td className="p-3 text-xs">{t.creator_name || 'Sistema'}</td>
                      <td className="p-3 text-sm">{formatDate(t.data_vencimento)}</td>
                      <td className="p-3 text-right">
                        <span className={cn("font-semibold text-sm", t.tipo_movimento === 'ENTRADA' ? 'text-income' : 'text-expense')}>
                          {formatCurrency(Number(t.valor))}
                        </span>
                      </td>
                      <td className="p-3 text-center">{getApprovalBadge(t.approval_status)}</td>
                      {isAdmin && (
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setDetailId(t.id)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {t.approval_status === 'pendente' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => approveMutation.mutate(t.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setRejectingId(t.id)}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject modal */}
      <Dialog open={!!rejectingId} onOpenChange={() => { setRejectingId(null); setRejectReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Informe o motivo da rejeição:</p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da rejeição..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => rejectingId && rejectMutation.mutate({ id: rejectingId, reason: rejectReason })}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail modal */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Lançamento</DialogTitle>
          </DialogHeader>
          {detailTx && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Tipo:</span> <strong>{detailTx.tipo_movimento === 'ENTRADA' ? 'Entrada' : 'Saída'}</strong></div>
                <div><span className="text-muted-foreground">Natureza:</span> <strong>{detailTx.natureza}</strong></div>
                <div><span className="text-muted-foreground">Descrição:</span> <strong>{detailTx.descricao || '-'}</strong></div>
                <div><span className="text-muted-foreground">Valor:</span> <strong>{formatCurrency(Number(detailTx.valor))}</strong></div>
                <div><span className="text-muted-foreground">Cliente:</span> <strong>{detailTx.client_name || '-'}</strong></div>
                <div><span className="text-muted-foreground">Categoria:</span> <strong>{detailTx.category_name || '-'}</strong></div>
                <div><span className="text-muted-foreground">Conta:</span> <strong>{detailTx.account_name || '-'}</strong></div>
                <div><span className="text-muted-foreground">C. Custo:</span> <strong>{detailTx.cost_center_name || '-'}</strong></div>
                <div><span className="text-muted-foreground">Responsável:</span> <strong>{detailTx.responsible_name || '-'}</strong></div>
                <div><span className="text-muted-foreground">Entidade:</span> <strong>{detailTx.entity_name || '-'}</strong></div>
                <div><span className="text-muted-foreground">Vencimento:</span> <strong>{formatDate(detailTx.data_vencimento)}</strong></div>
                <div><span className="text-muted-foreground">Criado por:</span> <strong>{detailTx.creator_name || 'Sistema'}</strong></div>
                <div><span className="text-muted-foreground">Criado em:</span> <strong>{formatDate(detailTx.created_at)}</strong></div>
                <div><span className="text-muted-foreground">Aprovação:</span> {getApprovalBadge(detailTx.approval_status)}</div>
              </div>
              {detailTx.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 font-medium">Motivo da rejeição:</p>
                  <p className="text-sm text-red-800">{detailTx.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
