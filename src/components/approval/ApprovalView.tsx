import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle, XCircle, Clock, Search, AlertTriangle,
  ArrowDownCircle, ArrowUpCircle, Loader2, Eye, Filter,
  CheckCheck, ArrowUpDown, ChevronUp, ChevronDown
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
  origem: string;
  category_name?: string;
  account_name?: string;
  cost_center_name?: string;
  entity_name?: string;
  responsible_name?: string;
  client_name?: string;
}

type SortField = 'data_vencimento' | 'valor' | 'created_at' | 'descricao' | 'tipo_movimento';
type SortDir = 'asc' | 'desc';

export function ApprovalView() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pendente');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterOrigem, setFilterOrigem] = useState<string>('todos');
  const [rejectingIds, setRejectingIds] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Fetch transactions with approval info - fixed query without invalid FK join
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['approval-transactions', filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          id, tipo_movimento, natureza, origem, descricao, valor, data_vencimento,
          competencia_mes, competencia_ano, approval_status, rejection_reason,
          created_at, created_by, status,
          recurring_clients(name),
          transaction_categories:transaction_category_id(name),
          accounts:account_id(name),
          cost_centers:cost_center_id(name),
          entity:financial_entities!transactions_entity_id_fkey(name),
          responsible:financial_entities!transactions_responsavel_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'todos') {
        query = query.eq('approval_status', filterStatus as any);
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
      })) as PendingTransaction[];
    },
  });

  // Approve mutation (supports bulk)
  const approveMutation = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          approval_status: 'aprovado',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .in('id', transactionIds);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['approval-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setSelectedIds(new Set());
      toast.success(`${ids.length} lançamento(s) aprovado(s)!`);
    },
    onError: () => toast.error('Erro ao aprovar'),
  });

  // Reject mutation (supports bulk)
  const rejectMutation = useMutation({
    mutationFn: async ({ ids, reason }: { ids: string[]; reason: string }) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          approval_status: 'rejeitado',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ['approval-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setSelectedIds(new Set());
      toast.success(`${ids.length} lançamento(s) rejeitado(s)`);
      setRejectingIds([]);
      setRejectReason('');
    },
    onError: () => toast.error('Erro ao rejeitar'),
  });

  // Filter and sort
  const filtered = useMemo(() => {
    if (!transactions) return [];
    let result = [...transactions];

    // Text search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(t =>
        t.descricao?.toLowerCase().includes(s) ||
        t.client_name?.toLowerCase().includes(s) ||
        t.category_name?.toLowerCase().includes(s) ||
        t.entity_name?.toLowerCase().includes(s) ||
        t.responsible_name?.toLowerCase().includes(s)
      );
    }

    // Filter by tipo
    if (filterTipo !== 'todos') {
      result = result.filter(t => t.tipo_movimento === filterTipo);
    }

    // Filter by origem
    if (filterOrigem !== 'todos') {
      result = result.filter(t => t.origem === filterOrigem);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'valor':
          cmp = Number(a.valor) - Number(b.valor);
          break;
        case 'data_vencimento':
          cmp = a.data_vencimento.localeCompare(b.data_vencimento);
          break;
        case 'created_at':
          cmp = a.created_at.localeCompare(b.created_at);
          break;
        case 'descricao':
          cmp = (a.descricao || '').localeCompare(b.descricao || '');
          break;
        case 'tipo_movimento':
          cmp = a.tipo_movimento.localeCompare(b.tipo_movimento);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transactions, search, filterTipo, filterOrigem, sortField, sortDir]);

  const pendingCount = transactions?.filter(t => t.approval_status === 'pendente').length || 0;
  const detailTx = detailId ? filtered.find(t => t.id === detailId) : null;

  // Selection helpers
  const pendingFiltered = filtered.filter(t => t.approval_status === 'pendente');
  const allPendingSelected = pendingFiltered.length > 0 && pendingFiltered.every(t => selectedIds.has(t.id));

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingFiltered.map(t => t.id)));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

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

  const getOrigemLabel = (origem: string) => {
    switch (origem) {
      case 'CONTRATO_RECORRENTE': return 'Contrato';
      case 'DESPESA_FIXA': return 'Despesa Fixa';
      case 'LANCAMENTO_MANUAL': return 'Manual';
      case 'IMPORTACAO': return 'Importação';
      default: return origem;
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  if (error) {
    return (
      <Card><CardContent className="py-8 text-center text-destructive">
        Erro ao carregar aprovações. Tente novamente.
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className={cn("cursor-pointer transition-all", filterStatus === 'pendente' && "ring-2 ring-amber-400")} onClick={() => setFilterStatus('pendente')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{transactions?.filter(t => t.approval_status === 'pendente').length || 0}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all", filterStatus === 'aprovado' && "ring-2 ring-emerald-400")} onClick={() => setFilterStatus('aprovado')}>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{transactions?.filter(t => t.approval_status === 'aprovado').length || 0}</p>
              <p className="text-xs text-muted-foreground">Aprovados</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all", filterStatus === 'rejeitado' && "ring-2 ring-red-400")} onClick={() => setFilterStatus('rejeitado')}>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{transactions?.filter(t => t.approval_status === 'rejeitado').length || 0}</p>
              <p className="text-xs text-muted-foreground">Rejeitados</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all", filterStatus === 'todos' && "ring-2 ring-primary")} onClick={() => setFilterStatus('todos')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Filter className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{transactions?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert banner */}
      {pendingCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              <strong>{pendingCount}</strong> lançamento{pendingCount > 1 ? 's' : ''} pendente{pendingCount > 1 ? 's' : ''} de aprovação
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, cliente, categoria, entidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos tipos</SelectItem>
            <SelectItem value="ENTRADA">Entradas</SelectItem>
            <SelectItem value="SAIDA">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterOrigem} onValueChange={setFilterOrigem}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas origens</SelectItem>
            <SelectItem value="LANCAMENTO_MANUAL">Manual</SelectItem>
            <SelectItem value="CONTRATO_RECORRENTE">Contrato</SelectItem>
            <SelectItem value="DESPESA_FIXA">Despesa Fixa</SelectItem>
            <SelectItem value="IMPORTACAO">Importação</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && isAdmin && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between py-3">
            <p className="text-sm font-medium">
              <strong>{selectedIds.size}</strong> selecionado{selectedIds.size > 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => approveMutation.mutate(Array.from(selectedIds))}
                disabled={approveMutation.isPending}
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Aprovar {selectedIds.size > 1 ? `(${selectedIds.size})` : ''}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setRejectingIds(Array.from(selectedIds))}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rejeitar {selectedIds.size > 1 ? `(${selectedIds.size})` : ''}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                    {isAdmin && filterStatus === 'pendente' && (
                      <th className="p-3 w-10">
                        <Checkbox
                          checked={allPendingSelected}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th className="text-left p-3 text-xs font-medium cursor-pointer select-none" onClick={() => handleSort('tipo_movimento')}>
                      <span className="flex items-center">Tipo <SortIcon field="tipo_movimento" /></span>
                    </th>
                    <th className="text-left p-3 text-xs font-medium cursor-pointer select-none" onClick={() => handleSort('descricao')}>
                      <span className="flex items-center">Descrição <SortIcon field="descricao" /></span>
                    </th>
                    <th className="text-left p-3 text-xs font-medium">Cliente</th>
                    <th className="text-left p-3 text-xs font-medium">Categoria</th>
                    <th className="text-left p-3 text-xs font-medium">Origem</th>
                    <th className="text-left p-3 text-xs font-medium cursor-pointer select-none" onClick={() => handleSort('data_vencimento')}>
                      <span className="flex items-center">Vencimento <SortIcon field="data_vencimento" /></span>
                    </th>
                    <th className="text-right p-3 text-xs font-medium cursor-pointer select-none" onClick={() => handleSort('valor')}>
                      <span className="flex items-center justify-end">Valor <SortIcon field="valor" /></span>
                    </th>
                    <th className="text-center p-3 text-xs font-medium">Status</th>
                    {isAdmin && <th className="text-center p-3 text-xs font-medium">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 10 : 9} className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum lançamento encontrado
                      </td>
                    </tr>
                  ) : filtered.map(t => (
                    <tr key={t.id} className={cn(
                      "hover:bg-muted/30 transition-colors",
                      selectedIds.has(t.id) && "bg-primary/5"
                    )}>
                      {isAdmin && filterStatus === 'pendente' && (
                        <td className="p-3">
                          <Checkbox
                            checked={selectedIds.has(t.id)}
                            onCheckedChange={() => toggleSelect(t.id)}
                          />
                        </td>
                      )}
                      <td className="p-3">
                        {t.tipo_movimento === 'ENTRADA'
                          ? <ArrowDownCircle className="w-5 h-5 text-income" />
                          : <ArrowUpCircle className="w-5 h-5 text-expense" />
                        }
                      </td>
                      <td className="p-3">
                        <p className="text-sm font-medium truncate max-w-[200px]">{t.descricao || '-'}</p>
                        <p className="text-xs text-muted-foreground">{t.competencia_mes.toString().padStart(2, '0')}/{t.competencia_ano}</p>
                      </td>
                      <td className="p-3 text-sm">{t.client_name || '-'}</td>
                      <td className="p-3 text-xs">{t.category_name || '-'}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">{getOrigemLabel(t.origem)}</Badge>
                      </td>
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
                                  onClick={() => approveMutation.mutate([t.id])}
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setRejectingIds([t.id])}
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
      <Dialog open={rejectingIds.length > 0} onOpenChange={() => { setRejectingIds([]); setRejectReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar {rejectingIds.length > 1 ? `${rejectingIds.length} Lançamentos` : 'Lançamento'}</DialogTitle>
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
            <Button variant="outline" onClick={() => setRejectingIds([])}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => rejectingIds.length > 0 && rejectMutation.mutate({ ids: rejectingIds, reason: rejectReason })}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              Rejeitar {rejectingIds.length > 1 ? `(${rejectingIds.length})` : ''}
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
                <div><span className="text-muted-foreground">Origem:</span> <strong>{getOrigemLabel(detailTx.origem)}</strong></div>
                <div><span className="text-muted-foreground">Valor:</span> <strong>{formatCurrency(Number(detailTx.valor))}</strong></div>
                <div className="col-span-2"><span className="text-muted-foreground">Descrição:</span> <strong>{detailTx.descricao || '-'}</strong></div>
                <div><span className="text-muted-foreground">Cliente:</span> <strong>{detailTx.client_name || '-'}</strong></div>
                <div><span className="text-muted-foreground">Categoria:</span> <strong>{detailTx.category_name || '-'}</strong></div>
                <div><span className="text-muted-foreground">Conta:</span> <strong>{detailTx.account_name || '-'}</strong></div>
                <div><span className="text-muted-foreground">C. Custo:</span> <strong>{detailTx.cost_center_name || '-'}</strong></div>
                <div><span className="text-muted-foreground">Responsável:</span> <strong>{detailTx.responsible_name || '-'}</strong></div>
                <div><span className="text-muted-foreground">Entidade:</span> <strong>{detailTx.entity_name || '-'}</strong></div>
                <div><span className="text-muted-foreground">Vencimento:</span> <strong>{formatDate(detailTx.data_vencimento)}</strong></div>
                <div><span className="text-muted-foreground">Criado em:</span> <strong>{formatDate(detailTx.created_at)}</strong></div>
                <div><span className="text-muted-foreground">Aprovação:</span> {getApprovalBadge(detailTx.approval_status)}</div>
              </div>
              {detailTx.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 font-medium">Motivo da rejeição:</p>
                  <p className="text-sm text-red-800">{detailTx.rejection_reason}</p>
                </div>
              )}
              {isAdmin && detailTx.approval_status === 'pendente' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => { approveMutation.mutate([detailTx.id]); setDetailId(null); }}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Aprovar
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => { setRejectingIds([detailTx.id]); setDetailId(null); }}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Rejeitar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
