import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { Account } from '@/hooks/useFinancialConfig';
import { useAccountsSnapshot } from '@/hooks/useAccountsSnapshot';
import { AccountDetailView } from './AccountDetailView';

interface Props {
  open: boolean;
  onClose: () => void;
  account: Account | null;
  year: number;
  month: number;
}

export function AccountDetailDrawer({ open, onClose, account, year: initialYear, month: initialMonth }: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const { data: snapshots } = useAccountsSnapshot(year, month);

  if (!account) return null;
  const snapshot = snapshots?.[account.id];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-5xl overflow-y-auto p-4 sm:p-6">
        <AccountDetailView
          account={account}
          snapshot={snapshot}
          year={year}
          month={month}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />
      </SheetContent>
    </Sheet>
  );
}
