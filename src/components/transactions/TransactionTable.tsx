import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreHorizontal,
  Edit,
  Copy,
  Paperclip,
  CheckCircle,
  Send,
  History,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { Transaction } from '@/types/financial';
import { formatCurrency, formatDate, mockTransactions } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface TransactionTableProps {
  filterNature?: 'ENTRADA' | 'SAIDA';
  title?: string;
}

export function TransactionTable({ filterNature, title = 'Lançamentos' }: TransactionTableProps) {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const transactions = filterNature 
    ? mockTransactions.filter(t => t.nature === filterNature)
    : mockTransactions;

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAGO':
        return <span className="status-badge status-paid">Pago</span>;
      case 'EM_ABERTO':
        return <span className="status-badge status-pending">Em Aberto</span>;
      case 'ATRASADO':
        return <span className="status-badge status-overdue">Atrasado</span>;
      default:
        return null;
    }
  };

  const getNatureBadge = (nature: string) => {
    if (nature === 'ENTRADA') {
      return (
        <span className="inline-flex items-center gap-1 text-income">
          <ArrowUpCircle className="w-4 h-4" />
          Entrada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-expense">
        <ArrowDownCircle className="w-4 h-4" />
        Saída
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por descrição, cliente ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSelectedStatus('all')}
            className={cn('filter-pill', selectedStatus === 'all' && 'active')}
          >
            Todos
          </button>
          <button 
            onClick={() => setSelectedStatus('PAGO')}
            className={cn('filter-pill', selectedStatus === 'PAGO' && 'active')}
          >
            Pagos
          </button>
          <button 
            onClick={() => setSelectedStatus('EM_ABERTO')}
            className={cn('filter-pill', selectedStatus === 'EM_ABERTO' && 'active')}
          >
            Em Aberto
          </button>
          <button 
            onClick={() => setSelectedStatus('ATRASADO')}
            className={cn('filter-pill', selectedStatus === 'ATRASADO' && 'active')}
          >
            Atrasados
          </button>
        </div>

        <button className="btn-ghost">
          <Filter className="w-4 h-4" />
          Mais Filtros
        </button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Competência</th>
                <th>Cliente</th>
                <th>Natureza</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Vencimento</th>
                <th>Doc</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="whitespace-nowrap">
                    {transaction.paymentDate ? formatDate(transaction.paymentDate) : '-'}
                  </td>
                  <td className="whitespace-nowrap text-muted-foreground">
                    {transaction.competenceMonth?.toString().padStart(2, '0')}/{transaction.competenceYear}
                  </td>
                  <td className="font-medium">{transaction.clientName || '-'}</td>
                  <td>{getNatureBadge(transaction.nature)}</td>
                  <td className="text-muted-foreground">{transaction.category}</td>
                  <td className="max-w-[200px] truncate" title={transaction.description}>
                    {transaction.description}
                  </td>
                  <td className={cn(
                    "font-semibold whitespace-nowrap",
                    transaction.nature === 'ENTRADA' ? 'text-income' : 'text-expense'
                  )}>
                    {transaction.nature === 'SAIDA' ? '-' : ''}{formatCurrency(transaction.value)}
                  </td>
                  <td>{getStatusBadge(transaction.status)}</td>
                  <td className="whitespace-nowrap text-muted-foreground">
                    {transaction.dueDate ? formatDate(transaction.dueDate) : '-'}
                  </td>
                  <td>
                    <span className={cn(
                      "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium",
                      transaction.documentType === 'NF' && "bg-info-muted text-info",
                      transaction.documentType === 'RECIBO' && "bg-warning-muted text-warning",
                      transaction.documentType === 'NOTA_DEBITO' && "bg-expense-muted text-expense",
                      transaction.documentType === 'SEM_DOCUMENTO' && "bg-muted text-muted-foreground"
                    )}>
                      {transaction.documentType === 'NF' && 'NF'}
                      {transaction.documentType === 'RECIBO' && 'RC'}
                      {transaction.documentType === 'NOTA_DEBITO' && 'ND'}
                      {transaction.documentType === 'SEM_DOCUMENTO' && '-'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Editar">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Duplicar">
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {transaction.status !== 'PAGO' && (
                        <button className="p-1.5 rounded-lg hover:bg-income-muted transition-colors" title="Marcar como pago">
                          <CheckCircle className="w-4 h-4 text-income" />
                        </button>
                      )}
                      {transaction.nature === 'ENTRADA' && transaction.status !== 'PAGO' && (
                        <button className="p-1.5 rounded-lg hover:bg-info-muted transition-colors" title="Enviar cobrança">
                          <Send className="w-4 h-4 text-info" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Exibindo {filteredTransactions.length} de {transactions.length} lançamentos
          </p>
          <div className="flex items-center gap-2">
            <button className="btn-ghost text-sm">Anterior</button>
            <button className="btn-ghost text-sm bg-primary text-primary-foreground">1</button>
            <button className="btn-ghost text-sm">2</button>
            <button className="btn-ghost text-sm">3</button>
            <button className="btn-ghost text-sm">Próximo</button>
          </div>
        </div>
      </div>
    </div>
  );
}
