import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Users, UserCheck, Building2, Briefcase, UsersRound,
  Plus, Search, Edit, Trash2, MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  useFinancialEntities, useCreateFinancialEntity, useUpdateFinancialEntity, useDeleteFinancialEntity,
  EntityType, FinancialEntity, ENTITY_TYPE_LABELS
} from '@/hooks/useFinancialEntities';
import { useCostCenters } from '@/hooks/useFinancialConfig';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

const ENTITY_ICONS: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  COLABORADOR: UserCheck,
  FORNECEDOR: Building2,
  SOCIO: Briefcase,
  GRUPO: UsersRound,
};

const ENTITY_COLORS: Record<EntityType, string> = {
  COLABORADOR: 'bg-primary/10 text-primary border-primary/20',
  FORNECEDOR: 'bg-warning/10 text-warning border-warning/20',
  SOCIO: 'bg-income/10 text-income border-income/20',
  GRUPO: 'bg-info/10 text-info border-info/20',
};

const ENTITY_BG: Record<EntityType, string> = {
  COLABORADOR: 'bg-primary',
  FORNECEDOR: 'bg-warning',
  SOCIO: 'bg-income',
  GRUPO: 'bg-info',
};

interface EntityFormData {
  name: string;
  type: EntityType;
  email: string;
  phone: string;
  document: string;
  cost_center_id: string;
  notes: string;
  active: boolean;
}

const emptyForm: EntityFormData = {
  name: '', type: 'COLABORADOR', email: '', phone: '', document: '',
  cost_center_id: '', notes: '', active: true,
};

export function EntitiesView() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<EntityType | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<FinancialEntity | null>(null);
  const [formData, setFormData] = useState<EntityFormData>(emptyForm);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: entities, isLoading } = useFinancialEntities();
  const { data: costCenters } = useCostCenters();
  const createEntity = useCreateFinancialEntity();
  const updateEntity = useUpdateFinancialEntity();
  const deleteEntity = useDeleteFinancialEntity();

  const filtered = (entities || []).filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.document?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || e.type === filterType;
    return matchesSearch && matchesType;
  });

  const counts = {
    total: entities?.length || 0,
    COLABORADOR: entities?.filter(e => e.type === 'COLABORADOR').length || 0,
    FORNECEDOR: entities?.filter(e => e.type === 'FORNECEDOR').length || 0,
    SOCIO: entities?.filter(e => e.type === 'SOCIO').length || 0,
    GRUPO: entities?.filter(e => e.type === 'GRUPO').length || 0,
  };

  const openNew = () => {
    setEditingEntity(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (entity: FinancialEntity) => {
    setEditingEntity(entity);
    setFormData({
      name: entity.name,
      type: entity.type as EntityType,
      email: entity.email || '',
      phone: entity.phone || '',
      document: entity.document || '',
      cost_center_id: entity.cost_center_id || '',
      notes: entity.notes || '',
      active: entity.active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      email: formData.email || null,
      phone: formData.phone || null,
      document: formData.document || null,
      cost_center_id: formData.cost_center_id || null,
      notes: formData.notes || null,
      active: formData.active,
    };

    if (editingEntity) {
      await updateEntity.mutateAsync({ id: editingEntity.id, ...payload });
    } else {
      await createEntity.mutateAsync(payload);
    }
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteEntity.mutateAsync(deletingId);
      setDeletingId(null);
    }
  };

  const getCostCenterName = (id: string | null) => {
    if (!id) return null;
    return costCenters?.find(c => c.id === id)?.name || null;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card 
          className={cn("cursor-pointer transition-all", filterType === 'all' && "ring-2 ring-primary")}
          onClick={() => setFilterType('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Todas</p>
                <p className="text-xl font-bold">{counts.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(['COLABORADOR', 'FORNECEDOR', 'SOCIO', 'GRUPO'] as EntityType[]).map(type => {
          const Icon = ENTITY_ICONS[type];
          return (
            <Card 
              key={type}
              className={cn("cursor-pointer transition-all", filterType === type && "ring-2 ring-primary")}
              onClick={() => setFilterType(type)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", ENTITY_COLORS[type].split(' ').slice(0, 1).join(' '))}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{ENTITY_TYPE_LABELS[type]}s</p>
                    <p className="text-xl font-bold">{counts[type]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Entidade
        </Button>
      </div>

      {/* Entities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(entity => {
          const Icon = ENTITY_ICONS[entity.type as EntityType] || Users;
          const ccName = getCostCenterName(entity.cost_center_id);
          
          return (
            <Card key={entity.id} className={cn("transition-all hover:shadow-md", !entity.active && "opacity-60")}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm", ENTITY_BG[entity.type as EntityType])}>
                      {entity.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{entity.name}</h3>
                      <Badge variant="outline" className={cn("text-[10px] mt-0.5", ENTITY_COLORS[entity.type as EntityType])}>
                        <Icon className="w-3 h-3 mr-1" />
                        {ENTITY_TYPE_LABELS[entity.type as EntityType]}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(entity)}>
                        <Edit className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => { setDeletingId(entity.id); setShowDeleteConfirm(true); }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  {entity.email && <p>📧 {entity.email}</p>}
                  {entity.phone && <p>📱 {entity.phone}</p>}
                  {entity.document && <p>📄 {entity.document}</p>}
                  {ccName && (
                    <p className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-info inline-block" />
                      {ccName}
                    </p>
                  )}
                  {!entity.active && (
                    <Badge variant="outline" className="text-[10px] text-expense border-expense/30 mt-1">Inativo</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {filtered.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma entidade encontrada</p>
          </div>
        )}
      </div>

      {/* Entity Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEntity ? 'Editar Entidade' : 'Nova Entidade'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nome completo" />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v as EntityType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['COLABORADOR', 'FORNECEDOR', 'SOCIO', 'GRUPO'] as EntityType[]).map(t => (
                      <SelectItem key={t} value={t}>{ENTITY_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>E-mail</Label>
                <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CPF / CNPJ</Label>
                <Input value={formData.document} onChange={e => setFormData({ ...formData, document: e.target.value })} placeholder="Documento" />
              </div>
              <div>
                <Label>Centro de Custo</Label>
                <Select value={formData.cost_center_id} onValueChange={v => setFormData({ ...formData, cost_center_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    {costCenters?.filter(c => c.active).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={formData.active} onCheckedChange={v => setFormData({ ...formData, active: v })} />
                <Label className="text-sm">Ativo</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.name.trim()} className="flex-1">
              {editingEntity ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Entidade"
        message="Tem certeza que deseja excluir esta entidade? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        type="danger"
      />
    </div>
  );
}
