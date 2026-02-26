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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  // Group member selection
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');

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

  // Get members that can be part of a group (non-group entities)
  const availableMembers = (entities || []).filter(e => e.type !== 'GRUPO' && e.active);
  const filteredMembers = availableMembers.filter(e =>
    e.name.toLowerCase().includes(groupSearchTerm.toLowerCase())
  );

  // Parse group notes to get member IDs (stored as JSON)
  const getGroupMembers = (entity: FinancialEntity): string[] => {
    if (entity.type !== 'GRUPO' || !entity.notes) return [];
    try {
      const parsed = JSON.parse(entity.notes);
      return Array.isArray(parsed.members) ? parsed.members : [];
    } catch {
      return [];
    }
  };

  const openNew = (type?: EntityType) => {
    setEditingEntity(null);
    setFormData({ ...emptyForm, type: type || 'COLABORADOR' });
    setGroupMemberIds([]);
    setGroupSearchTerm('');
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
    setGroupMemberIds(getGroupMembers(entity));
    setGroupSearchTerm('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    // For groups, store member IDs in notes as JSON
    let notes = formData.notes;
    if (formData.type === 'GRUPO') {
      const existingNotes = formData.notes;
      let userNotes = '';
      try {
        const parsed = JSON.parse(existingNotes);
        userNotes = parsed.userNotes || '';
      } catch {
        userNotes = existingNotes;
      }
      notes = JSON.stringify({ members: groupMemberIds, userNotes });
    }

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      email: formData.email || null,
      phone: formData.phone || null,
      document: formData.document || null,
      cost_center_id: formData.cost_center_id || null,
      notes: notes || null,
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

  // Get user-facing notes for groups (exclude JSON metadata)
  const getDisplayNotes = (entity: FinancialEntity): string => {
    if (entity.type === 'GRUPO' && entity.notes) {
      try {
        const parsed = JSON.parse(entity.notes);
        return parsed.userNotes || '';
      } catch {
        return entity.notes;
      }
    }
    return entity.notes || '';
  };

  // For editing groups, extract userNotes
  const getGroupUserNotes = (): string => {
    if (formData.type !== 'GRUPO') return formData.notes;
    try {
      const parsed = JSON.parse(formData.notes);
      return parsed.userNotes || '';
    } catch {
      return formData.notes;
    }
  };

  const setGroupUserNotes = (val: string) => {
    if (formData.type === 'GRUPO') {
      setFormData({ ...formData, notes: JSON.stringify({ members: groupMemberIds, userNotes: val }) });
    } else {
      setFormData({ ...formData, notes: val });
    }
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Entidade
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(['COLABORADOR', 'SOCIO', 'FORNECEDOR', 'GRUPO'] as EntityType[]).map(t => {
              const Icon = ENTITY_ICONS[t];
              return (
                <DropdownMenuItem key={t} onClick={() => openNew(t)}>
                  <Icon className="w-4 h-4 mr-2" />
                  Novo {ENTITY_TYPE_LABELS[t]}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Entities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(entity => {
          const Icon = ENTITY_ICONS[entity.type as EntityType] || Users;
          const ccName = getCostCenterName(entity.cost_center_id);
          const memberIds = getGroupMembers(entity);
          const memberEntities = memberIds.map(id => (entities || []).find(e => e.id === id)).filter(Boolean);
          const displayNotes = getDisplayNotes(entity);
          
          return (
            <Card key={entity.id} className={cn("transition-all hover:shadow-md", !entity.active && "opacity-60")}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm", ENTITY_BG[entity.type as EntityType])}>
                      {entity.type === 'GRUPO' ? <UsersRound className="w-5 h-5" /> : entity.name.charAt(0).toUpperCase()}
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
                  {displayNotes && <p className="italic">💬 {displayNotes}</p>}
                  {!entity.active && (
                    <Badge variant="outline" className="text-[10px] text-expense border-expense/30 mt-1">Inativo</Badge>
                  )}
                </div>

                {/* Group members */}
                {entity.type === 'GRUPO' && memberEntities.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">
                      Membros ({memberEntities.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {memberEntities.map(m => m && (
                        <Badge key={m.id} variant="outline" className={cn("text-[10px]", ENTITY_COLORS[m.type as EntityType])}>
                          {m.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {formData.type && ENTITY_ICONS[formData.type] && (() => {
                const Icon = ENTITY_ICONS[formData.type];
                return <Icon className="w-5 h-5" />;
              })()}
              {editingEntity ? `Editar ${ENTITY_TYPE_LABELS[formData.type]}` : `Novo ${ENTITY_TYPE_LABELS[formData.type]}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nome completo" />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={formData.type} onValueChange={v => {
                  setFormData({ ...formData, type: v as EntityType });
                  if (v !== 'GRUPO') setGroupMemberIds([]);
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['COLABORADOR', 'FORNECEDOR', 'SOCIO', 'GRUPO'] as EntityType[]).map(t => (
                      <SelectItem key={t} value={t}>{ENTITY_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type !== 'GRUPO' && (
              <>
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
              </>
            )}

            {/* Group Members */}
            {formData.type === 'GRUPO' && (
              <div className="border rounded-lg p-4 space-y-3">
                <Label className="font-semibold flex items-center gap-2">
                  <UsersRound className="w-4 h-4 text-info" />
                  Membros do Grupo ({groupMemberIds.length})
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar membros..."
                    value={groupSearchTerm}
                    onChange={e => setGroupSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <ScrollArea className="max-h-48">
                  <div className="space-y-1">
                    {filteredMembers.map(m => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer"
                        onClick={() => {
                          setGroupMemberIds(prev =>
                            prev.includes(m.id) ? prev.filter(i => i !== m.id) : [...prev, m.id]
                          );
                        }}
                      >
                        <Checkbox checked={groupMemberIds.includes(m.id)} className="pointer-events-none" />
                        <span className="text-sm flex-1">{m.name}</span>
                        <Badge variant="outline" className={cn("text-[9px]", ENTITY_COLORS[m.type as EntityType])}>
                          {ENTITY_TYPE_LABELS[m.type as EntityType]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {groupMemberIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t">
                    {groupMemberIds.map(id => {
                      const m = availableMembers.find(e => e.id === id);
                      return m ? (
                        <Badge key={id} variant="outline" className={cn("text-[10px] gap-1", ENTITY_COLORS[m.type as EntityType])}>
                          {m.name}
                          <button onClick={() => setGroupMemberIds(prev => prev.filter(i => i !== id))} className="hover:text-destructive">×</button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.type === 'GRUPO' ? getGroupUserNotes() : formData.notes}
                onChange={e => formData.type === 'GRUPO' ? setGroupUserNotes(e.target.value) : setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
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
