import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MODULES, MODULES_BY_SECTION, ModuleKey } from '@/lib/modules';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, CheckSquare, Square, Sparkles, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProfileRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}
interface RoleRow {
  user_id: string;
  role: 'admin' | 'financeiro';
}
interface PermissionRow {
  user_id: string;
  module_key: string;
  allowed: boolean;
}

export function UserPermissionsView() {
  const qc = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<ModuleKey, boolean>>({} as any);
  const [saving, setSaving] = useState(false);

  const { data: profiles, isLoading: lp } = useQuery({
    queryKey: ['admin-profiles-list'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, display_name, avatar_url').order('display_name');
      return (data ?? []) as ProfileRow[];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['admin-roles-list'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('user_id, role');
      return (data ?? []) as RoleRow[];
    },
  });

  const { data: perms, isLoading: lperm } = useQuery({
    queryKey: ['admin-user-permissions', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const { data } = await (supabase as any)
        .from('user_module_permissions')
        .select('user_id, module_key, allowed')
        .eq('user_id', selectedUserId);
      return (data ?? []) as PermissionRow[];
    },
    enabled: !!selectedUserId,
  });

  const roleByUser = useMemo(() => {
    const map = new Map<string, 'admin' | 'financeiro'>();
    (roles ?? []).forEach((r) => map.set(r.user_id, r.role));
    return map;
  }, [roles]);

  const selectedUser = profiles?.find((p) => p.user_id === selectedUserId) ?? null;
  const selectedIsAdmin = selectedUserId ? roleByUser.get(selectedUserId) === 'admin' : false;

  // Carrega draft quando muda usuário ou perms
  useEffect(() => {
    if (!selectedUserId) return;
    const next: Record<ModuleKey, boolean> = {} as any;
    if (perms && perms.length > 0) {
      const map = new Map(perms.map((p) => [p.module_key, p.allowed]));
      MODULES.forEach((m) => {
        next[m.key] = map.has(m.key) ? !!map.get(m.key) : false;
      });
    } else {
      // preset financeiro
      MODULES.forEach((m) => {
        next[m.key] = m.defaultFinanceiro;
      });
    }
    setDraft(next);
  }, [selectedUserId, perms]);

  const toggle = (key: ModuleKey) => setDraft((d) => ({ ...d, [key]: !d[key] }));
  const setAll = (val: boolean) => {
    const next: Record<ModuleKey, boolean> = {} as any;
    MODULES.forEach((m) => (next[m.key] = val));
    setDraft(next);
  };
  const applyPreset = () => {
    const next: Record<ModuleKey, boolean> = {} as any;
    MODULES.forEach((m) => (next[m.key] = m.defaultFinanceiro));
    setDraft(next);
  };

  const save = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const rows = MODULES.map((m) => ({
        user_id: selectedUserId,
        module_key: m.key,
        allowed: !!draft[m.key],
      }));
      const { error } = await (supabase as any)
        .from('user_module_permissions')
        .upsert(rows, { onConflict: 'user_id,module_key' });
      if (error) throw error;
      toast.success('Permissões salvas');
      qc.invalidateQueries({ queryKey: ['admin-user-permissions', selectedUserId] });
      qc.invalidateQueries({ queryKey: ['user-module-permissions'] });
    } catch (e: any) {
      toast.error('Erro ao salvar', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = Object.values(draft).filter(Boolean).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      {/* Lista de usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuários</CardTitle>
          <CardDescription>Selecione para configurar</CardDescription>
        </CardHeader>
        <CardContent className="p-2">
          {lp ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-y-auto custom-scrollbar">
              {(profiles ?? []).map((p) => {
                const isSel = p.user_id === selectedUserId;
                const role = roleByUser.get(p.user_id) ?? 'financeiro';
                return (
                  <button
                    key={p.user_id}
                    onClick={() => setSelectedUserId(p.user_id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors',
                      isSel ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    )}
                  >
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {p.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.display_name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {role === 'admin' ? '🔑 Administrador' : '💰 Financeiro'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Painel de permissões */}
      <Card>
        {!selectedUserId ? (
          <CardContent className="py-16 text-center text-muted-foreground">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
            Selecione um usuário ao lado para configurar suas permissões.
          </CardContent>
        ) : (
          <>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">{selectedUser?.display_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  Módulos visíveis para este usuário
                  <Badge variant="secondary">{enabledCount}/{MODULES.length}</Badge>
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setAll(true)} disabled={selectedIsAdmin}>
                  <CheckSquare className="w-4 h-4 mr-1.5" />Tudo
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAll(false)} disabled={selectedIsAdmin}>
                  <Square className="w-4 h-4 mr-1.5" />Nada
                </Button>
                <Button size="sm" variant="outline" onClick={applyPreset} disabled={selectedIsAdmin}>
                  <Sparkles className="w-4 h-4 mr-1.5" />Preset Financeiro
                </Button>
                <Button size="sm" onClick={save} disabled={saving || selectedIsAdmin}>
                  {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Salvar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedIsAdmin && (
                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
                  🔑 Administradores têm acesso a todos os módulos automaticamente. Permissões individuais não se aplicam.
                </div>
              )}
              {lperm ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(MODULES_BY_SECTION).map(([section, mods]) => (
                    <div key={section} className="border rounded-xl p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">
                        {section}
                      </p>
                      <div className="space-y-1">
                        {mods.map((m) => (
                          <label
                            key={m.key}
                            className={cn(
                              'flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                              !selectedIsAdmin && 'hover:bg-muted',
                              selectedIsAdmin && 'opacity-60 cursor-not-allowed'
                            )}
                          >
                            <Checkbox
                              checked={selectedIsAdmin ? true : !!draft[m.key]}
                              onCheckedChange={() => !selectedIsAdmin && toggle(m.key)}
                              disabled={selectedIsAdmin}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-tight">{m.label}</p>
                              {m.description && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">{m.description}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
