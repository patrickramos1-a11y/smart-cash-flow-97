import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, CheckCircle2, XCircle, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  BacklogImplementationRecord,
  BacklogImplementationStatus,
  useCreateBacklogImplementationRecord
} from '@/hooks/useBacklog';

interface BacklogImplementationsProps {
  itemId: string;
  records: BacklogImplementationRecord[];
}

export function BacklogImplementations({ itemId, records }: BacklogImplementationsProps) {
  const [showForm, setShowForm] = useState(false);
  const createRecord = useCreateBacklogImplementationRecord();

  const [formData, setFormData] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0],
    responsible: '',
    status: 'EXECUTADO' as BacklogImplementationStatus
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description) return;

    await createRecord.mutateAsync({
      backlog_item_id: itemId,
      ...formData,
      responsible: formData.responsible || null
    });

    setShowForm(false);
    setFormData({
      description: '',
      date: new Date().toISOString().split('T')[0],
      responsible: '',
      status: 'EXECUTADO'
    });
  };

  return (
    <div className="space-y-4">
      {/* Add Record Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Registro
        </Button>
      </div>

      {/* Records List */}
      {records.length > 0 ? (
        <div className="space-y-3">
          {records.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {record.status === 'EXECUTADO' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-amber-500" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={record.status === 'EXECUTADO' ? 'default' : 'secondary'}>
                        {record.status === 'EXECUTADO' ? 'Executado' : 'Não Executado'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(record.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>

                    <p className="text-sm">{record.description}</p>

                    {record.responsible && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Responsável: {record.responsible}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum registro de implementação</p>
            <p className="text-sm">Documente os ajustes realizados</p>
          </CardContent>
        </Card>
      )}

      {/* Record Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Registro de Implementação</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição do Ajuste *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o que foi implementado ou ajustado..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as BacklogImplementationStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXECUTADO">Executado</SelectItem>
                    <SelectItem value="NAO_EXECUTADO">Não Executado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible">Responsável</Label>
              <Input
                id="responsible"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createRecord.isPending || !formData.description}>
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
