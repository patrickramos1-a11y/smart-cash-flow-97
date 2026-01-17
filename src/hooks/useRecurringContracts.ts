import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface MinimumWageConfig {
  id: string;
  year: number;
  value: number;
  effective_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractPlan {
  id: string;
  name: string;
  minimum_wage_factor: number;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringContract {
  id: string;
  client_id: string;
  plan_id?: string;
  custom_minimum_wage_factor?: number;
  start_date: string;
  end_date?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  client?: RecurringClient;
  plan?: ContractPlan;
}

export interface RecurringInstallment {
  id: string;
  contract_id: string;
  competence_month: number;
  competence_year: number;
  minimum_wage_value: number;
  minimum_wage_factor: number;
  expected_value: number;
  paid_value?: number;
  payment_date?: string;
  due_date: string;
  status: 'PAGO' | 'EM_ABERTO' | 'ATRASADO' | 'CANCELADO';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  contract?: RecurringContract;
}

// Hook for minimum wage config
export function useMinimumWageConfig(year?: number) {
  return useQuery({
    queryKey: ['minimum-wage-config', year],
    queryFn: async () => {
      let query = supabase
        .from('minimum_wage_config')
        .select('*')
        .order('year', { ascending: false });
      
      if (year) {
        query = query.eq('year', year);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MinimumWageConfig[];
    },
  });
}

// Hook for contract plans
export function useContractPlans() {
  return useQuery({
    queryKey: ['contract-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_plans')
        .select('*')
        .order('minimum_wage_factor', { ascending: true });
      
      if (error) throw error;
      return data as ContractPlan[];
    },
  });
}

// Hook for recurring clients
export function useRecurringClients() {
  return useQuery({
    queryKey: ['recurring-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_clients')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as RecurringClient[];
    },
  });
}

// Hook for recurring contracts with client and plan data
export function useRecurringContracts() {
  return useQuery({
    queryKey: ['recurring-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_contracts')
        .select(`
          *,
          client:recurring_clients(*),
          plan:contract_plans(*)
        `)
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as RecurringContract[];
    },
  });
}

// Hook for installments with filters
export function useRecurringInstallments(filters?: {
  year?: number;
  month?: number;
  status?: string;
  contractId?: string;
}) {
  return useQuery({
    queryKey: ['recurring-installments', filters],
    queryFn: async () => {
      let query = supabase
        .from('recurring_installments')
        .select(`
          *,
          contract:recurring_contracts(
            *,
            client:recurring_clients(*),
            plan:contract_plans(*)
          )
        `)
        .order('competence_year', { ascending: true })
        .order('competence_month', { ascending: true });
      
      if (filters?.year) {
        query = query.eq('competence_year', filters.year);
      }
      if (filters?.month) {
        query = query.eq('competence_month', filters.month);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.contractId) {
        query = query.eq('contract_id', filters.contractId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RecurringInstallment[];
    },
  });
}

// Mutation to mark installment as paid
export function useMarkInstallmentPaid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      installmentId, 
      paidValue, 
      paymentDate 
    }: { 
      installmentId: string; 
      paidValue: number; 
      paymentDate?: string;
    }) => {
      const { data, error } = await supabase
        .from('recurring_installments')
        .update({
          status: 'PAGO',
          paid_value: paidValue,
          payment_date: paymentDate || new Date().toISOString().split('T')[0],
        })
        .eq('id', installmentId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-installments'] });
    },
  });
}

// Mutation to update minimum wage config
export function useUpdateMinimumWage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      year, 
      value, 
      notes 
    }: { 
      year: number; 
      value: number; 
      notes?: string;
    }) => {
      // Check if exists
      const { data: existing } = await supabase
        .from('minimum_wage_config')
        .select('id')
        .eq('year', year)
        .maybeSingle();
      
      if (existing) {
        const { data, error } = await supabase
          .from('minimum_wage_config')
          .update({ value, notes })
          .eq('year', year)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('minimum_wage_config')
          .insert({ year, value, notes, effective_date: `${year}-01-01` })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minimum-wage-config'] });
    },
  });
}

// Calculate dashboard KPIs
export function useRecurringKPIs(year: number = 2025) {
  const { data: installments, isLoading: loadingInstallments } = useRecurringInstallments({ year });
  const { data: contracts, isLoading: loadingContracts } = useRecurringContracts();
  const { data: minimumWage, isLoading: loadingMW } = useMinimumWageConfig(year);

  const isLoading = loadingInstallments || loadingContracts || loadingMW;

  const kpis = {
    totalClients: contracts?.length || 0,
    totalMinimumWagesMonthly: 0,
    totalMinimumWagesYearly: 0,
    expectedValueMonthly: 0,
    expectedValueYearly: 0,
    paidValue: 0,
    openValue: 0,
    overdueValue: 0,
    overdueClients: [] as { clientName: string; value: number; month: number }[],
    minimumWageValue: minimumWage?.[0]?.value || 1518,
  };

  if (contracts) {
    contracts.forEach((contract) => {
      const factor = contract.custom_minimum_wage_factor || contract.plan?.minimum_wage_factor || 1;
      kpis.totalMinimumWagesMonthly += factor;
    });
    kpis.totalMinimumWagesYearly = kpis.totalMinimumWagesMonthly * 12;
  }

  if (installments) {
    installments.forEach((inst) => {
      kpis.expectedValueYearly += Number(inst.expected_value);
      
      if (inst.status === 'PAGO') {
        kpis.paidValue += Number(inst.paid_value || inst.expected_value);
      } else if (inst.status === 'ATRASADO') {
        kpis.overdueValue += Number(inst.expected_value);
        kpis.overdueClients.push({
          clientName: inst.contract?.client?.name || 'N/A',
          value: Number(inst.expected_value),
          month: inst.competence_month,
        });
      } else {
        kpis.openValue += Number(inst.expected_value);
      }
    });

    // Calculate monthly expected (average per month)
    kpis.expectedValueMonthly = kpis.expectedValueYearly / 12;
  }

  return { kpis, isLoading };
}
