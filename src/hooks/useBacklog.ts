import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// TYPES
// =====================================================

export type BacklogCategory = 
  | 'NOVA_FUNCIONALIDADE'
  | 'MELHORIA_EXISTENTE'
  | 'CORRECAO_BUG'
  | 'AJUSTE_TECNICO'
  | 'UX_UI_VISUAL'
  | 'RELATORIOS_INDICADORES'
  | 'SEGURANCA_PERMISSOES'
  | 'INFRAESTRUTURA_CREDITOS';

export type BacklogStatus = 
  | 'IDEIA'
  | 'EM_ANALISE'
  | 'REFINADO'
  | 'AGUARDANDO_RECURSOS'
  | 'EM_IMPLEMENTACAO'
  | 'EM_TESTES'
  | 'IMPLEMENTADO'
  | 'LANCADO'
  | 'VALIDADO'
  | 'ARQUIVADO';

export type BacklogPriority = 'ALTA' | 'MEDIA' | 'BAIXA';
export type BacklogImpact = 'ALTO' | 'MEDIO' | 'BAIXO';
export type BacklogEffort = 'PEQUENO' | 'MEDIO' | 'GRANDE';
export type BacklogValidationType = 'TESTE_FUNCIONAL' | 'VALIDACAO_VISUAL' | 'VALIDACAO_TECNICA' | 'VALIDACAO_REGRA_NEGOCIO';
export type BacklogImplementationStatus = 'EXECUTADO' | 'NAO_EXECUTADO';
export type BacklogEventType = 
  | 'CRIADO' 
  | 'STATUS_ALTERADO' 
  | 'ANEXO_ADICIONADO' 
  | 'ANEXO_REMOVIDO'
  | 'PRIORIDADE_ALTERADA' 
  | 'DATA_ALTERADA' 
  | 'IMPLEMENTADO' 
  | 'LANCADO' 
  | 'VALIDADO' 
  | 'ARQUIVADO';

export interface BacklogProject {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BacklogModule {
  id: string;
  project_id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BacklogItem {
  id: string;
  project_id: string;
  title: string;
  category: BacklogCategory;
  description: string | null;
  status: BacklogStatus;
  priority: BacklogPriority;
  expected_impact: BacklogImpact;
  effort_estimate: BacklogEffort;
  depends_on_credits: boolean;
  responsible_product: string | null;
  responsible_tech: string | null;
  start_date: string | null;
  completion_date: string | null;
  release_date: string | null;
  validation_date: string | null;
  created_at: string;
  updated_at: string;
  project?: BacklogProject;
  modules?: BacklogModule[];
}

export interface BacklogAttachment {
  id: string;
  backlog_item_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface BacklogValidation {
  id: string;
  backlog_item_id: string;
  validated: boolean;
  validation_date: string | null;
  validated_by: string | null;
  validation_type: BacklogValidationType | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BacklogImplementationRecord {
  id: string;
  backlog_item_id: string;
  description: string;
  date: string;
  responsible: string | null;
  status: BacklogImplementationStatus;
  created_at: string;
}

export interface BacklogHistoryEntry {
  id: string;
  backlog_item_id: string;
  event_type: BacklogEventType;
  event_description: string | null;
  previous_value: string | null;
  new_value: string | null;
  user_id: string | null;
  created_at: string;
}

export interface BacklogFilters {
  projectId?: string;
  category?: BacklogCategory;
  status?: BacklogStatus;
  priority?: BacklogPriority;
  dependsOnCredits?: boolean;
  search?: string;
}

// =====================================================
// LABEL MAPS
// =====================================================

export const categoryLabels: Record<BacklogCategory, string> = {
  NOVA_FUNCIONALIDADE: 'Nova Funcionalidade',
  MELHORIA_EXISTENTE: 'Melhoria Existente',
  CORRECAO_BUG: 'Correção / Bug',
  AJUSTE_TECNICO: 'Ajuste Técnico / Performance',
  UX_UI_VISUAL: 'UX / UI / Visual',
  RELATORIOS_INDICADORES: 'Relatórios / Indicadores',
  SEGURANCA_PERMISSOES: 'Segurança / Permissões',
  INFRAESTRUTURA_CREDITOS: 'Infraestrutura / Créditos'
};

export const statusLabels: Record<BacklogStatus, string> = {
  IDEIA: 'Ideia / Proposta',
  EM_ANALISE: 'Em Análise',
  REFINADO: 'Refinado',
  AGUARDANDO_RECURSOS: 'Aguardando Recursos',
  EM_IMPLEMENTACAO: 'Em Implementação',
  EM_TESTES: 'Em Testes',
  IMPLEMENTADO: 'Implementado',
  LANCADO: 'Lançado',
  VALIDADO: 'Validado',
  ARQUIVADO: 'Arquivado'
};

export const priorityLabels: Record<BacklogPriority, string> = {
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa'
};

export const impactLabels: Record<BacklogImpact, string> = {
  ALTO: 'Alto',
  MEDIO: 'Médio',
  BAIXO: 'Baixo'
};

export const effortLabels: Record<BacklogEffort, string> = {
  PEQUENO: 'Pequeno',
  MEDIO: 'Médio',
  GRANDE: 'Grande'
};

export const validationTypeLabels: Record<BacklogValidationType, string> = {
  TESTE_FUNCIONAL: 'Teste Funcional',
  VALIDACAO_VISUAL: 'Validação Visual',
  VALIDACAO_TECNICA: 'Validação Técnica',
  VALIDACAO_REGRA_NEGOCIO: 'Validação de Regra de Negócio'
};

export const eventTypeLabels: Record<BacklogEventType, string> = {
  CRIADO: 'Criado',
  STATUS_ALTERADO: 'Status Alterado',
  ANEXO_ADICIONADO: 'Anexo Adicionado',
  ANEXO_REMOVIDO: 'Anexo Removido',
  PRIORIDADE_ALTERADA: 'Prioridade Alterada',
  DATA_ALTERADA: 'Data Alterada',
  IMPLEMENTADO: 'Implementado',
  LANCADO: 'Lançado',
  VALIDADO: 'Validado',
  ARQUIVADO: 'Arquivado'
};

// =====================================================
// PROJECTS HOOKS
// =====================================================

export function useBacklogProjects() {
  return useQuery({
    queryKey: ['backlog-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backlog_projects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as BacklogProject[];
    }
  });
}

export function useCreateBacklogProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (project: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('backlog_projects')
        .insert(project)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-projects'] });
      toast({ title: 'Projeto criado com sucesso' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar projeto', description: error.message, variant: 'destructive' });
    }
  });
}

export function useUpdateBacklogProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; active?: boolean }) => {
      const { error } = await supabase
        .from('backlog_projects')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-projects'] });
      toast({ title: 'Projeto atualizado' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar projeto', description: error.message, variant: 'destructive' });
    }
  });
}

// =====================================================
// MODULES HOOKS
// =====================================================

export function useBacklogModules(projectId?: string) {
  return useQuery({
    queryKey: ['backlog-modules', projectId],
    queryFn: async () => {
      let query = supabase
        .from('backlog_modules')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BacklogModule[];
    }
  });
}

export function useCreateBacklogModule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (module: { project_id: string; name: string }) => {
      const { data, error } = await supabase
        .from('backlog_modules')
        .insert(module)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-modules'] });
      toast({ title: 'Módulo criado com sucesso' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar módulo', description: error.message, variant: 'destructive' });
    }
  });
}

// =====================================================
// BACKLOG ITEMS HOOKS
// =====================================================

export function useBacklogItems(filters?: BacklogFilters) {
  return useQuery({
    queryKey: ['backlog-items', filters],
    queryFn: async () => {
      let query = supabase
        .from('backlog_items')
        .select(`
          *,
          project:backlog_projects(*)
        `)
        .order('created_at', { ascending: false });
      
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.dependsOnCredits !== undefined) {
        query = query.eq('depends_on_credits', filters.dependsOnCredits);
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as (BacklogItem & { project: BacklogProject })[];
    }
  });
}

export function useBacklogItem(id: string) {
  return useQuery({
    queryKey: ['backlog-item', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backlog_items')
        .select(`
          *,
          project:backlog_projects(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Get modules
      const { data: itemModules } = await supabase
        .from('backlog_item_modules')
        .select('module_id, module:backlog_modules(*)')
        .eq('backlog_item_id', id);
      
      return {
        ...data,
        modules: itemModules?.map(im => im.module) || []
      } as BacklogItem & { project: BacklogProject; modules: BacklogModule[] };
    },
    enabled: !!id
  });
}

export function useCreateBacklogItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: {
      project_id: string;
      title: string;
      category: BacklogCategory;
      description?: string;
      priority?: BacklogPriority;
      expected_impact?: BacklogImpact;
      effort_estimate?: BacklogEffort;
      depends_on_credits?: boolean;
      responsible_product?: string;
      responsible_tech?: string;
      module_ids?: string[];
    }) => {
      const { module_ids, ...itemData } = item;
      
      const { data, error } = await supabase
        .from('backlog_items')
        .insert(itemData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add modules if provided
      if (module_ids && module_ids.length > 0) {
        const moduleLinks = module_ids.map(moduleId => ({
          backlog_item_id: data.id,
          module_id: moduleId
        }));
        
        await supabase.from('backlog_item_modules').insert(moduleLinks);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
      queryClient.invalidateQueries({ queryKey: ['backlog-stats'] });
      toast({ title: 'Item criado com sucesso' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar item', description: error.message, variant: 'destructive' });
    }
  });
}

export function useUpdateBacklogItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, module_ids, ...data }: { 
      id: string; 
      module_ids?: string[];
      [key: string]: unknown;
    }) => {
      const { error } = await supabase
        .from('backlog_items')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update modules if provided
      if (module_ids !== undefined) {
        // Remove existing links
        await supabase.from('backlog_item_modules').delete().eq('backlog_item_id', id);
        
        // Add new links
        if (module_ids.length > 0) {
          const moduleLinks = module_ids.map(moduleId => ({
            backlog_item_id: id,
            module_id: moduleId
          }));
          await supabase.from('backlog_item_modules').insert(moduleLinks);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
      queryClient.invalidateQueries({ queryKey: ['backlog-item'] });
      queryClient.invalidateQueries({ queryKey: ['backlog-stats'] });
      toast({ title: 'Item atualizado' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar item', description: error.message, variant: 'destructive' });
    }
  });
}

export function useUpdateBacklogStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BacklogStatus }) => {
      // Check if trying to validate without validation record
      if (status === 'VALIDADO') {
        const { data: validations } = await supabase
          .from('backlog_validations')
          .select('*')
          .eq('backlog_item_id', id)
          .eq('validated', true);
        
        if (!validations || validations.length === 0) {
          throw new Error('Não é possível validar sem uma confirmação de entrega registrada.');
        }
      }
      
      const { error } = await supabase
        .from('backlog_items')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
      queryClient.invalidateQueries({ queryKey: ['backlog-item'] });
      queryClient.invalidateQueries({ queryKey: ['backlog-stats'] });
      queryClient.invalidateQueries({ queryKey: ['backlog-history'] });
      toast({ title: 'Status atualizado' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    }
  });
}

export function useArchiveBacklogItem() {
  const updateStatus = useUpdateBacklogStatus();

  return useMutation({
    mutationFn: async (id: string) => {
      await updateStatus.mutateAsync({ id, status: 'ARQUIVADO' });
    }
  });
}

// =====================================================
// ATTACHMENTS HOOKS
// =====================================================

export function useBacklogAttachments(itemId: string) {
  return useQuery({
    queryKey: ['backlog-attachments', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backlog_attachments')
        .select('*')
        .eq('backlog_item_id', itemId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BacklogAttachment[];
    },
    enabled: !!itemId
  });
}

export function useUploadBacklogAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ itemId, file }: { itemId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${itemId}/${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('backlog-attachments')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('backlog-attachments')
        .getPublicUrl(fileName);
      
      // Save to database
      const { data, error } = await supabase
        .from('backlog_attachments')
        .insert({
          backlog_item_id: itemId,
          file_name: file.name,
          file_path: publicUrl,
          file_type: file.type,
          file_size: file.size
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['backlog-attachments', itemId] });
      queryClient.invalidateQueries({ queryKey: ['backlog-history', itemId] });
      toast({ title: 'Anexo enviado com sucesso' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao enviar anexo', description: error.message, variant: 'destructive' });
    }
  });
}

export function useDeleteBacklogAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, itemId }: { id: string; itemId: string }) => {
      const { error } = await supabase
        .from('backlog_attachments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['backlog-attachments', itemId] });
      queryClient.invalidateQueries({ queryKey: ['backlog-history', itemId] });
      toast({ title: 'Anexo removido' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover anexo', description: error.message, variant: 'destructive' });
    }
  });
}

// =====================================================
// VALIDATIONS HOOKS
// =====================================================

export function useBacklogValidations(itemId: string) {
  return useQuery({
    queryKey: ['backlog-validations', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backlog_validations')
        .select('*')
        .eq('backlog_item_id', itemId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BacklogValidation[];
    },
    enabled: !!itemId
  });
}

export function useCreateBacklogValidation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (validation: {
      backlog_item_id: string;
      validated: boolean;
      validation_date?: string;
      validated_by?: string;
      validation_type?: BacklogValidationType;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('backlog_validations')
        .insert(validation)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['backlog-validations', variables.backlog_item_id] });
      toast({ title: 'Validação registrada' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao registrar validação', description: error.message, variant: 'destructive' });
    }
  });
}

// =====================================================
// IMPLEMENTATION RECORDS HOOKS
// =====================================================

export function useBacklogImplementationRecords(itemId: string) {
  return useQuery({
    queryKey: ['backlog-implementation-records', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backlog_implementation_records')
        .select('*')
        .eq('backlog_item_id', itemId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as BacklogImplementationRecord[];
    },
    enabled: !!itemId
  });
}

export function useCreateBacklogImplementationRecord() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (record: {
      backlog_item_id: string;
      description: string;
      date?: string;
      responsible?: string;
      status?: BacklogImplementationStatus;
    }) => {
      const { data, error } = await supabase
        .from('backlog_implementation_records')
        .insert(record)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['backlog-implementation-records', variables.backlog_item_id] });
      toast({ title: 'Registro de implementação adicionado' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar registro', description: error.message, variant: 'destructive' });
    }
  });
}

// =====================================================
// HISTORY HOOKS
// =====================================================

export function useBacklogHistory(itemId: string) {
  return useQuery({
    queryKey: ['backlog-history', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backlog_history')
        .select('*')
        .eq('backlog_item_id', itemId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BacklogHistoryEntry[];
    },
    enabled: !!itemId
  });
}

// =====================================================
// STATS HOOKS
// =====================================================

export function useBacklogStats() {
  return useQuery({
    queryKey: ['backlog-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backlog_items')
        .select('status, depends_on_credits');
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        byStatus: {} as Record<BacklogStatus, number>,
        aguardandoRecursos: 0,
        emImplementacao: 0,
        implementados: 0,
        lancados: 0,
        validados: 0
      };
      
      const statusOrder: BacklogStatus[] = [
        'IDEIA', 'EM_ANALISE', 'REFINADO', 'AGUARDANDO_RECURSOS',
        'EM_IMPLEMENTACAO', 'EM_TESTES', 'IMPLEMENTADO', 'LANCADO', 'VALIDADO', 'ARQUIVADO'
      ];
      
      statusOrder.forEach(s => { stats.byStatus[s] = 0; });
      
      data.forEach(item => {
        stats.byStatus[item.status as BacklogStatus]++;
        
        if (item.depends_on_credits) stats.aguardandoRecursos++;
        if (item.status === 'EM_IMPLEMENTACAO') stats.emImplementacao++;
        if (item.status === 'IMPLEMENTADO') stats.implementados++;
        if (item.status === 'LANCADO') stats.lancados++;
        if (item.status === 'VALIDADO') stats.validados++;
      });
      
      return stats;
    }
  });
}

export function useBacklogByStatus() {
  return useQuery({
    queryKey: ['backlog-by-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backlog_items')
        .select(`
          *,
          project:backlog_projects(*)
        `)
        .neq('status', 'ARQUIVADO')
        .order('priority')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const grouped: Record<BacklogStatus, typeof data> = {
        IDEIA: [],
        EM_ANALISE: [],
        REFINADO: [],
        AGUARDANDO_RECURSOS: [],
        EM_IMPLEMENTACAO: [],
        EM_TESTES: [],
        IMPLEMENTADO: [],
        LANCADO: [],
        VALIDADO: [],
        ARQUIVADO: []
      };
      
      data.forEach(item => {
        grouped[item.status as BacklogStatus].push(item);
      });
      
      return grouped;
    }
  });
}
