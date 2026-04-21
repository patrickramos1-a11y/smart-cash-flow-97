import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// =============================================
// TYPES
// =============================================

export interface FinancialCompany {
  id: string;
  name: string;
  cnpj: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountCategory {
  id: string;
  company_id: string | null;
  name: string;
  color: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  company_id: string | null;
  category_id: string | null;
  name: string;
  bank: string | null;
  initial_balance: number;
  current_balance: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: AccountCategory;
}

export interface CostCenter {
  id: string;
  company_id: string | null;
  name: string;
  code: string | null;
  dre_group: string;
  dre_label: string;
  dre_order: number;
  is_expense: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type CategorySubtype = 'RECORRENTE' | 'AVULSA' | 'FIXA' | 'VARIAVEL';

export interface TransactionCategory {
  id: string;
  company_id: string | null;
  cost_center_id: string;
  name: string;
  type: 'ENTRADA' | 'SAIDA';
  subtype: CategorySubtype | null;
  expense_type: 'FIXA' | 'VARIAVEL' | 'IMPOSTO' | null;
  default_account_id: string | null;
  color: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  cost_center?: CostCenter;
  default_account?: Account;
}

export interface PaymentMethod {
  id: string;
  company_id: string | null;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountTransfer {
  id: string;
  company_id: string | null;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  transfer_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  from_account?: Account;
  to_account?: Account;
}

// =============================================
// COMPANIES
// =============================================

export function useCompanies() {
  return useQuery({
    queryKey: ['financial-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_companies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as FinancialCompany[];
    },
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (company: { name: string; cnpj?: string; active?: boolean }) => {
      const { data, error } = await supabase
        .from('financial_companies')
        .insert([company])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-companies'] });
      toast.success('Empresa criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar empresa: ' + error.message);
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...company }: Partial<FinancialCompany> & { id: string }) => {
      const { data, error } = await supabase
        .from('financial_companies')
        .update(company)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-companies'] });
      toast.success('Empresa atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar empresa: ' + error.message);
    },
  });
}

// =============================================
// ACCOUNT CATEGORIES
// =============================================

export function useAccountCategories() {
  return useQuery({
    queryKey: ['account-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_categories')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data as AccountCategory[];
    },
  });
}

export function useCreateAccountCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: { name: string; company_id?: string; color?: string; display_order?: number; active?: boolean }) => {
      const { data, error } = await supabase
        .from('account_categories')
        .insert([category])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-categories'] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar categoria: ' + error.message);
    },
  });
}

export function useUpdateAccountCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...category }: Partial<AccountCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('account_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-categories'] });
      toast.success('Categoria atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar categoria: ' + error.message);
    },
  });
}

export function useDeleteAccountCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('account_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-categories'] });
      toast.success('Categoria excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir categoria: ' + error.message);
    },
  });
}

// =============================================
// ACCOUNTS
// =============================================

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select(`
          *,
          category:account_categories(*)
        `)
        .order('name');
      
      if (error) throw error;
      return data as Account[];
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (account: { name: string; company_id?: string; category_id?: string | null; bank?: string; initial_balance?: number; current_balance?: number; active?: boolean }) => {
      const { data, error } = await supabase
        .from('accounts')
        .insert([account])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar conta: ' + error.message);
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...account }: Partial<Account> & { id: string }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(account)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar conta: ' + error.message);
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir conta: ' + error.message);
    },
  });
}

// =============================================
// CATEGORIES BY ACCOUNT (governance helpers)
// =============================================

/**
 * Retorna todas as transaction_categories cuja default_account_id = accountId.
 */
export function useCategoriesByAccount(accountId: string | null | undefined) {
  return useQuery({
    queryKey: ['categories-by-account', accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_categories')
        .select('*, cost_center:cost_centers(*)')
        .eq('default_account_id', accountId!)
        .order('name');
      if (error) throw error;
      return data as TransactionCategory[];
    },
  });
}

/**
 * Sincroniza o conjunto de categorias vinculadas a uma conta:
 * - categorias em `categoryIds` que ainda não apontam para a conta → passam a apontar.
 * - categorias que apontavam e não estão em `categoryIds` → têm default_account_id zerado.
 */
export function useLinkCategoriesToAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, categoryIds }: { accountId: string; categoryIds: string[] }) => {
      // Remover vínculo das categorias que NÃO devem mais apontar para esta conta
      const { error: clearError } = await supabase
        .from('transaction_categories')
        .update({ default_account_id: null })
        .eq('default_account_id', accountId)
        .not('id', 'in', `(${categoryIds.length ? categoryIds.map(id => `"${id}"`).join(',') : '""'})`);
      if (clearError && categoryIds.length) throw clearError;

      // Vincular as selecionadas
      if (categoryIds.length) {
        const { error: linkError } = await supabase
          .from('transaction_categories')
          .update({ default_account_id: accountId })
          .in('id', categoryIds);
        if (linkError) throw linkError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-by-account'] });
      toast.success('Categorias vinculadas à conta atualizadas!');
    },
    onError: (error) => {
      toast.error('Erro ao vincular categorias: ' + error.message);
    },
  });
}

/**
 * Reconcilia (recalcula) o saldo de uma conta chamando a função SQL.
 */
export function useRecalculateAccountBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase.rpc('recalculate_account_balance', { p_account_id: accountId } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Saldo reconciliado!');
    },
    onError: (error) => {
      toast.error('Erro ao reconciliar saldo: ' + error.message);
    },
  });
}

// =============================================
// COST CENTERS
// =============================================

export function useCostCenters() {
  return useQuery({
    queryKey: ['cost-centers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .order('dre_order');
      
      if (error) throw error;
      return data as CostCenter[];
    },
  });
}

export function useCreateCostCenter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (costCenter: { name: string; company_id?: string; code?: string; dre_group: string; dre_label: string; dre_order: number; is_expense?: boolean; active?: boolean }) => {
      const { data, error } = await supabase
        .from('cost_centers')
        .insert([costCenter])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      toast.success('Centro de custo criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar centro de custo: ' + error.message);
    },
  });
}

export function useUpdateCostCenter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...costCenter }: Partial<CostCenter> & { id: string }) => {
      const { data, error } = await supabase
        .from('cost_centers')
        .update(costCenter)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      toast.success('Centro de custo atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar centro de custo: ' + error.message);
    },
  });
}

// =============================================
// TRANSACTION CATEGORIES
// =============================================

export function useTransactionCategories() {
  return useQuery({
    queryKey: ['transaction-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_categories')
        .select(`
          *,
          cost_center:cost_centers(*),
          default_account:accounts!transaction_categories_default_account_id_fkey(*)
        `)
        .order('name');
      
      if (error) throw error;
      return data as TransactionCategory[];
    },
  });
}

export function useTransactionCategoriesBySubtype(type: 'ENTRADA' | 'SAIDA', subtype: CategorySubtype) {
  const { data: categories, ...rest } = useTransactionCategories();
  const filtered = categories?.filter(c => c.type === type && c.subtype === subtype && c.active) || [];
  return { data: filtered, ...rest };
}

export function useBulkUpdateTransactionCategories() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<{ subtype: CategorySubtype; default_account_id: string; cost_center_id: string; active: boolean }> }) => {
      const { error } = await supabase
        .from('transaction_categories')
        .update(updates as any)
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
      toast.success('Categorias atualizadas em massa!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar categorias: ' + error.message);
    },
  });
}

export function useCreateTransactionCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: { name: string; cost_center_id: string; type: 'ENTRADA' | 'SAIDA'; subtype?: CategorySubtype | null; company_id?: string; expense_type?: 'FIXA' | 'VARIAVEL' | 'IMPOSTO' | null; default_account_id?: string | null; color?: string; active?: boolean }) => {
      const { data, error } = await supabase
        .from('transaction_categories')
        .insert([category])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar categoria: ' + error.message);
    },
  });
}

export function useUpdateTransactionCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...category }: Partial<TransactionCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('transaction_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
      toast.success('Categoria atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar categoria: ' + error.message);
    },
  });
}

export function useDeleteTransactionCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transaction_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
      toast.success('Categoria excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir categoria: ' + error.message);
    },
  });
}

export function useBulkDeleteTransactionCategories() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('transaction_categories')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
      toast.success(`${ids.length} categorias excluídas com sucesso!`);
    },
    onError: (error) => {
      toast.error('Erro ao excluir categorias: ' + error.message);
    },
  });
}

// =============================================
// PAYMENT METHODS
// =============================================

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (method: { name: string; company_id?: string; active?: boolean }) => {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([method])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Forma de pagamento criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar forma de pagamento: ' + error.message);
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...method }: Partial<PaymentMethod> & { id: string }) => {
      const { data, error } = await supabase
        .from('payment_methods')
        .update(method)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Forma de pagamento atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar forma de pagamento: ' + error.message);
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Forma de pagamento excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir forma de pagamento: ' + error.message);
    },
  });
}

// =============================================
// ACCOUNT TRANSFERS
// =============================================

export function useAccountTransfers(filters?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['account-transfers', filters],
    queryFn: async () => {
      let query = supabase
        .from('account_transfers')
        .select(`
          *,
          from_account:accounts!account_transfers_from_account_id_fkey(*),
          to_account:accounts!account_transfers_to_account_id_fkey(*)
        `)
        .order('transfer_date', { ascending: false });
      
      if (filters?.startDate) {
        query = query.gte('transfer_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('transfer_date', filters.endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as AccountTransfer[];
    },
  });
}

export function useCreateAccountTransfer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transfer: { from_account_id: string; to_account_id: string; amount: number; company_id?: string; transfer_date?: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('account_transfers')
        .insert([transfer])
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Transferência realizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao realizar transferência: ' + error.message);
    },
  });
}

// =============================================
// CONSOLIDATED BALANCE
// =============================================

export function useConsolidatedBalance() {
  return useQuery({
    queryKey: ['consolidated-balance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('current_balance, category:account_categories(name, color)')
        .eq('active', true);
      
      if (error) throw error;
      
      const total = data?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
      
      const byCategory = data?.reduce((acc, item) => {
        const categoryName = (item.category as any)?.name || 'Sem categoria';
        const categoryColor = (item.category as any)?.color || '#6366f1';
        if (!acc[categoryName]) {
          acc[categoryName] = { total: 0, color: categoryColor };
        }
        acc[categoryName].total += item.current_balance || 0;
        return acc;
      }, {} as Record<string, { total: number; color: string }>);
      
      return { total, byCategory };
    },
  });
}
