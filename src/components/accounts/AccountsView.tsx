import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type Account } from '@/hooks/useFinancialConfig';
import { AccountsOverviewTab } from './AccountsOverviewTab';
import { AccountsCompositionTab } from './AccountsCompositionTab';
import { AccountsTransfersTab } from './AccountsTransfersTab';
import { AccountsHealthTab } from './AccountsHealthTab';
import { AccountModal } from './AccountModal';
import { TransferModal } from './TransferModal';

export function AccountsView() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentMonth);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  const handleNew = () => { setEditingAccount(null); setAccountModalOpen(true); };
  const handleEdit = (a: Account) => { setEditingAccount(a); setAccountModalOpen(true); };
  const handleTransfer = () => { setTransferModalOpen(true); };
  const handleViewDetails = (id: string) => { setSelectedAccountId(id); setActiveTab('composition'); };

  return (
    <div className="space-y-3 lg:space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto -mx-3 px-3 lg:mx-0 lg:px-0">
          <TabsList className="inline-flex w-auto min-w-full lg:min-w-0 h-9">
            <TabsTrigger value="overview" className="text-xs lg:text-sm">Visão Geral</TabsTrigger>
            <TabsTrigger value="composition" className="text-xs lg:text-sm">Composição</TabsTrigger>
            <TabsTrigger value="transfers" className="text-xs lg:text-sm">Transferências</TabsTrigger>
            <TabsTrigger value="health" className="text-xs lg:text-sm">Saúde</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <AccountsOverviewTab
            selectedAccountId={selectedAccountId}
            setSelectedAccountId={setSelectedAccountId}
            year={selectedYear}
            month={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            onNewAccount={handleNew}
            onEditAccount={handleEdit}
            onTransfer={handleTransfer}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="composition" className="mt-4">
          <AccountsCompositionTab selectedAccountId={selectedAccountId} selectedYear={selectedYear} />
        </TabsContent>

        <TabsContent value="transfers" className="mt-4">
          <AccountsTransfersTab selectedYear={selectedYear} />
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <AccountsHealthTab />
        </TabsContent>
      </Tabs>

      <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} account={editingAccount} />
      <TransferModal open={transferModalOpen} onClose={() => setTransferModalOpen(false)} />
    </div>
  );
}
