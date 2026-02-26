import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TransactionEntityRow {
  id: string;
  transaction_id: string | null;
  fixed_expense_id: string | null;
  entity_id: string;
  created_at: string;
}

export function useTransactionEntities(transactionId?: string) {
  return useQuery({
    queryKey: ['transaction-entities', transactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_entities')
        .select('*, financial_entities(*)')
        .eq('transaction_id', transactionId!);
      if (error) throw error;
      return data;
    },
    enabled: !!transactionId,
  });
}

export function useFixedExpenseEntities(fixedExpenseId?: string) {
  return useQuery({
    queryKey: ['fixed-expense-entities', fixedExpenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_entities')
        .select('*, financial_entities(*)')
        .eq('fixed_expense_id', fixedExpenseId!);
      if (error) throw error;
      return data;
    },
    enabled: !!fixedExpenseId,
  });
}

export function useSaveTransactionEntities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      fixedExpenseId,
      entityIds,
    }: {
      transactionId?: string;
      fixedExpenseId?: string;
      entityIds: string[];
    }) => {
      // Delete existing
      if (transactionId) {
        await supabase
          .from('transaction_entities')
          .delete()
          .eq('transaction_id', transactionId);
      }
      if (fixedExpenseId) {
        await supabase
          .from('transaction_entities')
          .delete()
          .eq('fixed_expense_id', fixedExpenseId);
      }

      // Insert new
      if (entityIds.length > 0) {
        const rows = entityIds.map(entity_id => ({
          transaction_id: transactionId || null,
          fixed_expense_id: fixedExpenseId || null,
          entity_id,
        }));

        const { error } = await supabase
          .from('transaction_entities')
          .insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-entities'] });
      queryClient.invalidateQueries({ queryKey: ['fixed-expense-entities'] });
    },
  });
}
