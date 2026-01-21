import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AccountsView } from '@/components/accounts/AccountsView';
import { TransactionsHub } from '@/components/transactions/TransactionsHub';
import { ClientsView } from '@/components/clients/ClientsView';
import { ImportExportView } from '@/components/import/ImportExportView';
import { ReportsView } from '@/components/reports/ReportsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { RecurringContractsView } from '@/components/contracts/RecurringContractsView';
import { cn } from '@/lib/utils';

const tabConfig: Record<string, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral financeira' },
  accounts: { title: 'Contas', subtitle: 'Gestão de contas e saldos' },
  transactions: { title: 'Transações', subtitle: 'Lançamentos e movimentações' },
  'recurring-contracts': { title: 'Contratos Recorrentes', subtitle: 'Gestão de contratos por salário mínimo' },
  reports: { title: 'Relatórios', subtitle: 'Análises e exportações' },
  clients: { title: 'Clientes & Contratos', subtitle: 'Gerencie sua carteira' },
  import: { title: 'Importar / Exportar', subtitle: 'Dados em lote' },
  'settings-companies': { title: 'Empresas Financeiras', subtitle: 'Cadastro de empresas' },
  'settings-accounts': { title: 'Contas', subtitle: 'Cadastro de contas bancárias' },
  'settings-account-categories': { title: 'Categorias de Conta', subtitle: 'Agrupadores de saldo' },
  'settings-categories': { title: 'Categorias de Transação', subtitle: 'Natureza do gasto/receita' },
  'settings-cost-centers': { title: 'Centros de Custo', subtitle: 'Estrutura DRE' },
  'settings-payment-methods': { title: 'Formas de Pagamento', subtitle: 'Métodos aceitos' },
  'settings-sources': { title: 'Fontes Financeiras', subtitle: 'Origens de recursos' },
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <AccountsView />;
      case 'transactions':
        return <TransactionsHub />;
      case 'recurring-contracts':
        return <RecurringContractsView />;
      case 'reports':
        return <ReportsView />;
      case 'clients':
        return <ClientsView />;
      case 'import':
        return <ImportExportView />;
      default:
        if (activeTab.startsWith('settings')) {
          return <SettingsView activeSection={activeTab} />;
        }
        return <Dashboard />;
    }
  };

  const { title, subtitle } = tabConfig[activeTab] || tabConfig.dashboard;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className={cn(
        "transition-all duration-300",
        "pt-16 lg:pt-0", // Mobile header offset
        "lg:ml-64" // Desktop sidebar offset
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
