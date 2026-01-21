import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FixedExpenseRow {
  id: string;
  nome: string;
  valor: number;
  dia_vencimento: number;
  categoria_id: string | null;
  centro_custo_id: string | null;
  conta_id: string | null;
  forma_pagamento_id: string | null;
  data_inicio: string;
  data_fim: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch all active fixed expenses
export function useFixedExpenses() {
  return useQuery({
    queryKey: ['fixed_expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('active', true)
        .order('nome');

      if (error) throw error;
      return data as FixedExpenseRow[];
    },
  });
}

// Create fixed expense
export function useCreateFixedExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Partial<FixedExpenseRow>) => {
      const { data, error } = await supabase
        .from('fixed_expenses')
        .insert({
          nome: expense.nome!,
          valor: expense.valor!,
          dia_vencimento: expense.dia_vencimento!,
          categoria_id: expense.categoria_id,
          centro_custo_id: expense.centro_custo_id,
          conta_id: expense.conta_id,
          forma_pagamento_id: expense.forma_pagamento_id,
          data_inicio: expense.data_inicio || new Date().toISOString().split('T')[0],
          data_fim: expense.data_fim,
          notes: expense.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
      toast.success('Despesa fixa criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating fixed expense:', error);
      toast.error('Erro ao criar despesa fixa');
    },
  });
}

// Update fixed expense
export function useUpdateFixedExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FixedExpenseRow> & { id: string }) => {
      const { error } = await supabase
        .from('fixed_expenses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
      toast.success('Despesa fixa atualizada!');
    },
    onError: (error) => {
      console.error('Error updating fixed expense:', error);
      toast.error('Erro ao atualizar despesa fixa');
    },
  });
}

// Delete (deactivate) fixed expense
export function useDeleteFixedExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('fixed_expenses')
        .update({ active: false })
        .eq('id', expenseId);

      if (error) throw error;
      return expenseId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
      toast.success('Despesa fixa excluída!');
    },
    onError: (error) => {
      console.error('Error deleting fixed expense:', error);
      toast.error('Erro ao excluir despesa fixa');
    },
  });
}

// Generate monthly transactions from fixed expenses
export function useGenerateFixedExpenseTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      // Get all active fixed expenses
      const { data: expenses, error: fetchError } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('active', true);

      if (fetchError) throw fetchError;

      // Check which ones don't have transactions for this month yet
      const { data: existingTransactions } = await supabase
        .from('transactions')
        .select('fixed_expense_id')
        .eq('origem', 'DESPESA_FIXA')
        .eq('competencia_ano', year)
        .eq('competencia_mes', month);

      const existingExpenseIds = new Set(existingTransactions?.map(t => t.fixed_expense_id) || []);

      // Create transactions for expenses that don't have one yet
      const newTransactions = expenses
        ?.filter(e => !existingExpenseIds.has(e.id))
        .filter(e => {
          const startDate = new Date(e.data_inicio);
          const endDate = e.data_fim ? new Date(e.data_fim) : null;
          const checkDate = new Date(year, month - 1, 1);
          return startDate <= checkDate && (!endDate || endDate >= checkDate);
        })
        .map(e => {
          // Calculate due date for this month
          const lastDayOfMonth = new Date(year, month, 0).getDate();
          const dueDay = Math.min(e.dia_vencimento, lastDayOfMonth);
          const dueDate = new Date(year, month - 1, dueDay);

          return {
            tipo_movimento: 'SAIDA' as const,
            natureza: 'RECORRENTE' as const,
            origem: 'DESPESA_FIXA' as const,
            fixed_expense_id: e.id,
            competencia_mes: month,
            competencia_ano: year,
            valor: e.valor,
            data_vencimento: dueDate.toISOString().split('T')[0],
            status: 'EM_ABERTO' as const,
            descricao: `${e.nome} - ${month.toString().padStart(2, '0')}/${year}`,
            categoria_id: e.categoria_id,
            centro_custo_id: e.centro_custo_id,
            conta_id: e.conta_id,
            forma_pagamento_id: e.forma_pagamento_id,
          };
        });

      if (newTransactions && newTransactions.length > 0) {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert(newTransactions);

        if (insertError) throw insertError;
      }

      return newTransactions?.length || 0;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (count > 0) {
        toast.success(`${count} transações de despesas fixas geradas!`);
      } else {
        toast.info('Todas as despesas fixas já foram geradas para este mês.');
      }
    },
    onError: (error) => {
      console.error('Error generating fixed expense transactions:', error);
      toast.error('Erro ao gerar transações de despesas fixas');
    },
  });
}
