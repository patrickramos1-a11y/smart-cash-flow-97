import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, ArrowUpCircle, ArrowDownCircle, MoreVertical, 
  CheckCircle, Clock, AlertTriangle, Send, Copy, Pencil, Trash2,
  RefreshCw, FileText, Loader2, DollarSign, ArrowUpDown, Settings2,
  ArrowUp, ArrowDown, Undo2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  useTransactions, 
  useMarkTransactionPaid, 
  useDuplicateTransaction, 
  useDeleteTransaction,
  useUpdateTransaction,
  TransactionFilters,
  TransactionWithClient,
  TransactionStatusType
} from '@/hooks/useTransactions';
import { formatCurrency } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { TransactionEditModal } from './TransactionEditModal';
import { MobileTransactionCard } from './MobileTransactionCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const statusConfig: Record<TransactionStatusType, { label: string; color: string; icon: React.ComponentType<{className?: string}> }> = {
  PAGO: { label: 'Pago', color: 'bg-income/10 text-income border-income/20', icon: CheckCircle },
  EM_ABERTO: { label: 'Em Aberto', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  ATRASADO: { label: 'Atrasado', color: 'bg-expense/10 text-expense border-expense/20', icon: AlertTriangle },
};

const naturezaLabels = {
  RECORRENTE: { label: 'Recorrente', icon: RefreshCw },
  AVULSA: { label: 'Avulsa', icon: FileText },
};

type SortField = 'valor' | 'data_vencimento' | 'descricao';
type SortDir = 'asc' | 'desc';

const ALL_COLUMNS = [
  { key: 'tipo', label: 'Tipo', default: true },
  { key: 'descricao', label: 'Descrição', default: true },
  { key: 'cliente', label: 'Cliente', default: true },
  { key: 'natureza', label: 'Natureza', default: true },
  { key: 'categoria', label: 'Categoria', default: true },
  { key: 'conta', label: 'Conta', default: true },
  { key: 'centro_custo', label: 'C. Custo', default: false },
  { key: 'responsavel', label: 'Responsável', default: true },
  { key: 'vencimento', label: 'Vencimento', default: true },
  { key: 'status', label: 'Status', default: true },
  { key: 'valor', label: 'Valor', default: true },
] as const;

type ColumnKey = typeof ALL_COLUMNS[number]['key'];

interface TransactionsListProps {
  filters: TransactionFilters;
}

export function TransactionsList({ filters }: TransactionsListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionWithClient | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingTransaction, setPayingTransaction] = useState<TransactionWithClient | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payValue, setPayValue] = useState('');
  const [sortField, setSortField] = useState<SortField>('data_vencimento');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithClient | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(ALL_COLUMNS.filter(c => c.default).map(c => c.key))
  );
  const isMobile = useIsMobile();
  const updateMutation = useUpdateTransaction();

  // Note: `search` is intentionally NOT passed into useTransactions to avoid
  // a network refetch (and loading flash) on every keystroke. We filter the
  // already-loaded data locally below.
  const combinedFilters: TransactionFilters = {
    ...filters,
    status: statusFilter !== 'all' ? statusFilter as TransactionStatusType : undefined,
  };

  const { data: transactions, isLoading, error } = useTransactions(combinedFilters);
  const markPaidMutation = useMarkTransactionPaid();
  const duplicateMutation = useDuplicateTransaction();
  const deleteMutation = useDeleteTransaction();

  // Sort + client-side text search (fluid, no refetch).
  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? transactions.filter(t =>
          t.descricao?.toLowerCase().includes(q) ||
          t.recurring_clients?.name?.toLowerCase().includes(q) ||
          t.category_name?.toLowerCase().includes(q) ||
          t.account_name?.toLowerCase().includes(q)
        )
      : transactions;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'valor':
          cmp = Number(a.valor) - Number(b.valor);
          break;
        case 'descricao':
          cmp = (a.descricao || '').localeCompare(b.descricao || '', 'pt-BR');
          break;
        case 'data_vencimento':
        default:
          cmp = new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [transactions, search, sortField, sortDir]);

  const getNatureIcon = (tipo: string) => {
    if (tipo === 'ENTRADA') return <ArrowDownCircle className="w-5 h-5 text-income" />;
    return <ArrowUpCircle className="w-5 h-5 text-expense" />;
  };

  const handleOpenPay = (t: TransactionWithClient) => {
    setPayingTransaction(t);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayValue(String(t.valor));
    setShowPayModal(true);
  };

  const handleConfirmPay = () => {
    if (payingTransaction) {
      markPaidMutation.mutate({ 
        transactionId: payingTransaction.id,
        valorPago: parseFloat(payValue) || undefined 
      });
      setShowPayModal(false);
      setPayingTransaction(null);
    }
  };

  const handleMarkPaid = (transaction: TransactionWithClient) => {
    handleOpenPay(transaction);
  };

  const handleDuplicate = (transaction: TransactionWithClient) => {
    duplicateMutation.mutate(transaction.id);
  };

  const handleSendCollection = (transaction: TransactionWithClient) => {
    toast.success(`Cobrança enviada para ${transaction.recurring_clients?.name || 'cliente'}!`);
  };

  const confirmDelete = (transaction: TransactionWithClient) => {
    setDeletingTransaction(transaction);
    setShowDeleteConfirm(true);
  };

  const handleDelete = () => {
    if (deletingTransaction) {
      deleteMutation.mutate(deletingTransaction.id);
      setDeletingTransaction(null);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedTransactions.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach(id => deleteMutation.mutate(id));
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} transações excluídas`);
  };

  const handleRevertToPending = (t: TransactionWithClient) => {
    updateMutation.mutate({ 
      id: t.id, 
      status: 'EM_ABERTO', 
      valor_pago: null, 
      data_pagamento: null 
    } as any);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Erro ao carregar transações. Tente novamente.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {/* Status filter pills on mobile */}
        {isMobile ? (
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {['all', 'PAGO', 'EM_ABERTO', 'ATRASADO'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "filter-pill whitespace-nowrap text-xs",
                  statusFilter === s && "active"
                )}
              >
                {s === 'all' ? 'Todos' : s === 'PAGO' ? 'Pago' : s === 'EM_ABERTO' ? 'Aberto' : 'Atrasado'}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PAGO">Pago</SelectItem>
                <SelectItem value="EM_ABERTO">Em Aberto</SelectItem>
                <SelectItem value="ATRASADO">Atrasado</SelectItem>
              </SelectContent>
            </Select>

            {/* Column config */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Settings2 className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <p className="text-xs font-medium mb-2 text-muted-foreground">Colunas visíveis</p>
                <div className="space-y-2">
                  {ALL_COLUMNS.map(col => (
                    <label key={col.key} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox 
                        checked={visibleColumns.has(col.key)}
                        onCheckedChange={() => toggleColumn(col.key)}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Mobile Card List */}
      {isMobile ? (
        <div className="space-y-2">
          {sortedTransactions.length > 0 ? (
            sortedTransactions.map(t => (
              <MobileTransactionCard
                key={t.id}
                transaction={t}
                onMarkPaid={handleMarkPaid}
                onDuplicate={handleDuplicate}
                onSendCollection={handleSendCollection}
                onDelete={confirmDelete}
                onEdit={setEditingTransaction}
                onRevert={handleRevertToPending}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Nenhuma transação encontrada.
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Desktop Table */
        <Card>
          {/* Bulk actions bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 border-b">
              <span className="text-sm font-medium">{selectedIds.size} selecionada(s)</span>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="h-7 text-xs">
                <Trash2 className="w-3 h-3 mr-1" /> Excluir Selecionadas
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())} className="h-7 text-xs">
                Limpar Seleção
              </Button>
            </div>
          )}
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 w-10">
                      <Checkbox 
                        checked={sortedTransactions.length > 0 && selectedIds.size === sortedTransactions.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    {visibleColumns.has('tipo') && <th className="text-left p-4 text-sm font-medium">Tipo</th>}
                    {visibleColumns.has('descricao') && (
                      <th className="text-left p-4 text-sm font-medium">
                        <button onClick={() => toggleSort('descricao')} className="flex items-center hover:text-foreground">
                          Descrição <SortIcon field="descricao" />
                        </button>
                      </th>
                    )}
                    {visibleColumns.has('cliente') && <th className="text-left p-4 text-sm font-medium">Cliente</th>}
                    {visibleColumns.has('natureza') && <th className="text-left p-4 text-sm font-medium">Natureza</th>}
                    {visibleColumns.has('categoria') && <th className="text-left p-4 text-sm font-medium">Categoria</th>}
                    {visibleColumns.has('conta') && <th className="text-left p-4 text-sm font-medium">Conta</th>}
                    {visibleColumns.has('centro_custo') && <th className="text-left p-4 text-sm font-medium">C. Custo</th>}
                    {visibleColumns.has('responsavel') && <th className="text-left p-4 text-sm font-medium">Responsável</th>}
                    {visibleColumns.has('vencimento') && (
                      <th className="text-left p-4 text-sm font-medium">
                        <button onClick={() => toggleSort('data_vencimento')} className="flex items-center hover:text-foreground">
                          Vencimento <SortIcon field="data_vencimento" />
                        </button>
                      </th>
                    )}
                    {visibleColumns.has('status') && <th className="text-left p-4 text-sm font-medium">Status</th>}
                    {visibleColumns.has('valor') && (
                      <th className="text-right p-4 text-sm font-medium">
                        <button onClick={() => toggleSort('valor')} className="flex items-center justify-end hover:text-foreground ml-auto">
                          Valor <SortIcon field="valor" />
                        </button>
                      </th>
                    )}
                    <th className="text-center p-4 text-sm font-medium w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedTransactions.length > 0 ? (
                    sortedTransactions.map(t => {
                      const status = statusConfig[t.status];
                      const StatusIcon = status.icon;
                      const natureza = naturezaLabels[t.natureza];
                      const NaturezaIcon = natureza.icon;

                      // Type badge
                      const getTypeBadge = () => {
                        if (t.tipo_movimento === 'ENTRADA') {
                          return t.natureza === 'RECORRENTE' 
                            ? { label: 'Recorrente', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
                            : { label: 'Avulso', color: 'bg-blue-100 text-blue-700 border-blue-200' };
                        }
                        // SAIDA
                        if (t.natureza === 'RECORRENTE' || t.expense_type === 'FIXA' || t.category_subtype === 'FIXA') {
                          return { label: 'Fixo', color: 'bg-red-100 text-red-700 border-red-200' };
                        }
                        return { label: 'Variável', color: 'bg-amber-100 text-amber-700 border-amber-200' };
                      };
                      const typeBadge = getTypeBadge();
                      
                      return (
                        <tr key={t.id} className={cn("hover:bg-muted/30 transition-colors", selectedIds.has(t.id) && "bg-primary/5")}>
                          <td className="p-4">
                            <Checkbox checked={selectedIds.has(t.id)} onCheckedChange={() => toggleSelect(t.id)} />
                          </td>
                          {visibleColumns.has('tipo') && <td className="p-4">{getNatureIcon(t.tipo_movimento)}</td>}
                          {visibleColumns.has('descricao') && (
                            <td className="p-4">
                              <p className="font-medium text-sm">{t.descricao || '-'}</p>
                              <p className="text-xs text-muted-foreground">
                                {t.competencia_mes.toString().padStart(2, '0')}/{t.competencia_ano}
                              </p>
                            </td>
                          )}
                          {visibleColumns.has('cliente') && (
                            <td className="p-4">
                              <span className="text-sm">{t.recurring_clients?.name || '-'}</span>
                            </td>
                          )}
                          {visibleColumns.has('natureza') && (
                            <td className="p-4">
                              <Badge variant="outline" className={cn("text-xs", typeBadge.color)}>
                                <NaturezaIcon className="w-3 h-3 mr-1" />
                                {typeBadge.label}
                              </Badge>
                            </td>
                          )}
                          {visibleColumns.has('categoria') && (
                            <td className="p-4">
                              <span className="text-xs font-medium" style={{ color: t.category_color || undefined }}>
                                {t.category_name || 'Não vinculado'}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has('conta') && (
                            <td className="p-4">
                              <span className="text-xs text-muted-foreground">{t.account_name || 'Não vinculado'}</span>
                            </td>
                          )}
                          {visibleColumns.has('centro_custo') && (
                            <td className="p-4">
                              <span className="text-xs text-muted-foreground">{t.cost_center_name || 'Não vinculado'}</span>
                            </td>
                          )}
                          {visibleColumns.has('responsavel') && (
                            <td className="p-4">
                              <span className="text-xs text-muted-foreground">{t.responsible_name || t.entity_name || '-'}</span>
                            </td>
                          )}
                          {visibleColumns.has('vencimento') && (
                            <td className="p-4">
                              <span className="text-sm">{formatDate(t.data_vencimento)}</span>
                            </td>
                          )}
                          {visibleColumns.has('status') && (
                            <td className="p-4">
                              <Badge variant="outline" className={cn("text-xs", status.color)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                            </td>
                          )}
                          {visibleColumns.has('valor') && (
                            <td className="p-4 text-right">
                              <span className={cn(
                                "font-semibold",
                                t.tipo_movimento === 'ENTRADA' && "text-income",
                                t.tipo_movimento === 'SAIDA' && "text-expense"
                              )}>
                                {formatCurrency(Number(t.valor))}
                              </span>
                            </td>
                          )}
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1">
                              {t.status !== 'PAGO' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 px-2 text-xs text-income hover:text-income hover:bg-income/10"
                                  onClick={() => handleOpenPay(t)}
                                >
                                  <DollarSign className="w-3.5 h-3.5 mr-0.5" />
                                  Pagar
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingTransaction(t)}>
                                    <Pencil className="w-4 h-4 mr-2" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicate(t)}>
                                    <Copy className="w-4 h-4 mr-2" /> Duplicar
                                  </DropdownMenuItem>
                                  {t.status !== 'PAGO' && (
                                    <DropdownMenuItem onClick={() => handleOpenPay(t)}>
                                      <CheckCircle className="w-4 h-4 mr-2" /> Marcar Pago
                                    </DropdownMenuItem>
                                  )}
                                  {t.status === 'PAGO' && (
                                    <DropdownMenuItem onClick={() => handleRevertToPending(t)}>
                                      <Undo2 className="w-4 h-4 mr-2" /> Reverter p/ Em Aberto
                                    </DropdownMenuItem>
                                  )}
                                  {t.tipo_movimento === 'ENTRADA' && t.status !== 'PAGO' && (
                                    <DropdownMenuItem onClick={() => handleSendCollection(t)}>
                                      <Send className="w-4 h-4 mr-2" /> Enviar Cobrança
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => confirmDelete(t)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-muted-foreground">
                        Nenhuma transação encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pay Modal */}
      <Dialog open={showPayModal} onOpenChange={(v) => !v && setShowPayModal(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-income" />
              Confirmar Pagamento
            </DialogTitle>
          </DialogHeader>
          {payingTransaction && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">{payingTransaction.descricao || '-'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {payingTransaction.recurring_clients?.name || 'Sem cliente'} • {formatDate(payingTransaction.data_vencimento)}
                </p>
                <p className="text-lg font-bold mt-2">{formatCurrency(Number(payingTransaction.valor))}</p>
              </div>
              <div>
                <Label>Valor Pago</Label>
                <Input 
                  value={payValue}
                  onChange={(e) => setPayValue(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Data de Pagamento</Label>
                <Input 
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPayModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmPay} 
                  disabled={markPaidMutation.isPending}
                  className="flex-1 bg-income hover:bg-income/90"
                >
                  {markPaidMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Transação"
        message={`Tem certeza que deseja excluir "${deletingTransaction?.descricao}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        type="danger"
      />

      {/* Edit Recurring Value Modal */}
      <TransactionEditModal
        open={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
      />
    </>
  );
}
