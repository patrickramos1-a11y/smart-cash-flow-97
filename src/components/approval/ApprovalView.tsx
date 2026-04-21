import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle, XCircle, Clock, Search, AlertTriangle,
  ArrowDownCircle, ArrowUpCircle, Loader2, Eye, Filter,
  CheckCheck, ArrowUpDown, ChevronUp, ChevronDown, Pencil,
  Layers, Wand2,
} from 'lucide-react';
import { formatCurrency } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { TransactionEditModal } from '@/components/transactions/TransactionEditModal';
import type { TransactionWithClient } from '@/hooks/useTransactions';

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
  fixed_expense_id: string | null;
  category_name?: string;
  account_name?: string;
  cost_center_name?: string;
  entity_name?: string;
  responsible_name?: string;
  client_name?: string;
  fixed_expense_name?: string;
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
  const [rejectReasonsSelected, setRejectReasonsSelected] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [groupByFixed, setGroupByFixed] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionWithClient | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('');
  const [bulkAccountId, setBulkAccountId] = useState<string>('');
  const [bulkCostCenterId, setBulkCostCenterId] = useState<string>('');
  const [bulkClienteId, setBulkClienteId] = useState<string>('');
  const [bulkEntityId, setBulkEntityId] = useState<string>('');
  const [bulkResponsavelId, setBulkResponsavelId] = useState<string>('');
  const [bulkOrigem, setBulkOrigem] = useState<string>('');

  // Lookup data for bulk edit
  const { data: categoriesList } = useQuery({
    queryKey: ['approval_categories_list'],
    queryFn: async () => {
      const { data } = await supabase.from('transaction_categories').select('id, name, type').eq('active', true).order('name');
      return data || [];
    },
  });
  const { data: accountsList } = useQuery({
    queryKey: ['approval_accounts_list'],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('id, name').eq('active', true).order('name');
      return data || [];
    },
  });
  const { data: costCentersList } = useQuery({
    queryKey: ['approval_cost_centers_list'],
    queryFn: async () => {
      const { data } = await supabase.from('cost_centers').select('id, name').eq('active', true).order('name');
      return data || [];
    },
  });
  const { data: clientsList } = useQuery({
    queryKey: ['approval_clients_list'],
    queryFn: async () => {
      const { data } = await supabase.from('recurring_clients').select('id, name').eq('active', true).order('name');
      return data || [];
    },
  });
  const { data: entitiesList } = useQuery({
    queryKey: ['approval_entities_list'],
    queryFn: async () => {
      const { data } = await supabase.from('financial_entities').select('id, name, type').eq('active', true).order('name');
      return data || [];
    },
  });

  // Fetch transactions with approval info - includes fixed_expenses fallback
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['approval-transactions', filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          id, tipo_movimento, natureza, origem, descricao, valor, data_vencimento,
          competencia_mes, competencia_ano, approval_status, rejection_reason,
          created_at, created_by, status, fixed_expense_id, cliente_id,
          recurring_clients:cliente_id(name),
          transaction_categories:transaction_category_id(name),
          accounts:account_id(name),
          cost_centers:cost_center_id(name),
          entity:financial_entities!transactions_entity_id_fkey(name),
          responsible:financial_entities!transactions_responsavel_id_fkey(name),
          fixed_expenses:fixed_expense_id(
            nome,
            transaction_category_id,
            account_id,
            cost_center_id,
            recurring_clients:cliente_id(name),
            fx_category:transaction_categories!fixed_expenses_transaction_category_id_fkey(name),
            fx_account:accounts!fixed_expenses_account_id_fkey(name),
            fx_cc:cost_centers!fixed_expenses_cost_center_id_fkey(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'todos') {
        query = query.eq('approval_status', filterStatus as any);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((t: any) => {
        const fx = t.fixed_expenses;
        return {
          ...t,
          category_name: t.transaction_categories?.name || fx?.fx_category?.name,
          account_name: t.accounts?.name || fx?.fx_account?.name,
          cost_center_name: t.cost_centers?.name || fx?.fx_cc?.name,
          entity_name: t.entity?.name,
          responsible_name: t.responsible?.name,
          client_name: t.recurring_clients?.name || fx?.recurring_clients?.name,
          fixed_expense_name: fx?.nome,
        };
      }) as PendingTransaction[];
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

  // Reject mutation: archives to rejected_transactions and DELETES from transactions
  const rejectMutation = useMutation({
    mutationFn: async ({ ids, reason }: { ids: string[]; reason: string }) => {
      const { error } = await supabase.rpc('archive_and_delete_rejected', {
        p_ids: ids,
        p_reason: reason,
        p_rejected_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ['approval-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['rejected-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setSelectedIds(new Set());
      toast.success(`${ids.length} lançamento(s) rejeitado(s) e arquivado(s)`);
      setRejectingIds([]);
      setRejectReason('');
      setRejectReasonsSelected([]);
    },
    onError: (e: any) => toast.error('Erro ao rejeitar: ' + (e?.message || '')),
  });

  // Rejected transactions audit log
  const { data: rejectedLog } = useQuery({
    queryKey: ['rejected-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rejected_transactions')
        .select(`
          id, original_transaction_id, tipo_movimento, descricao, valor,
          data_vencimento, competencia_mes, competencia_ano, origem,
          rejection_reason, rejected_at, rejected_by,
          recurring_clients:cliente_id(name),
          transaction_categories:transaction_category_id(name),
          accounts:account_id(name),
          entity:financial_entities!rejected_transactions_entity_id_fkey(name)
        `)
        .order('rejected_at', { ascending: false })
        .limit(500);
      if (error) {
        // Fallback without FK alias if relation isn't named yet
        const r2 = await supabase
          .from('rejected_transactions')
          .select('*')
          .order('rejected_at', { ascending: false })
          .limit(500);
        return r2.data || [];
      }
      return data || [];
    },
  });

  // Bulk edit mutation
  const bulkEditMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ['approval-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`${ids.length} lançamento(s) atualizado(s)!`);
      setBulkEditOpen(false);
      setBulkCategoryId('');
      setBulkAccountId('');
      setBulkCostCenterId('');
      setBulkClienteId('');
      setBulkEntityId('');
      setBulkResponsavelId('');
      setBulkOrigem('');
      setSelectedIds(new Set());
    },
    onError: (e: any) => toast.error('Erro ao atualizar: ' + (e?.message || '')),
  });

  // Filter and sort
  const filtered = useMemo(() => {
    if (!transactions) return [];
    let result = [...transactions];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(t =>
        t.descricao?.toLowerCase().includes(s) ||
        t.client_name?.toLowerCase().includes(s) ||
        t.category_name?.toLowerCase().includes(s) ||
        t.entity_name?.toLowerCase().includes(s) ||
        t.responsible_name?.toLowerCase().includes(s) ||
        t.fixed_expense_name?.toLowerCase().includes(s)
      );
    }

    if (filterTipo !== 'todos') {
      result = result.filter(t => t.tipo_movimento === filterTipo);
    }

    if (filterOrigem !== 'todos') {
      result = result.filter(t => t.origem === filterOrigem);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'valor': cmp = Number(a.valor) - Number(b.valor); break;
        case 'data_vencimento': cmp = a.data_vencimento.localeCompare(b.data_vencimento); break;
        case 'created_at': cmp = a.created_at.localeCompare(b.created_at); break;
        case 'descricao': cmp = (a.descricao || '').localeCompare(b.descricao || ''); break;
        case 'tipo_movimento': cmp = a.tipo_movimento.localeCompare(b.tipo_movimento); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transactions, search, filterTipo, filterOrigem, sortField, sortDir]);

  // Group fixed-expense pending tx by fixed_expense_id
  const fixedGroups = useMemo(() => {
    const groups = new Map<string, { name: string; items: PendingTransaction[] }>();
    filtered.forEach(t => {
      if (t.origem === 'DESPESA_FIXA' && t.fixed_expense_id && t.approval_status === 'pendente') {
        const key = t.fixed_expense_id;
        if (!groups.has(key)) {
          groups.set(key, { name: t.fixed_expense_name || t.descricao || 'Despesa Fixa', items: [] });
        }
        groups.get(key)!.items.push(t);
      }
    });
    return Array.from(groups.entries()).map(([id, g]) => ({ id, ...g }));
  }, [filtered]);

  const pendingCount = transactions?.filter(t => t.approval_status === 'pendente').length || 0;
  const detailTx = detailId ? filtered.find(t => t.id === detailId) : null;

  const pendingFiltered = filtered.filter(t => t.approval_status === 'pendente');
  const allPendingSelected = pendingFiltered.length > 0 && pendingFiltered.every(t => selectedIds.has(t.id));

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (allPendingSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(pendingFiltered.map(t => t.id)));
  };

  const selectGroup = (items: PendingTransaction[]) => {
    const next = new Set(selectedIds);
    items.forEach(i => next.add(i.id));
    setSelectedIds(next);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'aprovado': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejeitado': return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
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

  const openEdit = async (id: string) => {
    // Fetch full row to pass to edit modal
    const { data, error } = await supabase
      .from('transactions')
      .select('*, recurring_clients:cliente_id(id, name)')
      .eq('id', id)
      .single();
    if (error || !data) { toast.error('Erro ao carregar lançamento'); return; }
    setEditingTx(data as any);
  };

  const handleBulkEditApply = () => {
    if (selectedIds.size === 0) return;
    const updates: Record<string, any> = {};
    if (bulkCategoryId) updates.transaction_category_id = bulkCategoryId;
    if (bulkAccountId) updates.account_id = bulkAccountId;
    if (bulkCostCenterId) updates.cost_center_id = bulkCostCenterId;
    if (bulkClienteId) updates.cliente_id = bulkClienteId;
    if (bulkEntityId) updates.entity_id = bulkEntityId;
    if (bulkResponsavelId) updates.responsavel_id = bulkResponsavelId;
    if (bulkOrigem) updates.origem = bulkOrigem;
    if (Object.keys(updates).length === 0) {
      toast.error('Selecione pelo menos um campo para alterar');
      return;
    }
    bulkEditMutation.mutate({ ids: Array.from(selectedIds), updates });
  };

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
              <p className="text-2xl font-bold">{rejectedLog?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Rejeitados (arquivo)</p>
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
            placeholder="Buscar por descrição, cliente, categoria, despesa fixa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos tipos</SelectItem>
            <SelectItem value="ENTRADA">Entradas</SelectItem>
            <SelectItem value="SAIDA">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterOrigem} onValueChange={setFilterOrigem}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas origens</SelectItem>
            <SelectItem value="LANCAMENTO_MANUAL">Manual</SelectItem>
            <SelectItem value="CONTRATO_RECORRENTE">Contrato</SelectItem>
            <SelectItem value="DESPESA_FIXA">Despesa Fixa</SelectItem>
            <SelectItem value="IMPORTACAO">Importação</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={groupByFixed ? 'default' : 'outline'}
          onClick={() => setGroupByFixed(g => !g)}
          className="gap-2"
        >
          <Layers className="w-4 h-4" />
          Agrupar Despesas Fixas
        </Button>
      </div>

      {/* Grouped Fixed Expenses panel */}
      {groupByFixed && filterStatus === 'pendente' && fixedGroups.length > 0 && isAdmin && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4" /> Despesas Fixas Pendentes (aprovação em conjunto)
            </p>
            <p className="text-xs text-muted-foreground">
              Verifique os dados do cadastro antes de aprovar. Use o botão "Editar Cadastro" para ajustar antes da aprovação em massa.
            </p>
            <div className="space-y-3">
              {fixedGroups.map(g => {
                const total = g.items.reduce((s, i) => s + Number(i.valor), 0);
                const sample = g.items[0];
                return (
                  <div key={g.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-muted/40">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{g.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {g.items.length} parcela(s) • Total: <strong>{formatCurrency(total)}</strong>
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => openEdit(sample.id)}>
                          <Pencil className="w-3 h-3 mr-1" /> Editar Cadastro
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => selectGroup(g.items)}>
                          Selecionar grupo
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => approveMutation.mutate(g.items.map(i => i.id))}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCheck className="w-4 h-4 mr-1" />
                          Aprovar Todas ({g.items.length})
                        </Button>
                      </div>
                    </div>
                    {/* Cadastro snapshot */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 p-3 text-xs bg-card">
                      <div><span className="text-muted-foreground">Cliente:</span> <strong>{sample.client_name || <span className="text-amber-600 italic">não preenchido</span>}</strong></div>
                      <div><span className="text-muted-foreground">Categoria:</span> <strong>{sample.category_name || <span className="text-amber-600 italic">não preenchido</span>}</strong></div>
                      <div><span className="text-muted-foreground">Conta:</span> <strong>{sample.account_name || <span className="text-amber-600 italic">não preenchido</span>}</strong></div>
                      <div><span className="text-muted-foreground">C. Custo:</span> <strong>{sample.cost_center_name || '-'}</strong></div>
                      <div><span className="text-muted-foreground">Entidade:</span> <strong>{sample.entity_name || '-'}</strong></div>
                      <div><span className="text-muted-foreground">Responsável:</span> <strong>{sample.responsible_name || '-'}</strong></div>
                      <div><span className="text-muted-foreground">Vencimento:</span> <strong>dia {new Date(sample.data_vencimento).getDate()}</strong></div>
                      <div><span className="text-muted-foreground">Valor unit.:</span> <strong>{formatCurrency(Number(sample.valor))}</strong></div>
                      <div><span className="text-muted-foreground">Origem:</span> <strong>{getOrigemLabel(sample.origem)}</strong></div>
                    </div>
                    {/* Parcelas list */}
                    <details className="border-t">
                      <summary className="text-xs px-3 py-2 cursor-pointer hover:bg-muted/30 text-muted-foreground">
                        Ver {g.items.length} parcela(s)
                      </summary>
                      <div className="px-3 pb-3 space-y-1">
                        {g.items.map(it => (
                          <div key={it.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                            <span>{it.competencia_mes.toString().padStart(2, '0')}/{it.competencia_ano} • Venc. {formatDate(it.data_vencimento)}</span>
                            <span className="font-medium">{formatCurrency(Number(it.valor))}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && isAdmin && (
        <Card className="border-primary/30 bg-primary/5 sticky top-2 z-10">
          <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
            <p className="text-sm font-medium">
              <strong>{selectedIds.size}</strong> selecionado{selectedIds.size > 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setBulkEditOpen(true)}>
                <Wand2 className="w-4 h-4 mr-1" />
                Editar Campos
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => approveMutation.mutate(Array.from(selectedIds))}
                disabled={approveMutation.isPending}
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Aprovar {selectedIds.size > 1 ? `(${selectedIds.size})` : ''}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setRejectingIds(Array.from(selectedIds))}>
                <XCircle className="w-4 h-4 mr-1" />
                Rejeitar {selectedIds.size > 1 ? `(${selectedIds.size})` : ''}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Limpar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected archive view */}
      {filterStatus === 'rejeitado' ? (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b bg-red-50/40">
              <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Histórico de Rejeições
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Lançamentos rejeitados são removidos das transações ativas e arquivados aqui para auditoria.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium">Tipo</th>
                    <th className="text-left p-3 text-xs font-medium">Descrição</th>
                    <th className="text-left p-3 text-xs font-medium">Cliente</th>
                    <th className="text-left p-3 text-xs font-medium">Categoria</th>
                    <th className="text-left p-3 text-xs font-medium">Origem</th>
                    <th className="text-left p-3 text-xs font-medium">Vencimento</th>
                    <th className="text-right p-3 text-xs font-medium">Valor</th>
                    <th className="text-left p-3 text-xs font-medium">Motivo</th>
                    <th className="text-left p-3 text-xs font-medium">Rejeitado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(!rejectedLog || rejectedLog.length === 0) ? (
                    <tr><td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">Nenhum lançamento rejeitado.</td></tr>
                  ) : rejectedLog.map((r: any) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        {r.tipo_movimento === 'ENTRADA'
                          ? <ArrowDownCircle className="w-5 h-5 text-income" />
                          : <ArrowUpCircle className="w-5 h-5 text-expense" />}
                      </td>
                      <td className="p-3 text-sm">
                        <p className="font-medium truncate max-w-[200px]">{r.descricao || '-'}</p>
                        <p className="text-xs text-muted-foreground">{String(r.competencia_mes).padStart(2, '0')}/{r.competencia_ano}</p>
                      </td>
                      <td className="p-3 text-sm">{r.recurring_clients?.name || '-'}</td>
                      <td className="p-3 text-xs">{r.transaction_categories?.name || '-'}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{getOrigemLabel(r.origem)}</Badge></td>
                      <td className="p-3 text-sm">{formatDate(r.data_vencimento)}</td>
                      <td className="p-3 text-right font-semibold text-sm">{formatCurrency(Number(r.valor))}</td>
                      <td className="p-3 text-xs max-w-[240px]"><span className="text-red-700">{r.rejection_reason}</span></td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(r.rejected_at).toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
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
                        <Checkbox checked={allPendingSelected} onCheckedChange={toggleSelectAll} />
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
                  ) : filtered.map(t => {
                    const missingCategory = !t.category_name;
                    const missingClient = !t.client_name && t.origem !== 'LANCAMENTO_MANUAL';
                    return (
                      <tr key={t.id} className={cn(
                        "hover:bg-muted/30 transition-colors",
                        selectedIds.has(t.id) && "bg-primary/5"
                      )}>
                        {isAdmin && filterStatus === 'pendente' && (
                          <td className="p-3">
                            <Checkbox checked={selectedIds.has(t.id)} onCheckedChange={() => toggleSelect(t.id)} />
                          </td>
                        )}
                        <td className="p-3">
                          {t.tipo_movimento === 'ENTRADA'
                            ? <ArrowDownCircle className="w-5 h-5 text-income" />
                            : <ArrowUpCircle className="w-5 h-5 text-expense" />
                          }
                        </td>
                        <td className="p-3">
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {t.descricao || t.fixed_expense_name || '-'}
                          </p>
                          <p className="text-xs text-muted-foreground">{t.competencia_mes.toString().padStart(2, '0')}/{t.competencia_ano}</p>
                        </td>
                        <td className="p-3 text-sm">
                          {t.client_name || (
                            missingClient
                              ? <span className="text-amber-600 text-xs italic">⚠ não preenchido</span>
                              : '-'
                          )}
                        </td>
                        <td className="p-3 text-xs">
                          {t.category_name || (
                            missingCategory
                              ? <span className="text-amber-600 italic">⚠ não preenchido</span>
                              : '-'
                          )}
                        </td>
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
                              <Button size="sm" variant="ghost" onClick={() => setDetailId(t.id)} title="Ver detalhes">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openEdit(t.id)} title="Editar">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              {t.approval_status === 'pendente' && (
                                <>
                                  <Button
                                    size="sm" variant="ghost"
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => approveMutation.mutate([t.id])}
                                    disabled={approveMutation.isPending}
                                    title="Aprovar"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm" variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => setRejectingIds([t.id])}
                                    title="Rejeitar"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject modal */}
      <Dialog
        open={rejectingIds.length > 0}
        onOpenChange={() => { setRejectingIds([]); setRejectReason(''); setRejectReasonsSelected([]); }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rejeitar {rejectingIds.length > 1 ? `${rejectingIds.length} Lançamentos` : 'Lançamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Selecione o(s) motivo(s):</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Valor incorreto',
                  'Categoria incorreta',
                  'Centro de custo incorreto',
                  'Conta incorreta',
                  'Cliente/Entidade incorreto',
                  'Data de vencimento incorreta',
                  'Descrição insuficiente',
                  'Documento (NF/Recibo) ausente',
                  'Lançamento duplicado',
                  'Fora do escopo / não autorizado',
                ].map((opt) => {
                  const checked = rejectReasonsSelected.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm transition-colors',
                        checked ? 'border-destructive bg-destructive/5' : 'border-border hover:bg-muted'
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          setRejectReasonsSelected((prev) =>
                            v ? [...prev, opt] : prev.filter((r) => r !== opt)
                          );
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Detalhes adicionais (opcional)</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Adicione um comentário se necessário..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectingIds([]); setRejectReason(''); setRejectReasonsSelected([]); }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectingIds.length === 0) return;
                const parts: string[] = [];
                if (rejectReasonsSelected.length > 0) parts.push(rejectReasonsSelected.join('; '));
                if (rejectReason.trim()) parts.push(rejectReason.trim());
                const finalReason = parts.join(' — ');
                rejectMutation.mutate({ ids: rejectingIds, reason: finalReason });
              }}
              disabled={(rejectReasonsSelected.length === 0 && !rejectReason.trim()) || rejectMutation.isPending}
            >
              Rejeitar {rejectingIds.length > 1 ? `(${rejectingIds.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk edit modal */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar {selectedIds.size} lançamento(s) em massa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Preencha apenas os campos que deseja alterar. Os demais permanecerão inalterados.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={bulkClienteId} onValueChange={setBulkClienteId}>
                  <SelectTrigger><SelectValue placeholder="Não alterar" /></SelectTrigger>
                  <SelectContent>
                    {(clientsList || []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Não alterar" /></SelectTrigger>
                  <SelectContent>
                    {(categoriesList || []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conta</Label>
                <Select value={bulkAccountId} onValueChange={setBulkAccountId}>
                  <SelectTrigger><SelectValue placeholder="Não alterar" /></SelectTrigger>
                  <SelectContent>
                    {(accountsList || []).map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Centro de Custo</Label>
                <Select value={bulkCostCenterId} onValueChange={setBulkCostCenterId}>
                  <SelectTrigger><SelectValue placeholder="Não alterar" /></SelectTrigger>
                  <SelectContent>
                    {(costCentersList || []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entidade</Label>
                <Select value={bulkEntityId} onValueChange={setBulkEntityId}>
                  <SelectTrigger><SelectValue placeholder="Não alterar" /></SelectTrigger>
                  <SelectContent>
                    {(entitiesList || []).map((e: any) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={bulkResponsavelId} onValueChange={setBulkResponsavelId}>
                  <SelectTrigger><SelectValue placeholder="Não alterar" /></SelectTrigger>
                  <SelectContent>
                    {(entitiesList || []).map((e: any) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Origem</Label>
                <Select value={bulkOrigem} onValueChange={setBulkOrigem}>
                  <SelectTrigger><SelectValue placeholder="Não alterar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LANCAMENTO_MANUAL">Manual</SelectItem>
                    <SelectItem value="CONTRATO_RECORRENTE">Contrato Recorrente</SelectItem>
                    <SelectItem value="DESPESA_FIXA">Despesa Fixa</SelectItem>
                    <SelectItem value="IMPORTACAO">Importação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleBulkEditApply} disabled={bulkEditMutation.isPending}>
              {bulkEditMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Aplicar a {selectedIds.size} lançamento(s)
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
                <div className="col-span-2"><span className="text-muted-foreground">Descrição:</span> <strong>{detailTx.descricao || detailTx.fixed_expense_name || '-'}</strong></div>
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
              {isAdmin && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => { openEdit(detailTx.id); setDetailId(null); }}>
                    <Pencil className="w-4 h-4 mr-2" /> Editar
                  </Button>
                  {detailTx.approval_status === 'pendente' && (
                    <>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => { approveMutation.mutate([detailTx.id]); setDetailId(null); }}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Aprovar
                      </Button>
                      <Button className="flex-1" variant="destructive"
                        onClick={() => { setRejectingIds([detailTx.id]); setDetailId(null); }}>
                        <XCircle className="w-4 h-4 mr-2" /> Rejeitar
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit modal (full transaction edit) */}
      <TransactionEditModal
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
      />
    </div>
  );
}
