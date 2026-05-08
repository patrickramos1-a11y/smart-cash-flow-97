import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MODULES, ModuleKey, resolveModuleKey } from '@/lib/modules';

interface PermissionRow {
  module_key: string;
  allowed: boolean;
}

/**
 * Permissões de visibilidade de módulos para o usuário logado.
 * - Admin: enxerga tudo.
 * - Financeiro sem registros: aplica preset (defaultFinanceiro).
 * - Financeiro com pelo menos 1 registro: usa exatamente o que estiver marcado.
 */
export function usePermissions() {
  const { user, isAdmin } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user-module-permissions', user?.id],
    queryFn: async () => {
      if (!user) return [] as PermissionRow[];
      const { data, error } = await (supabase as any)
        .from('user_module_permissions')
        .select('module_key, allowed')
        .eq('user_id', user.id);
      if (error) return [] as PermissionRow[];
      return (data ?? []) as PermissionRow[];
    },
    enabled: !!user && !isAdmin,
    staleTime: 60_000,
  });

  const allowedKeys = new Set<ModuleKey>();

  if (isAdmin) {
    MODULES.forEach((m) => allowedKeys.add(m.key));
  } else if (data && data.length > 0) {
    data.forEach((r) => {
      if (r.allowed) allowedKeys.add(r.module_key as ModuleKey);
    });
  } else {
    MODULES.forEach((m) => {
      if (m.defaultFinanceiro) allowedKeys.add(m.key);
    });
  }

  const can = (tab: string) => {
    if (isAdmin) return true;
    return allowedKeys.has(resolveModuleKey(tab));
  };

  return { can, allowedKeys, loading: isLoading && !isAdmin };
}
