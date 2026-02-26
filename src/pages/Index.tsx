import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AccountsView } from '@/components/accounts/AccountsView';
import { TransactionsHub } from '@/components/transactions/TransactionsHub';
import { EntradasRecorrentesPage } from '@/components/transactions/EntradasRecorrentesPage';
import { EntradasAvulsasPage } from '@/components/transactions/EntradasAvulsasPage';
import { DespesasFixasPage } from '@/components/transactions/DespesasFixasPage';
import { DespesasVariaveisPage } from '@/components/transactions/DespesasVariaveisPage';
import { ClientsView } from '@/components/clients/ClientsView';
import { EntitiesView } from '@/components/entities/EntitiesView';
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
  'entradas-recorrentes': { title: 'Entradas Recorrentes', subtitle: 'Receita de contratos mensais' },
  'entradas-avulsas': { title: 'Entradas Avulsas', subtitle: 'Receitas pontuais e serviços' },
  'despesas-fixas': { title: 'Despesas Fixas', subtitle: 'Custos recorrentes mensais' },
  'despesas-variaveis': { title: 'Despesas Variáveis', subtitle: 'Gastos pontuais e variáveis' },
  'open-payments': { title: 'Em Aberto', subtitle: 'Controle de inadimplência' },
  'recurring-contracts': { title: 'Contratos', subtitle: 'Gestão por salário mínimo' },
  reports: { title: 'Relatórios', subtitle: 'Análises e DRE' },
  clients: { title: 'Clientes', subtitle: 'Gerencie sua carteira' },
  entities: { title: 'Entidades', subtitle: 'Pessoas, fornecedores e grupos' },
  backlog: { title: 'Backlog', subtitle: 'Melhorias do produto' },
  config: { title: 'Configuração', subtitle: 'Estrutura financeira' },
  import: { title: 'Importar', subtitle: 'Dados em lote' },
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <AccountsView />;
      case 'transactions':
        return <TransactionsHub />;
      case 'entradas-recorrentes':
        return <EntradasRecorrentesPage />;
      case 'entradas-avulsas':
        return <EntradasAvulsasPage />;
      case 'despesas-fixas':
        return <DespesasFixasPage />;
      case 'despesas-variaveis':
        return <DespesasVariaveisPage />;
      case 'open-payments':
        return <OpenPaymentsView />;
      case 'recurring-contracts':
        return <RecurringContractsView />;
      case 'reports':
        return <ReportsView />;
      case 'clients':
        return <ClientsView />;
      case 'entities':
        return <EntitiesView />;
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
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      
      <main className={cn(
        "transition-all duration-300",
        "pt-14 lg:pt-0",
        "pb-16 lg:pb-0",
        "lg:ml-64"
      )}>
        <Header title={title} subtitle={subtitle} />
        
        <div className="p-3 lg:p-8">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onMenuOpen={() => setMobileMenuOpen(true)}
      />
    </div>
  );
};

export default Index;
