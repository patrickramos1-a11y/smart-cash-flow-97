import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { IncomeView } from '@/components/transactions/IncomeView';
import { ExpenseView } from '@/components/transactions/ExpenseView';
import { ClientsView } from '@/components/clients/ClientsView';
import { ImportView } from '@/components/import/ImportView';
import { ReportsView } from '@/components/reports/ReportsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { cn } from '@/lib/utils';

const tabConfig: Record<string, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral financeira' },
  transactions: { title: 'Lançamentos', subtitle: 'Gerencie todas as movimentações' },
  income: { title: 'Entradas', subtitle: 'Receitas e recebimentos' },
  expenses: { title: 'Despesas', subtitle: 'Custos e pagamentos' },
  clients: { title: 'Clientes & Contratos', subtitle: 'Gerencie sua carteira' },
  reports: { title: 'Relatórios', subtitle: 'Análises e exportações' },
  import: { title: 'Importar XLSX', subtitle: 'Importe dados do Excel' },
  settings: { title: 'Configurações', subtitle: 'Personalize o módulo financeiro' },
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <TransactionTable />;
      case 'income':
        return <IncomeView />;
      case 'expenses':
        return <ExpenseView />;
      case 'clients':
        return <ClientsView />;
      case 'reports':
        return <ReportsView />;
      case 'import':
        return <ImportView />;
      case 'settings':
        return <SettingsView />;
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
        "ml-64" // Sidebar width
      )}>
        <Header title={title} subtitle={subtitle} />
        
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
