import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BacklogItem,
  BacklogCategory,
  BacklogPriority,
  BacklogImpact,
  BacklogEffort,
  categoryLabels,
  priorityLabels,
  impactLabels,
  effortLabels,
  useBacklogProjects,
  useBacklogModules,
  useCreateBacklogItem,
  useUpdateBacklogItem
} from '@/hooks/useBacklog';

interface BacklogItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: BacklogItem | null;
}

const defaultDescription = `## Contexto / Problema


## Objetivo da melhoria


## Comportamento atual


## Comportamento esperado


## Regras de negócio


## Observações técnicas


## Impacto no usuário

`;

export function BacklogItemModal({ open, onOpenChange, item }: BacklogItemModalProps) {
  const { data: projects } = useBacklogProjects();
  const createItem = useCreateBacklogItem();
  const updateItem = useUpdateBacklogItem();

  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    category: 'NOVA_FUNCIONALIDADE' as BacklogCategory,
    description: defaultDescription,
    priority: 'MEDIA' as BacklogPriority,
    expected_impact: 'MEDIO' as BacklogImpact,
    effort_estimate: 'MEDIO' as BacklogEffort,
    depends_on_credits: false,
    responsible_product: '',
    responsible_tech: '',
    module_ids: [] as string[]
  });

  const { data: modules } = useBacklogModules(formData.project_id);

  useEffect(() => {
    if (item) {
      setFormData({
        project_id: item.project_id,
        title: item.title,
        category: item.category,
        description: item.description || defaultDescription,
        priority: item.priority,
        expected_impact: item.expected_impact,
        effort_estimate: item.effort_estimate,
        depends_on_credits: item.depends_on_credits,
        responsible_product: item.responsible_product || '',
        responsible_tech: item.responsible_tech || '',
        module_ids: item.modules?.map(m => m.id) || []
      });
    } else {
      setFormData({
        project_id: projects?.[0]?.id || '',
        title: '',
        category: 'NOVA_FUNCIONALIDADE',
        description: defaultDescription,
        priority: 'MEDIA',
        expected_impact: 'MEDIO',
        effort_estimate: 'MEDIO',
        depends_on_credits: false,
        responsible_product: '',
        responsible_tech: '',
        module_ids: []
      });
    }
  }, [item, projects, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.project_id || !formData.title) return;

    const payload = {
      ...formData,
      responsible_product: formData.responsible_product || null,
      responsible_tech: formData.responsible_tech || null
    };

    if (item) {
      await updateItem.mutateAsync({ id: item.id, ...payload });
    } else {
      await createItem.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  const categories: BacklogCategory[] = [
    'NOVA_FUNCIONALIDADE', 'MELHORIA_EXISTENTE', 'CORRECAO_BUG', 'AJUSTE_TECNICO',
    'UX_UI_VISUAL', 'RELATORIOS_INDICADORES', 'SEGURANCA_PERMISSOES', 'INFRAESTRUTURA_CREDITOS'
  ];

  const priorities: BacklogPriority[] = ['ALTA', 'MEDIA', 'BAIXA'];
  const impacts: BacklogImpact[] = ['ALTO', 'MEDIO', 'BAIXO'];
  const efforts: BacklogEffort[] = ['PEQUENO', 'MEDIO', 'GRANDE'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Item' : 'Novo Item do Backlog'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Projeto *</Label>
              <Select
                value={formData.project_id}
                onValueChange={(v) => setFormData({ ...formData, project_id: v, module_ids: [] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v as BacklogCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Título curto e objetivo"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição Detalhada (Markdown)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o item em detalhes..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {/* Priority, Impact, Effort */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v as BacklogPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(p => (
                    <SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Impacto Esperado</Label>
              <Select
                value={formData.expected_impact}
                onValueChange={(v) => setFormData({ ...formData, expected_impact: v as BacklogImpact })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {impacts.map(i => (
                    <SelectItem key={i} value={i}>{impactLabels[i]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estimativa de Esforço</Label>
              <Select
                value={formData.effort_estimate}
                onValueChange={(v) => setFormData({ ...formData, effort_estimate: v as BacklogEffort })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {efforts.map(e => (
                    <SelectItem key={e} value={e}>{effortLabels[e]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Modules */}
          {modules && modules.length > 0 && (
            <div className="space-y-2">
              <Label>Módulos Impactados</Label>
              <div className="flex flex-wrap gap-2">
                {modules.map(m => (
                  <Button
                    key={m.id}
                    type="button"
                    variant={formData.module_ids.includes(m.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newIds = formData.module_ids.includes(m.id)
                        ? formData.module_ids.filter(id => id !== m.id)
                        : [...formData.module_ids, m.id];
                      setFormData({ ...formData, module_ids: newIds });
                    }}
                  >
                    {m.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Depends on Credits */}
          <div className="flex items-center gap-3">
            <Switch
              id="depends_on_credits"
              checked={formData.depends_on_credits}
              onCheckedChange={(v) => setFormData({ ...formData, depends_on_credits: v })}
            />
            <Label htmlFor="depends_on_credits">Depende de Créditos / Recursos</Label>
          </div>

          {/* Responsibles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsible_product">Responsável Produto</Label>
              <Input
                id="responsible_product"
                value={formData.responsible_product}
                onChange={(e) => setFormData({ ...formData, responsible_product: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_tech">Responsável Técnico</Label>
              <Input
                id="responsible_tech"
                value={formData.responsible_tech}
                onChange={(e) => setFormData({ ...formData, responsible_tech: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createItem.isPending || updateItem.isPending || !formData.project_id || !formData.title}
            >
              {item ? 'Salvar Alterações' : 'Criar Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
