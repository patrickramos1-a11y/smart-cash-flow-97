import { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  RefreshCw, 
  Zap,
  TrendingUp,
  AlertTriangle,
  FileText,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import { mockClients, mockTransactions, formatCurrency } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { ClientModal } from '@/components/modals/ClientModal';
import { Client } from '@/types/financial';
import { toast } from 'sonner';

export function ClientsView() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'RECORRENTE' | 'AVULSO'>('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  
  // Local clients state
  const [clients, setClients] = useState(mockClients);

  // Calculate client stats
  const clientStats = clients.map(client => {
    const clientTransactions = mockTransactions.filter(t => t.clientId === client.id);
    const revenue = clientTransactions
      .filter(t => t.nature === 'ENTRADA')
      .reduce((sum, t) => sum + t.value, 0);
    const pending = clientTransactions
      .filter(t => t.nature === 'ENTRADA' && t.status !== 'PAGO')
      .reduce((sum, t) => sum + t.value, 0);
    const overdue = clientTransactions
      .filter(t => t.nature === 'ENTRADA' && t.status === 'ATRASADO')
      .reduce((sum, t) => sum + t.value, 0);
    
    return {
      ...client,
      revenue,
      pending,
      overdue,
      transactionCount: clientTransactions.length
    };
  });

  const filteredClients = clientStats.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || client.type === filterType;
    return matchesSearch && matchesType;
  });

  const recurringCount = clients.filter(c => c.type === 'RECORRENTE').length;
  const avulsoCount = clients.filter(c => c.type === 'AVULSO').length;

  const openNewClient = () => {
    setEditingClient(undefined);
    setShowModal(true);
  };

  const openEditClient = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleSaveClient = (clientData: Partial<Client>) => {
    if (editingClient) {
      setClients(prev =>
        prev.map(c => c.id === editingClient.id ? { ...c, ...clientData } as Client : c)
      );
    } else {
      setClients(prev => [...prev, clientData as Client]);
    }
  };

  const handleViewContracts = (client: Client) => {
    toast.info(`Visualizando contratos de ${client.name}`);
    // TODO: Navigate to contracts view with client filter
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className={cn(
            "kpi-card cursor-pointer",
            filterType === 'all' && "ring-2 ring-primary"
          )}
          onClick={() => setFilterType('all')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
              <p className="text-2xl font-bold text-foreground">{clients.length}</p>
            </div>
          </div>
        </div>

        <div 
          className={cn(
            "kpi-card cursor-pointer",
            filterType === 'RECORRENTE' && "ring-2 ring-primary"
          )}
          onClick={() => setFilterType('RECORRENTE')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-info-muted flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recorrentes</p>
              <p className="text-2xl font-bold text-info">{recurringCount}</p>
            </div>
          </div>
        </div>

        <div 
          className={cn(
            "kpi-card cursor-pointer",
            filterType === 'AVULSO' && "ring-2 ring-primary"
          )}
          onClick={() => setFilterType('AVULSO')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning-muted flex items-center justify-center">
              <Zap className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avulsos</p>
              <p className="text-2xl font-bold text-warning">{avulsoCount}</p>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-expense-muted flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-expense" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Com Pendências</p>
              <p className="text-2xl font-bold text-expense">
                {clientStats.filter(c => c.pending > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10"
          />
        </div>
        <button className="btn-primary" onClick={openNewClient}>
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <div 
            key={client.id}
            className="bg-card rounded-xl border border-border/50 p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                  client.type === 'RECORRENTE' ? "bg-info" : "bg-warning"
                )}>
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{client.name}</h3>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    client.type === 'RECORRENTE' 
                      ? "bg-info-muted text-info" 
                      : "bg-warning-muted text-warning"
                  )}>
                    {client.type === 'RECORRENTE' ? 'Recorrente' : 'Avulso'}
                  </span>
                </div>
              </div>
              <button 
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                onClick={() => openEditClient(client)}
              >
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Revenue */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Receita Total
                </span>
                <span className="font-semibold text-income">{formatCurrency(client.revenue)}</span>
              </div>

              {/* Pending */}
              {client.pending > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Em Aberto
                  </span>
                  <span className="font-semibold text-warning">{formatCurrency(client.pending)}</span>
                </div>
              )}

              {/* Overdue */}
              {client.overdue > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-expense" />
                    Atrasado
                  </span>
                  <span className="font-semibold text-expense">{formatCurrency(client.overdue)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
              <button 
                className="btn-ghost flex-1 text-sm"
                onClick={() => handleViewContracts(client)}
              >
                <FileText className="w-4 h-4" />
                Contratos
              </button>
              <button 
                className="btn-secondary flex-1 text-sm"
                onClick={() => openEditClient(client)}
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Client Modal */}
      <ClientModal
        open={showModal}
        onClose={() => setShowModal(false)}
        client={editingClient}
        onSave={handleSaveClient}
      />
    </div>
  );
}
