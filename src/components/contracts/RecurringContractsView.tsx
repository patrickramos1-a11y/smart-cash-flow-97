import { useState, useMemo } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Settings2,
  Trash2
} from 'lucide-react';
import { 
  useRecurringContracts, 
  useRecurringInstallments, 
  useRecurringKPIs,
  useMarkInstallmentPaid,
  useCancelContract,
  RecurringInstallment
} from '@/hooks/useRecurringContracts';
import { formatCurrency } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { MinimumWageConfigModal } from './MinimumWageConfigModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { toast } from 'sonner';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface RecurringContractsViewProps {
  activeSection?: string;
}

export function RecurringContractsView({ activeSection }: RecurringContractsViewProps) {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ contractId: string; clientName: string } | null>(null);
  const { kpis, isLoading: loadingKPIs } = useRecurringKPIs(selectedYear);
  const { data: contracts, isLoading: loadingContracts } = useRecurringContracts();
  const { data: installments, isLoading: loadingInstallments } = useRecurringInstallments({
    year: selectedYear,
    month: selectedMonth || undefined,
    status: statusFilter || undefined,
  });
  const markPaidMutation = useMarkInstallmentPaid();
  const cancelContract = useCancelContract();

  const isLoading = loadingKPIs || loadingContracts || loadingInstallments;

  // Group installments by client
  const installmentsByClient = useMemo(() => {
    if (!installments) return {};
    
    return installments.reduce((acc, inst) => {
      const clientId = inst.contract?.client_id || 'unknown';
      if (!acc[clientId]) {
        acc[clientId] = {
          client: inst.contract?.client,
          contract: inst.contract,
          installments: [],
        };
      }
      acc[clientId].installments.push(inst);
      return acc;
    }, {} as Record<string, { 
      client: any; 
      contract: any; 
      installments: RecurringInstallment[];
    }>);
  }, [installments]);

  const handleMarkPaid = async (installment: RecurringInstallment) => {
    try {
      await markPaidMutation.mutateAsync({
        installmentId: installment.id,
        paidValue: Number(installment.expected_value),
      });
      toast.success('Pagamento registrado com sucesso!');
    } catch (error) {
      toast.error('Erro ao registrar pagamento');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAGO':
        return <span className="status-badge status-paid"><CheckCircle2 className="w-3 h-3" /> Pago</span>;
      case 'ATRASADO':
        return <span className="status-badge status-overdue"><AlertCircle className="w-3 h-3" /> Atrasado</span>;
      default:
        return <span className="status-badge status-pending"><Calendar className="w-3 h-3" /> Em Aberto</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="form-input w-32"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <span className="text-sm text-muted-foreground">
            SM: {formatCurrency(kpis.minimumWageValue)}
          </span>
        </div>
        <button 
          onClick={() => setShowConfigModal(true)}
          className="btn-secondary"
        >
          <Settings2 className="w-4 h-4" />
          Configurar SM
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card kpi-card-info">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-info-muted flex items-center justify-center">
              <Users className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clientes Recorrentes</p>
              <p className="text-2xl font-bold text-foreground">{kpis.totalClients}</p>
            </div>
          </div>
        </div>

        <div className="kpi-card kpi-card-income">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-income-muted flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-income" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total SM/mês</p>
              <p className="text-2xl font-bold text-foreground">{kpis.totalMinimumWagesMonthly.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(kpis.expectedValueMonthly)}/mês</p>
            </div>
          </div>
        </div>

        <div className="kpi-card kpi-card-income">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-income-muted flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-income" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Esperado Anual</p>
              <p className="text-2xl font-bold text-income">{formatCurrency(kpis.expectedValueYearly)}</p>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Status Financeiro</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-income">Pago</span>
                <span className="font-semibold">{formatCurrency(kpis.paidValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-warning">Em Aberto</span>
                <span className="font-semibold">{formatCurrency(kpis.openValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-expense">Atrasado</span>
                <span className="font-semibold">{formatCurrency(kpis.overdueValue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Clients Alert */}
      {kpis.overdueClients.length > 0 && (
        <div className="bg-expense-muted border border-expense/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-expense" />
            <span className="font-semibold text-expense">Clientes Inadimplentes ({kpis.overdueClients.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {kpis.overdueClients.slice(0, 6).map((client, idx) => (
              <div key={idx} className="flex justify-between text-sm bg-card rounded-lg p-2">
                <span className="truncate">{client.clientName}</span>
                <span className="text-expense font-medium">{MONTHS[client.month - 1]} - {formatCurrency(client.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => setSelectedMonth(null)}
          className={cn("filter-pill", !selectedMonth && "active")}
        >
          Todos os meses
        </button>
        {MONTHS.map((month, idx) => (
          <button
            key={month}
            onClick={() => setSelectedMonth(idx + 1)}
            className={cn("filter-pill", selectedMonth === idx + 1 && "active")}
          >
            {month}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setStatusFilter(null)}
          className={cn("filter-pill", !statusFilter && "active")}
        >
          Todos
        </button>
        <button
          onClick={() => setStatusFilter('PAGO')}
          className={cn("filter-pill", statusFilter === 'PAGO' && "active")}
        >
          <CheckCircle2 className="w-3 h-3" /> Pagos
        </button>
        <button
          onClick={() => setStatusFilter('EM_ABERTO')}
          className={cn("filter-pill", statusFilter === 'EM_ABERTO' && "active")}
        >
          <Calendar className="w-3 h-3" /> Em Aberto
        </button>
        <button
          onClick={() => setStatusFilter('ATRASADO')}
          className={cn("filter-pill", statusFilter === 'ATRASADO' && "active")}
        >
          <AlertCircle className="w-3 h-3" /> Atrasados
        </button>
      </div>

      {/* Contracts List */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th>Cliente</th>
                <th>Plano</th>
                <th className="text-center">Fator SM</th>
                <th className="text-right">Valor Mensal</th>
                <th className="text-center">Competência</th>
                <th className="text-center">Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(installmentsByClient).map(([clientId, data]) => (
                <>
                  {data.installments.map((inst, idx) => (
                    <tr key={inst.id} className="hover:bg-muted/30">
                      <td>
                        {idx === 0 && data.installments.length > 1 && (
                          <button
                            onClick={() => setExpandedClient(expandedClient === clientId ? null : clientId)}
                            className="p-1 rounded hover:bg-muted"
                          >
                            {expandedClient === clientId ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="font-medium">{data.client?.name || 'N/A'}</td>
                      <td>
                        <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                          {data.contract?.plan?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="text-center">
                        {(data.contract?.custom_minimum_wage_factor || data.contract?.plan?.minimum_wage_factor || 0).toFixed(2)}
                      </td>
                      <td className="text-right font-medium">{formatCurrency(Number(inst.expected_value))}</td>
                      <td className="text-center">
                        {MONTHS[inst.competence_month - 1]}/{inst.competence_year}
                      </td>
                      <td className="text-center">{getStatusBadge(inst.status)}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {inst.status !== 'PAGO' && (
                            <button
                              onClick={() => handleMarkPaid(inst)}
                              disabled={markPaidMutation.isPending}
                              className="btn-primary text-xs py-1 px-2"
                            >
                              Marcar Pago
                            </button>
                          )}
                          {idx === 0 && (
                            <button
                              onClick={() => setCancelTarget({ contractId: data.contract?.id, clientName: data.client?.name || 'N/A' })}
                              className="p-1.5 rounded hover:bg-expense/10 text-muted-foreground hover:text-expense transition-colors"
                              title="Cancelar contrato"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config Modal */}
      <MinimumWageConfigModal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />

      {/* Cancel Contract Confirm */}
      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={async () => {
          if (cancelTarget) {
            await cancelContract.mutateAsync({ contractId: cancelTarget.contractId, deleteTransactions: true });
            setCancelTarget(null);
          }
        }}
        title="Cancelar Contrato"
        message={`Deseja cancelar o contrato de "${cancelTarget?.clientName}"? Todas as parcelas em aberto e suas transações serão removidas. Parcelas já pagas serão mantidas.`}
        confirmText="Sim, cancelar contrato"
        type="danger"
      />
    </div>
  );
}
