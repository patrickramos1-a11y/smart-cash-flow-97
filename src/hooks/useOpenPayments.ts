import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// =============================================
// TYPES
// =============================================

export interface OpenPayment {
  id: string;
  tipo_movimento: 'ENTRADA' | 'SAIDA';
  natureza: 'RECORRENTE' | 'AVULSA';
  origem: string;
  descricao: string | null;
  valor: number;
  valor_pago: number | null;
  data_vencimento: string;
  data_pagamento: string | null;
  status: 'EM_ABERTO' | 'PAGO' | 'ATRASADO';
  competencia_mes: number;
  competencia_ano: number;
  cliente_id: string | null;
  cliente?: { name: string } | null;
  contrato_id: string | null;
  installment_id: string | null;
  fixed_expense_id: string | null;
  days_overdue: number;
}

export interface OpenPaymentStats {
  totalReceivable: number;
  totalPayable: number;
  totalOverdue: number;
  countReceivable: number;
  countPayable: number;
  countOverdue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
}

export interface OpenPaymentFilters {
  type?: 'ENTRADA' | 'SAIDA' | 'all';
  status?: 'EM_ABERTO' | 'ATRASADO' | 'all';
  clientId?: string;
  startDate?: string;
  endDate?: string;
  minDaysOverdue?: number;
}

// =============================================
// HOOKS
// =============================================

export function useOpenPayments(filters?: OpenPaymentFilters) {
  return useQuery({
    queryKey: ['open-payments', filters],
    queryFn: async () => {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      let query = supabase
        .from('transactions')
        .select(`
          *,
          cliente:recurring_clients(name)
        `)
        .in('status', ['EM_ABERTO', 'ATRASADO'])
        // ONLY show items that are already overdue (vencimento <= today)
        .lte('data_vencimento', todayStr)
        .order('data_vencimento', { ascending: true });
      
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('tipo_movimento', filters.type);
      }
      
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.clientId) {
        query = query.eq('cliente_id', filters.clientId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const payments: OpenPayment[] = (data || []).map(item => ({
        ...item,
        days_overdue: item.data_vencimento 
          ? Math.max(0, differenceInDays(today, parseISO(item.data_vencimento)))
          : 0
      }));
      
      // Filter by min days overdue if specified
      if (filters?.minDaysOverdue) {
        return payments.filter(p => p.days_overdue >= filters.minDaysOverdue!);
      }
      
      return payments;
    },
  });
}

export function useOpenPaymentStats() {
  return useQuery({
    queryKey: ['open-payment-stats'],
    queryFn: async () => {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Only fetch OVERDUE items (vencimento <= today)
      const { data: currentData, error: currentError } = await supabase
        .from('transactions')
        .select('tipo_movimento, valor, status, data_vencimento')
        .in('status', ['EM_ABERTO', 'ATRASADO'])
        .lte('data_vencimento', todayStr);
      
      if (currentError) throw currentError;
      
      // Previous month comparison
      const lastMonth = subMonths(new Date(), 1);
      const lastMonthEnd = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
      
      const { data: previousData, error: previousError } = await supabase
        .from('transactions')
        .select('tipo_movimento, valor')
        .in('status', ['EM_ABERTO', 'ATRASADO'])
        .lte('data_vencimento', lastMonthEnd);
      
      if (previousError) throw previousError;
      
      const stats: OpenPaymentStats = {
        totalReceivable: 0,
        totalPayable: 0,
        totalOverdue: 0,
        countReceivable: 0,
        countPayable: 0,
        countOverdue: 0,
        trend: 'stable',
        trendPercentage: 0,
      };
      
      currentData?.forEach(item => {
        if (item.tipo_movimento === 'ENTRADA') {
          stats.totalReceivable += item.valor;
          stats.countReceivable++;
        } else {
          stats.totalPayable += item.valor;
          stats.countPayable++;
        }
        
        // All are overdue since we filtered by lte today
        stats.totalOverdue += item.valor;
        stats.countOverdue++;
      });
      
      // Calculate trend
      const currentTotal = stats.totalReceivable + stats.totalPayable;
      const previousTotal = previousData?.reduce((sum, item) => sum + item.valor, 0) || 0;
      
      if (previousTotal > 0) {
        const change = ((currentTotal - previousTotal) / previousTotal) * 100;
        stats.trendPercentage = Math.abs(change);
        stats.trend = change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable';
      }
      
      return stats;
    },
  });
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      transactionId, 
      paidValue, 
      paymentDate, 
      accountId 
    }: { 
      transactionId: string; 
      paidValue: number; 
      paymentDate: string; 
      accountId?: string;
    }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          status: 'PAGO',
          valor_pago: paidValue,
          data_pagamento: paymentDate,
          account_id: accountId,
        })
        .eq('id', transactionId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update account balance if account specified
      if (accountId && data) {
        const delta = data.tipo_movimento === 'ENTRADA' ? paidValue : -paidValue;
        
        const { data: account } = await supabase
          .from('accounts')
          .select('current_balance')
          .eq('id', accountId)
          .single();
        
        if (account) {
          await supabase
            .from('accounts')
            .update({ current_balance: account.current_balance + delta })
            .eq('id', accountId);
        }
      }
      
      // Log to history
      await supabase.from('transaction_history').insert({
        transaction_id: transactionId,
        evento: 'MARCADO_PAGO',
        modulo_origem: 'EM_ABERTO',
        dados_anteriores: { valor_pago: paidValue, data_pagamento: paymentDate }
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['open-payments'] });
      queryClient.invalidateQueries({ queryKey: ['open-payment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Pagamento registrado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar pagamento: ' + error.message);
    },
  });
}

export function useUpdateDueDate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      transactionId, 
      newDueDate 
    }: { 
      transactionId: string; 
      newDueDate: string;
    }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          data_vencimento: newDueDate,
          status: differenceInDays(new Date(), parseISO(newDueDate)) > 0 ? 'ATRASADO' : 'EM_ABERTO'
        })
        .eq('id', transactionId)
        .select()
        .single();
      
      if (error) throw error;
      
      await supabase.from('transaction_history').insert({
        transaction_id: transactionId,
        evento: 'ALTERADO',
        modulo_origem: 'EM_ABERTO',
        dados_anteriores: { nova_data_vencimento: newDueDate }
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['open-payments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Data de vencimento atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar data: ' + error.message);
    },
  });
}

export function useOpenPaymentsEvolution() {
  return useQuery({
    queryKey: ['open-payments-evolution'],
    queryFn: async () => {
      // Get last 6 months evolution
      const months: { month: string; receivable: number; payable: number }[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStart = format(startOfMonth(date), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(date), 'yyyy-MM-dd');
        
        const { data } = await supabase
          .from('transactions')
          .select('tipo_movimento, valor, created_at')
          .in('status', ['EM_ABERTO', 'ATRASADO'])
          .lte('created_at', monthEnd);
        
        const receivable = data?.filter(d => d.tipo_movimento === 'ENTRADA').reduce((sum, d) => sum + d.valor, 0) || 0;
        const payable = data?.filter(d => d.tipo_movimento === 'SAIDA').reduce((sum, d) => sum + d.valor, 0) || 0;
        
        months.push({
          month: format(date, 'MMM/yy'),
          receivable,
          payable
        });
      }
      
      return months;
    },
  });
}
