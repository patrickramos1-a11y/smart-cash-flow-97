import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, RefreshCw, ArrowRight, CheckCircle2, AlertTriangle, Users, UserCheck, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinancialEntities } from '@/hooks/useFinancialEntities';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value);

export function ReclassificationView() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCostCenter, setFilterCostCenter] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['reclassification-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id, descricao, valor, competencia_mes, competencia_ano, tipo_movimento,
          transaction_category_id, cost_center_id,
          transaction_categories (id, name, cost_center_id, cost_centers (id, name, dre_group)),
          cost_centers (id, name, dre_group)
        `)
        .order('competencia_ano', { ascending: false })
        .order('competencia_mes', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['all-categories-reclass'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_categories')
        .select('id, name, type, cost_center_id, cost_centers (id, name)')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: costCenters } = useQuery({
    queryKey: ['all-cost-centers-reclass'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('id, name, dre_group')
        .eq('active', true)
        .order('dre_order');
      if (error) throw error;
      return data;
    },
  });

  const reclassifyMutation = useMutation({
    mutationFn: async ({ ids, categoryId }: { ids: string[]; categoryId: string }) => {
      const category = categories?.find(c => c.id === categoryId);
      if (!category) throw new Error('Categoria não encontrada');

      const { error } = await supabase
        .from('transactions')
        .update({
          transaction_category_id: categoryId,
          cost_center_id: category.cost_center_id,
        })
        .in('id', ids);

      if (error) throw error;

      // Log audit trail
      for (const id of ids) {
        await supabase.from('transaction_history').insert({
          transaction_id: id,
          evento: 'ALTERADO',
          modulo_origem: 'RECLASSIFICACAO_LOTE',
          user_id: 'system',
          dados_anteriores: { acao: 'reclassificacao', nova_categoria: category.name },
        });
      }
    },
    onSuccess: () => {
      toast.success(`${selectedIds.size} transações reclassificadas com sucesso!`);
      setSelectedIds(new Set());
      setTargetCategoryId('');
      queryClient.invalidateQueries({ queryKey: ['reclassification-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dre-data'] });
    },
    onError: (err: any) => toast.error('Erro: ' + err.message),
  });

  const filtered = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => {
      if (searchTerm && !t.descricao?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterCostCenter !== 'all' && t.cost_center_id !== filterCostCenter && t.cost_centers?.id !== filterCostCenter) return false;
      if (filterCategory !== 'all' && t.transaction_category_id !== filterCategory) return false;
      return true;
    });
  }, [transactions, searchTerm, filterCostCenter, filterCategory]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(t => t.id)));
    }
  };

  const handleReclassify = () => {
    if (!targetCategoryId || selectedIds.size === 0) return;
    reclassifyMutation.mutate({ ids: Array.from(selectedIds), categoryId: targetCategoryId });
  };

  if (txLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Reclassificação em Lote</h2>
        <p className="text-sm text-muted-foreground">Corrija categorias, centros de custo e vínculos (entidade/responsável) de transações históricas</p>
      </div>

      <BackfillPanel />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por descrição..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterCostCenter} onValueChange={setFilterCostCenter}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Centro de Custo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os centros</SelectItem>
                {costCenters?.map(cc => <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Categoria atual" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action bar */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {selectedIds.size} selecionadas
              </Badge>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Nova categoria..." /></SelectTrigger>
                <SelectContent>
                  {categories?.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} → {(c as any).cost_centers?.name || '—'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleReclassify} disabled={!targetCategoryId || reclassifyMutation.isPending} className="gap-2">
                <RefreshCw className={cn("w-4 h-4", reclassifyMutation.isPending && "animate-spin")} />
                Reclassificar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 px-4 w-10">
                    <Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                  </th>
                  <th className="text-left py-3 px-4">Descrição</th>
                  <th className="text-right py-3 px-4">Valor</th>
                  <th className="text-center py-3 px-2">Comp.</th>
                  <th className="text-left py-3 px-4">Categoria Atual</th>
                  <th className="text-left py-3 px-4">Centro de Custo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map(t => {
                  const hasCategory = !!t.transaction_category_id;
                  return (
                    <tr key={t.id} className={cn("border-b border-border/50 hover:bg-muted/20", selectedIds.has(t.id) && "bg-primary/5")}>
                      <td className="py-2 px-4">
                        <Checkbox checked={selectedIds.has(t.id)} onCheckedChange={() => toggleSelect(t.id)} />
                      </td>
                      <td className="py-2 px-4 max-w-[300px] truncate">{t.descricao || '(sem descrição)'}</td>
                      <td className={cn("text-right py-2 px-4", t.tipo_movimento === 'ENTRADA' ? 'text-income' : 'text-expense')}>
                        {formatCurrency(Number(t.valor))}
                      </td>
                      <td className="text-center py-2 px-2 text-xs">{String(t.competencia_mes).padStart(2, '0')}/{t.competencia_ano}</td>
                      <td className="py-2 px-4">
                        {hasCategory ? (
                          <Badge variant="outline" className="text-xs">{(t as any).transaction_categories?.name || '—'}</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="w-3 h-3" />Sem categoria</Badge>
                        )}
                      </td>
                      <td className="py-2 px-4 text-muted-foreground text-xs">
                        {(t as any).cost_centers?.name || (t as any).transaction_categories?.cost_center_id ? '—' : 'Sem centro'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 200 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Mostrando 200 de {filtered.length} transações. Use os filtros para refinar.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Backfill Panel — preenche Responsável e Entidade em massa
// ============================================================
function BackfillPanel() {
  const queryClient = useQueryClient();
  const { data: entities } = useFinancialEntities();

  const [responsavelId, setResponsavelId] = useState<string>('');
  const [scope, setScope] = useState<'ENTRADA' | 'SAIDA' | 'AMBOS'>('ENTRADA');
  const [overwrite, setOverwrite] = useState(false);

  const [entityKeyword, setEntityKeyword] = useState('');
  const [targetEntityId, setTargetEntityId] = useState<string>('');
  const [entityScope, setEntityScope] = useState<'ENTRADA' | 'SAIDA' | 'AMBOS'>('SAIDA');

  const patrick = useMemo(
    () => entities?.find(e => e.name?.toUpperCase() === 'PATRICK' && e.type === 'SOCIO'),
    [entities]
  );

  const { data: counts } = useQuery({
    queryKey: ['backfill-counts', scope, overwrite, entityScope, entityKeyword],
    queryFn: async () => {
      let respQuery = supabase.from('transactions').select('id', { count: 'exact', head: true });
      if (scope !== 'AMBOS') respQuery = respQuery.eq('tipo_movimento', scope);
      if (!overwrite) respQuery = respQuery.is('responsavel_id', null);
      const { count: respCount } = await respQuery;

      let entCount: number | null = null;
      if (entityKeyword.trim()) {
        let entQuery = supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .ilike('descricao', `%${entityKeyword.trim()}%`);
        if (entityScope !== 'AMBOS') entQuery = entQuery.eq('tipo_movimento', entityScope);
        const { count } = await entQuery;
        entCount = count ?? 0;
      }
      return { respCount: respCount ?? 0, entCount };
    },
  });

  const responsibleMutation = useMutation({
    mutationFn: async () => {
      const finalRespId = responsavelId || patrick?.id;
      if (!finalRespId) throw new Error('Selecione um responsável');
      let q = supabase.from('transactions').update({ responsavel_id: finalRespId });
      if (scope !== 'AMBOS') q = q.eq('tipo_movimento', scope);
      if (!overwrite) q = q.is('responsavel_id', null);
      const { error, count } = await q.select('id', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    onSuccess: (n) => {
      toast.success(`Responsável aplicado em ${n} transações`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['backfill-counts'] });
    },
    onError: (err: any) => toast.error('Erro: ' + err.message),
  });

  const entityMutation = useMutation({
    mutationFn: async () => {
      if (!targetEntityId) throw new Error('Selecione uma entidade');
      if (!entityKeyword.trim()) throw new Error('Informe a palavra-chave');
      let q = supabase
        .from('transactions')
        .update({ entity_id: targetEntityId })
        .ilike('descricao', `%${entityKeyword.trim()}%`);
      if (entityScope !== 'AMBOS') q = q.eq('tipo_movimento', entityScope);
      const { error, count } = await q.select('id', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    onSuccess: (n) => {
      toast.success(`Entidade aplicada em ${n} transações`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['backfill-counts'] });
    },
    onError: (err: any) => toast.error('Erro: ' + err.message),
  });

  const eligibleResponsibles = entities?.filter(e => e.active && (e.type === 'SOCIO' || e.type === 'COLABORADOR')) || [];
  const allEntities = entities?.filter(e => e.active) || [];

  return (
    <Card className="border-primary/30 bg-primary/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" />
          Backfill Inteligente — preencher Responsável e Vinculado a (Entidade)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bloco 1: Responsável padrão */}
        <div className="space-y-3 p-3 rounded-md border bg-card">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-income" />
            <h3 className="text-sm font-semibold">Definir Responsável (executor) padrão</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Atribui um responsável às transações que ainda não possuem este vínculo. Padrão sugerido: <strong>Patrick</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Responsável</Label>
              <Select value={responsavelId || patrick?.id || ''} onValueChange={setResponsavelId}>
                <SelectTrigger><SelectValue placeholder="Escolher pessoa" /></SelectTrigger>
                <SelectContent>
                  {eligibleResponsibles.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Aplicar em</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Apenas Entradas</SelectItem>
                  <SelectItem value="SAIDA">Apenas Saídas</SelectItem>
                  <SelectItem value="AMBOS">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <Checkbox id="overwrite" checked={overwrite} onCheckedChange={(v) => setOverwrite(!!v)} />
              <Label htmlFor="overwrite" className="text-xs cursor-pointer">
                Sobrescrever existentes
              </Label>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full gap-2"
                disabled={!(responsavelId || patrick?.id) || responsibleMutation.isPending}
                onClick={() => responsibleMutation.mutate()}
              >
                {responsibleMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Aplicar ({counts?.respCount ?? '...'})
              </Button>
            </div>
          </div>
        </div>

        {/* Bloco 2: Entidade por palavra-chave */}
        <div className="space-y-3 p-3 rounded-md border bg-card">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-info" />
            <h3 className="text-sm font-semibold">Vincular Entidade por palavra-chave</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Procura na descrição (ex.: "Pró-labore", "FGTS Darley", "Energia") e atribui a entidade beneficiária.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Palavra na descrição</Label>
              <Input value={entityKeyword} onChange={e => setEntityKeyword(e.target.value)} placeholder="Ex.: Pró-labore" />
            </div>
            <div>
              <Label className="text-xs">Entidade-alvo</Label>
              <Select value={targetEntityId} onValueChange={setTargetEntityId}>
                <SelectTrigger><SelectValue placeholder="Escolher entidade" /></SelectTrigger>
                <SelectContent>
                  {allEntities.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Aplicar em</Label>
              <Select value={entityScope} onValueChange={(v) => setEntityScope(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAIDA">Apenas Saídas</SelectItem>
                  <SelectItem value="ENTRADA">Apenas Entradas</SelectItem>
                  <SelectItem value="AMBOS">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full gap-2"
                disabled={!targetEntityId || !entityKeyword.trim() || entityMutation.isPending}
                onClick={() => entityMutation.mutate()}
              >
                {entityMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Aplicar ({counts?.entCount ?? '—'})
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Operação sobrescreve <code>entity_id</code> de TODAS as transações que coincidirem com a busca. Revise antes de aplicar.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
