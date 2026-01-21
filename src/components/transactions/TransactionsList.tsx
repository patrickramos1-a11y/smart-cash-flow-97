import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, ArrowUpCircle, ArrowDownCircle, MoreVertical, 
  CheckCircle, Clock, AlertTriangle, Send, Copy, Pencil, Trash2,
  RefreshCw, FileText, Loader2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  useTransactions, 
  useMarkTransactionPaid, 
  useDuplicateTransaction, 
  useDeleteTransaction,
  TransactionFilters,
  TransactionWithClient,
  TransactionStatusType
} from '@/hooks/useTransactions';
import { formatCurrency } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
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

interface TransactionsListProps {
  filters: TransactionFilters;
}

export function TransactionsList({ filters }: TransactionsListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionWithClient | null>(null);

  // Combine prop filters with local filters
  const combinedFilters: TransactionFilters = {
    ...filters,
    search,
    status: statusFilter !== 'all' ? statusFilter as TransactionStatusType : undefined,
  };

  const { data: transactions, isLoading, error } = useTransactions(combinedFilters);
  const markPaidMutation = useMarkTransactionPaid();
  const duplicateMutation = useDuplicateTransaction();
  const deleteMutation = useDeleteTransaction();

  const getNatureIcon = (tipo: string) => {
    if (tipo === 'ENTRADA') return <ArrowDownCircle className="w-5 h-5 text-income" />;
    return <ArrowUpCircle className="w-5 h-5 text-expense" />;
  };

  const handleMarkPaid = (transaction: TransactionWithClient) => {
    markPaidMutation.mutate({ transactionId: transaction.id });
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
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por descrição ou cliente..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
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
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">Tipo</th>
                  <th className="text-left p-4 text-sm font-medium">Descrição</th>
                  <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Cliente</th>
                  <th className="text-left p-4 text-sm font-medium hidden lg:table-cell">Natureza</th>
                  <th className="text-left p-4 text-sm font-medium hidden lg:table-cell">Vencimento</th>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-right p-4 text-sm font-medium">Valor</th>
                  <th className="text-center p-4 text-sm font-medium w-16">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions && transactions.length > 0 ? (
                  transactions.map(t => {
                    const status = statusConfig[t.status];
                    const StatusIcon = status.icon;
                    const natureza = naturezaLabels[t.natureza];
                    const NaturezaIcon = natureza.icon;
                    
                    return (
                      <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">{getNatureIcon(t.tipo_movimento)}</td>
                        <td className="p-4">
                          <p className="font-medium text-sm">{t.descricao || '-'}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.competencia_mes.toString().padStart(2, '0')}/{t.competencia_ano}
                          </p>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-sm">{t.recurring_clients?.name || '-'}</span>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <Badge variant="outline" className="text-xs">
                            <NaturezaIcon className="w-3 h-3 mr-1" />
                            {natureza.label}
                          </Badge>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <span className="text-sm">{formatDate(t.data_vencimento)}</span>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className={cn("text-xs", status.color)}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <span className={cn(
                            "font-semibold",
                            t.tipo_movimento === 'ENTRADA' && "text-income",
                            t.tipo_movimento === 'SAIDA' && "text-expense"
                          )}>
                            {formatCurrency(Number(t.valor))}
                          </span>
                          {t.valor_pago && t.status === 'PAGO' && Number(t.valor_pago) !== Number(t.valor) && (
                            <p className="text-xs text-muted-foreground">
                              Pago: {formatCurrency(Number(t.valor_pago))}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDuplicate(t)}>
                                <Copy className="w-4 h-4 mr-2" /> Duplicar
                              </DropdownMenuItem>
                              {t.status !== 'PAGO' && (
                                <DropdownMenuItem onClick={() => handleMarkPaid(t)}>
                                  <CheckCircle className="w-4 h-4 mr-2" /> Marcar Pago
                                </DropdownMenuItem>
                              )}
                              {t.tipo_movimento === 'ENTRADA' && t.status !== 'PAGO' && (
                                <DropdownMenuItem onClick={() => handleSendCollection(t)}>
                                  <Send className="w-4 h-4 mr-2" /> Enviar Cobrança
                                </DropdownMenuItem>
                              )}
                              {/* Only allow delete for manual/single transactions */}
                              {t.natureza === 'AVULSA' && (
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => confirmDelete(t)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Nenhuma transação encontrada para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
    </>
  );
}
