import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AccountsView } from '@/components/accounts/AccountsView';
import { TransactionsHub } from '@/components/transactions/TransactionsHub';
import { ClientsView } from '@/components/clients/ClientsView';
import { ImportExportView } from '@/components/import/ImportExportView';
import { ReportsView } from '@/components/reports/ReportsView';
import { RecurringContractsView } from '@/components/contracts/RecurringContractsView';
import { FinancialConfigView } from '@/components/config/FinancialConfigView';
import { OpenPaymentsView } from '@/components/open-payments/OpenPaymentsView';
import { BacklogView } from '@/components/backlog/BacklogView';
import { cn } from '@/lib/utils';

const tabConfig: Record<string, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral financeira' },
  accounts: { title: 'Contas', subtitle: 'Gestão de contas e saldos' },
  transactions: { title: 'Transações', subtitle: 'Lançamentos e movimentações' },
  'open-payments': { title: 'Pagamentos Em Aberto', subtitle: 'Controle de inadimplência e contas a pagar' },
  'recurring-contracts': { title: 'Contratos Recorrentes', subtitle: 'Gestão de contratos por salário mínimo' },
  reports: { title: 'Relatórios', subtitle: 'Análises, DRE e exportações' },
  clients: { title: 'Clientes', subtitle: 'Gerencie sua carteira' },
  backlog: { title: 'Backlog de Produto', subtitle: 'Planejamento e controle de melhorias' },
  config: { title: 'Configuração Financeira', subtitle: 'Estrutura do sistema financeiro' },
  import: { title: 'Importar / Exportar', subtitle: 'Dados em lote' },
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <AccountsView />;
      case 'transactions':
        return <TransactionsHub />;
      case 'open-payments':
        return <OpenPaymentsView />;
      case 'recurring-contracts':
        return <RecurringContractsView />;
      case 'reports':
        return <ReportsView />;
      case 'clients':
        return <ClientsView />;
      case 'backlog':
        return <BacklogView />;
      case 'config':
        return <FinancialConfigView />;
      case 'import':
        return <ImportExportView />;
      default:
        return <Dashboard />;
    }
  };

  const { title, subtitle } = tabConfig[activeTab] || tabConfig.dashboard;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className={cn(
        "transition-all duration-300",
        "pt-16 lg:pt-0",
        "lg:ml-64"
      )}>
        <Header title={title} subtitle={subtitle} />
        
        <div className="p-4 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
