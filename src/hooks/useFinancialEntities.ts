import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type EntityType = 'COLABORADOR' | 'FORNECEDOR' | 'SOCIO' | 'GRUPO';

export interface FinancialEntity {
  id: string;
  name: string;
  type: EntityType;
  email: string | null;
  phone: string | null;
  document: string | null;
  cost_center_id: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useFinancialEntities(type?: EntityType) {
  return useQuery({
    queryKey: ['financial-entities', type],
    queryFn: async () => {
      let query = supabase
        .from('financial_entities')
        .select('*')
        .order('name');

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FinancialEntity[];
    },
  });
}

export function useCreateFinancialEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entity: Omit<FinancialEntity, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('financial_entities')
        .insert([entity])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-entities'] });
      toast.success('Entidade criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar entidade: ' + error.message);
    },
  });
}

export function useUpdateFinancialEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialEntity> & { id: string }) => {
      const { data, error } = await supabase
        .from('financial_entities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-entities'] });
      toast.success('Entidade atualizada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar entidade: ' + error.message);
    },
  });
}

export function useDeleteFinancialEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_entities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-entities'] });
      toast.success('Entidade excluída!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir entidade: ' + error.message);
    },
  });
}

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  COLABORADOR: 'Colaborador',
  FORNECEDOR: 'Fornecedor',
  SOCIO: 'Sócio',
  GRUPO: 'Grupo',
};

export const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  COLABORADOR: 'hsl(var(--primary))',
  FORNECEDOR: 'hsl(var(--warning))',
  SOCIO: 'hsl(var(--income))',
  GRUPO: 'hsl(var(--info))',
};
