import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Type definitions for the new transactions table
export type TransactionTipoMovimento = 'ENTRADA' | 'SAIDA';
export type TransactionNatureza = 'RECORRENTE' | 'AVULSA';
export type TransactionOrigem = 'CONTRATO_RECORRENTE' | 'DESPESA_FIXA' | 'LANCAMENTO_MANUAL' | 'IMPORTACAO';
export type TransactionStatusType = 'EM_ABERTO' | 'PAGO' | 'ATRASADO';
export type DocumentoTipo = 'NF' | 'RECIBO' | 'NOTA_DEBITO' | 'SEM_DOCUMENTO';
export type HistoryEvento = 'CRIADO' | 'MARCADO_PAGO' | 'ESTORNADO' | 'ALTERADO';

export interface TransactionRow {
  id: string;
  tipo_movimento: TransactionTipoMovimento;
  natureza: TransactionNatureza;
  origem: TransactionOrigem;
  cliente_id: string | null;
  contrato_id: string | null;
  installment_id: string | null;
  fixed_expense_id: string | null;
  competencia_mes: number;
  competencia_ano: number;
  valor: number;
  valor_pago: number | null;
  data_vencimento: string;
  data_pagamento: string | null;
  status: TransactionStatusType;
  descricao: string | null;
  categoria_id: string | null;
  centro_custo_id: string | null;
  conta_id: string | null;
  forma_pagamento_id: string | null;
  documento_tipo: DocumentoTipo | null;
  documento_numero: string | null;
  notes: string | null;
  entity_id: string | null;
  // New fiscal fields
  origem_receita: string | null;
  documento_recebimento: string | null;
  responsavel_id: string | null;
  nf_percentual_aplicado: number | null;
  valor_imposto_nf: number | null;
  valor_liquido_nf: number | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithClient extends TransactionRow {
  recurring_clients?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  recurring_contracts?: {
    id: string;
    plan_id: string | null;
    contract_plans?: {
      id: string;
      name: string;
      minimum_wage_factor: number;
    } | null;
  } | null;
  // Resolved names from JOINs
  category_name?: string | null;
  category_color?: string | null;
  account_name?: string | null;
  cost_center_name?: string | null;
  entity_name?: string | null;
  responsible_name?: string | null;
  // Expense type info
  expense_type?: string | null;
  category_subtype?: string | null;
}

export interface TransactionFilters {
  tipo_movimento?: TransactionTipoMovimento;
  natureza?: TransactionNatureza;
  origem?: TransactionOrigem;
  status?: TransactionStatusType;
  cliente_id?: string;
  competencia_mes?: number;
  competencia_ano?: number;
  search?: string;
}

export interface TransactionKPIs {
  totalEsperado: number;
  totalPago: number;
  totalEmAberto: number;
  totalAtrasado: number;
  quantidadeTotal: number;
  quantidadePago: number;
  quantidadeEmAberto: number;
  quantidadeAtrasado: number;
}

// Fetch transactions with filters
export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          recurring_clients (
            id,
            name,
            email,
            phone
          ),
          recurring_contracts (
            id,
            plan_id,
            contract_plans (
              id,
              name,
              minimum_wage_factor
            )
          ),
          transaction_categories:transaction_category_id (
            id,
            name,
            color,
            expense_type,
            subtype
          ),
          accounts:account_id (
            id,
            name
          ),
          cost_centers:cost_center_id (
            id,
            name
          ),
          entity:financial_entities!transactions_entity_id_fkey (
            id,
            name
          ),
          responsible:financial_entities!transactions_responsavel_id_fkey (
            id,
            name
          )
        `)
        .order('data_vencimento', { ascending: false });

      // Apply filters
      if (filters.tipo_movimento) {
        query = query.eq('tipo_movimento', filters.tipo_movimento);
      }
      if (filters.natureza) {
        query = query.eq('natureza', filters.natureza);
      }
      if (filters.origem) {
        query = query.eq('origem', filters.origem);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.cliente_id) {
        query = query.eq('cliente_id', filters.cliente_id);
      }
      if (filters.competencia_mes) {
        query = query.eq('competencia_mes', filters.competencia_mes);
      }
      if (filters.competencia_ano) {
        query = query.eq('competencia_ano', filters.competencia_ano);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Apply text search filter client-side
      let results = data as TransactionWithClient[];
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        results = results.filter(t => 
          t.descricao?.toLowerCase().includes(searchLower) ||
          t.recurring_clients?.name?.toLowerCase().includes(searchLower)
        );
      }

      return results;
    },
  });
}

// Calculate KPIs from transactions
export function useTransactionKPIs(filters: TransactionFilters = {}) {
  const { data: transactions, isLoading, error } = useTransactions(filters);

  const kpis: TransactionKPIs = {
    totalEsperado: 0,
    totalPago: 0,
    totalEmAberto: 0,
    totalAtrasado: 0,
    quantidadeTotal: 0,
    quantidadePago: 0,
    quantidadeEmAberto: 0,
    quantidadeAtrasado: 0,
  };

  if (transactions) {
    transactions.forEach(t => {
      kpis.quantidadeTotal++;
      kpis.totalEsperado += Number(t.valor) || 0;

      if (t.status === 'PAGO') {
        kpis.quantidadePago++;
        kpis.totalPago += Number(t.valor_pago) || Number(t.valor) || 0;
      } else if (t.status === 'ATRASADO') {
        kpis.quantidadeAtrasado++;
        kpis.totalAtrasado += Number(t.valor) || 0;
      } else {
        kpis.quantidadeEmAberto++;
        kpis.totalEmAberto += Number(t.valor) || 0;
      }
    });
  }

  return { kpis, isLoading, error };
}

// Mark transaction as paid
export function useMarkTransactionPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      transactionId, 
      valorPago,
      moduloOrigem = 'TRANSACOES'
    }: { 
      transactionId: string; 
      valorPago?: number;
      moduloOrigem?: string;
    }) => {
      // First, get the transaction to know its value
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('valor')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;

      // Update the transaction
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'PAGO',
          valor_pago: valorPago ?? transaction.valor,
          data_pagamento: new Date().toISOString().split('T')[0],
        })
        .eq('id', transactionId);

      if (error) throw error;

      // The trigger will sync to recurring_installments if applicable
      // and create history entry

      return transactionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurring_installments'] });
      toast.success('Transação marcada como paga!');
    },
    onError: (error) => {
      console.error('Error marking transaction as paid:', error);
      toast.error('Erro ao marcar transação como paga');
    },
  });
}

// Create a new manual transaction
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Partial<TransactionRow>) => {
      const insertData: any = {
        tipo_movimento: transaction.tipo_movimento!,
        natureza: transaction.natureza || 'AVULSA',
        origem: transaction.origem || 'LANCAMENTO_MANUAL',
        cliente_id: transaction.cliente_id,
        competencia_mes: transaction.competencia_mes!,
        competencia_ano: transaction.competencia_ano!,
        valor: transaction.valor!,
        data_vencimento: transaction.data_vencimento!,
        status: transaction.status || 'EM_ABERTO',
        descricao: transaction.descricao,
        // UUID-based fields
        transaction_category_id: transaction.categoria_id,
        account_id: transaction.conta_id,
        cost_center_id: transaction.centro_custo_id,
        // Legacy fields
        categoria_id: transaction.categoria_id,
        centro_custo_id: transaction.centro_custo_id,
        conta_id: transaction.conta_id,
        forma_pagamento_id: transaction.forma_pagamento_id,
        documento_tipo: transaction.documento_tipo,
        documento_numero: transaction.documento_numero,
        notes: transaction.notes,
        entity_id: (transaction as any).entity_id || null,
        // Fiscal fields
        origem_receita: (transaction as any).origem_receita || null,
        documento_recebimento: (transaction as any).documento_recebimento || null,
        responsavel_id: (transaction as any).responsavel_id || null,
        nf_percentual_aplicado: (transaction as any).nf_percentual_aplicado || null,
        valor_imposto_nf: (transaction as any).valor_imposto_nf || null,
        valor_liquido_nf: (transaction as any).valor_liquido_nf || null,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Create history entry
      await supabase
        .from('transaction_history')
        .insert({
          transaction_id: data.id,
          evento: 'CRIADO',
          modulo_origem: 'TRANSACOES',
          user_id: 'system',
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transação criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating transaction:', error);
      toast.error('Erro ao criar transação');
    },
  });
}

// Update transaction
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TransactionRow> & { id: string }) => {
      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transação atualizada!');
    },
    onError: (error) => {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar transação');
    },
  });
}

// Delete transaction
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;
      return transactionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transação excluída!');
    },
    onError: (error) => {
      console.error('Error deleting transaction:', error);
      toast.error('Erro ao excluir transação');
    },
  });
}

// Duplicate transaction
export function useDuplicateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      // Get original transaction
      const { data: original, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;

      // Create duplicate
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          tipo_movimento: original.tipo_movimento,
          natureza: 'AVULSA', // Duplicates are always single transactions
          origem: 'LANCAMENTO_MANUAL',
          cliente_id: original.cliente_id,
          competencia_mes: original.competencia_mes,
          competencia_ano: original.competencia_ano,
          valor: original.valor,
          data_vencimento: original.data_vencimento,
          status: 'EM_ABERTO',
          descricao: `${original.descricao} (Cópia)`,
          categoria_id: original.categoria_id,
          centro_custo_id: original.centro_custo_id,
          conta_id: original.conta_id,
          forma_pagamento_id: original.forma_pagamento_id,
          documento_tipo: original.documento_tipo,
          notes: original.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transação duplicada!');
    },
    onError: (error) => {
      console.error('Error duplicating transaction:', error);
      toast.error('Erro ao duplicar transação');
    },
  });
}

// Transaction history
export function useTransactionHistory(transactionId: string) {
  return useQuery({
    queryKey: ['transaction_history', transactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_history')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!transactionId,
  });
}

// Fetch clients for dropdown
export function useClients() {
  return useQuery({
    queryKey: ['recurring_clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_clients')
        .select('id, name, email, phone, active')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}
