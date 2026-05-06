import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConvertInput {
  transaction_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  transfer_date: string; // YYYY-MM-DD
  notes?: string | null;
}

/**
 * Converts a planned expense transaction into an internal account transfer.
 * - Creates an account_transfer between origin and destination accounts.
 * - Deletes the original transaction (no DRE impact for internal moves).
 */
export function useConvertToTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ConvertInput) => {
      if (input.from_account_id === input.to_account_id) {
        throw new Error('Conta de origem e destino devem ser diferentes');
      }

      const { error: insErr } = await supabase.from('account_transfers').insert({
        from_account_id: input.from_account_id,
        to_account_id: input.to_account_id,
        amount: input.amount,
        transfer_date: input.transfer_date,
        notes: input.notes ?? 'Convertida de despesa planejada',
      });
      if (insErr) throw insErr;

      const { error: delErr } = await supabase
        .from('transactions')
        .delete()
        .eq('id', input.transaction_id);
      if (delErr) throw delErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account-detail'] });
      qc.invalidateQueries({ queryKey: ['account-annual-v2'] });
      qc.invalidateQueries({ queryKey: ['account-forecast'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['accounts-snapshot'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Convertida em transferência interna');
    },
    onError: (e: any) =>
      toast.error('Erro ao converter', { description: e.message }),
  });
}
