import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, ArrowUpCircle, ArrowDownCircle, 
  ArrowLeftRight, MoreVertical, CheckCircle, Clock, AlertTriangle,
  Send, Copy, Pencil, Trash2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { mockTransactions, formatCurrency, formatDate } from '@/data/mockData';
import { Transaction, TransactionStatus } from '@/types/financial';
import { cn } from '@/lib/utils';
import { TransactionModal } from '@/components/modals/TransactionModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { toast } from 'sonner';

const statusConfig: Record<TransactionStatus, { label: string; color: string; icon: React.ComponentType<{className?: string}> }> = {
  PAGO: { label: 'Pago', color: 'bg-income/10 text-income border-income/20', icon: CheckCircle },
  EM_ABERTO: { label: 'Em Aberto', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  ATRASADO: { label: 'Atrasado', color: 'bg-expense/10 text-expense border-expense/20', icon: AlertTriangle },
};

export function TransactionsView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [natureFilter, setNatureFilter] = useState<string>('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA'>('ENTRADA');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  
  // Local transactions state (simulating database)
  const [transactions, setTransactions] = useState(mockTransactions);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      t.categoryName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesNature = natureFilter === 'all' || 
      (natureFilter === 'ENTRADA' && t.nature === 'ENTRADA') ||
      (natureFilter === 'SAIDA' && t.nature === 'SAIDA') ||
      (natureFilter === 'TRANSFERENCIA' && t.nature.startsWith('TRANSFERENCIA'));
    return matchesSearch && matchesStatus && matchesNature;
  });

  const getNatureIcon = (nature: string) => {
    if (nature === 'ENTRADA') return <ArrowDownCircle className="w-5 h-5 text-income" />;
    if (nature === 'SAIDA') return <ArrowUpCircle className="w-5 h-5 text-expense" />;
    return <ArrowLeftRight className="w-5 h-5 text-info" />;
  };

  const openNewTransaction = (type: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA') => {
    setModalType(type);
    setEditingTransaction(undefined);
    setShowModal(true);
  };

  const openEditTransaction = (transaction: Transaction) => {
    setModalType(transaction.nature as 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA');
    setEditingTransaction(transaction);
    setShowModal(true);
  };

  const handleSaveTransaction = (transactionData: Partial<Transaction>) => {
    if (editingTransaction) {
      // Update existing
      setTransactions(prev => 
        prev.map(t => t.id === editingTransaction.id ? { ...t, ...transactionData } as Transaction : t)
      );
    } else {
      // Add new
      setTransactions(prev => [...prev, transactionData as Transaction]);
    }
  };

  const handleDuplicate = (transaction: Transaction) => {
    const duplicate = {
      ...transaction,
      id: `trx_${Date.now()}`,
      description: `${transaction.description} (Cópia)`,
      isPaid: false,
      status: 'EM_ABERTO' as TransactionStatus,
      paymentDate: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTransactions(prev => [...prev, duplicate]);
    toast.success('Transação duplicada!');
  };

  const handleMarkPaid = (transaction: Transaction) => {
    setTransactions(prev =>
      prev.map(t => t.id === transaction.id ? {
        ...t,
        isPaid: true,
        status: 'PAGO' as TransactionStatus,
        paymentDate: new Date(),
        updatedAt: new Date(),
      } : t)
    );
    toast.success('Transação marcada como paga!');
  };

  const handleSendCollection = (transaction: Transaction) => {
    toast.success(`Cobrança enviada para ${transaction.clientName || 'cliente'}!`);
  };

  const handleDelete = () => {
    if (deletingTransaction) {
      setTransactions(prev => prev.filter(t => t.id !== deletingTransaction.id));
      toast.success('Transação excluída!');
      setDeletingTransaction(null);
    }
  };

  const confirmDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button 
            className="bg-income hover:bg-income/90"
            onClick={() => openNewTransaction('ENTRADA')}
          >
            <ArrowDownCircle className="w-4 h-4 mr-2" /> Nova Entrada
          </Button>
          <Button 
            className="bg-expense hover:bg-expense/90"
            onClick={() => openNewTransaction('SAIDA')}
          >
            <ArrowUpCircle className="w-4 h-4 mr-2" /> Nova Saída
          </Button>
          <Button 
            variant="outline"
            onClick={() => openNewTransaction('TRANSFERENCIA')}
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" /> Transferência
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full lg:w-64"
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
          <Select value={natureFilter} onValueChange={setNatureFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Natureza" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="ENTRADA">Entradas</SelectItem>
              <SelectItem value="SAIDA">Saídas</SelectItem>
              <SelectItem value="TRANSFERENCIA">Transferências</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">Tipo</th>
                  <th className="text-left p-4 text-sm font-medium">Descrição</th>
                  <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Cliente</th>
                  <th className="text-left p-4 text-sm font-medium hidden lg:table-cell">Categoria</th>
                  <th className="text-left p-4 text-sm font-medium hidden lg:table-cell">Vencimento</th>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-right p-4 text-sm font-medium">Valor</th>
                  <th className="text-center p-4 text-sm font-medium w-16">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTransactions.map(t => {
                  const status = statusConfig[t.status];
                  const StatusIcon = status.icon;
                  return (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">{getNatureIcon(t.nature)}</td>
                      <td className="p-4">
                        <p className="font-medium text-sm">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{t.accountName}</p>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-sm">{t.clientName || '-'}</span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-sm">{t.categoryName}</span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-sm">
                          {t.dueDate ? formatDate(new Date(t.dueDate)) : '-'}
                        </span>
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
                          t.nature === 'ENTRADA' && "text-income",
                          t.nature === 'SAIDA' && "text-expense",
                          t.nature.startsWith('TRANSFERENCIA') && "text-info"
                        )}>
                          {formatCurrency(t.value)}
                        </span>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditTransaction(t)}>
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(t)}>
                              <Copy className="w-4 h-4 mr-2" /> Duplicar
                            </DropdownMenuItem>
                            {!t.isPaid && (
                              <DropdownMenuItem onClick={() => handleMarkPaid(t)}>
                                <CheckCircle className="w-4 h-4 mr-2" /> Marcar Pago
                              </DropdownMenuItem>
                            )}
                            {t.nature === 'ENTRADA' && !t.isPaid && (
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <TransactionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        type={modalType}
        transaction={editingTransaction}
        onSave={handleSaveTransaction}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Transação"
        message={`Tem certeza que deseja excluir "${deletingTransaction?.description}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        type="danger"
      />
    </div>
  );
}
