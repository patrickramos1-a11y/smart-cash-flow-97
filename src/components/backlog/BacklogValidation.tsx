import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  BacklogValidation as BacklogValidationType,
  BacklogValidationType as ValidationType,
  validationTypeLabels,
  useCreateBacklogValidation
} from '@/hooks/useBacklog';

interface BacklogValidationProps {
  itemId: string;
  validations: BacklogValidationType[];
}

export function BacklogValidation({ itemId, validations }: BacklogValidationProps) {
  const [showForm, setShowForm] = useState(false);
  const createValidation = useCreateBacklogValidation();

  const [formData, setFormData] = useState({
    validated: false,
    validation_date: new Date().toISOString().split('T')[0],
    validated_by: '',
    validation_type: 'TESTE_FUNCIONAL' as ValidationType,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createValidation.mutateAsync({
      backlog_item_id: itemId,
      ...formData,
      validated_by: formData.validated_by || null,
      notes: formData.notes || null
    });

    setShowForm(false);
    setFormData({
      validated: false,
      validation_date: new Date().toISOString().split('T')[0],
      validated_by: '',
      validation_type: 'TESTE_FUNCIONAL',
      notes: ''
    });
  };

  const validationTypes: ValidationType[] = [
    'TESTE_FUNCIONAL', 'VALIDACAO_VISUAL', 'VALIDACAO_TECNICA', 'VALIDACAO_REGRA_NEGOCIO'
  ];

  const hasValidation = validations.some(v => v.validated);

  return (
    <div className="space-y-4">
      {/* Warning if no validation */}
      {!hasValidation && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Validação Obrigatória</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Este item não pode ser marcado como "Validado" sem uma confirmação de entrega registrada.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Validation Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Validação
        </Button>
      </div>

      {/* Validations List */}
      {validations.length > 0 ? (
        <div className="space-y-3">
          {validations.map((validation) => (
            <Card key={validation.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {validation.validated ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={validation.validated ? 'default' : 'destructive'}>
                        {validation.validated ? 'Validado' : 'Não Validado'}
                      </Badge>
                      {validation.validation_type && (
                        <Badge variant="outline">
                          {validationTypeLabels[validation.validation_type]}
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm space-y-1">
                      {validation.validated_by && (
                        <p><span className="text-muted-foreground">Validado por:</span> {validation.validated_by}</p>
                      )}
                      {validation.validation_date && (
                        <p><span className="text-muted-foreground">Data:</span> {format(new Date(validation.validation_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                      )}
                      {validation.notes && (
                        <p className="text-muted-foreground mt-2">{validation.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {format(new Date(validation.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma validação registrada</p>
            <p className="text-sm">Adicione uma confirmação de entrega</p>
          </CardContent>
        </Card>
      )}

      {/* Validation Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Confirmação de Entrega</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="validated"
                checked={formData.validated}
                onCheckedChange={(v) => setFormData({ ...formData, validated: v })}
              />
              <Label htmlFor="validated">Entrega Validada</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Validação</Label>
                <Select
                  value={formData.validation_type}
                  onValueChange={(v) => setFormData({ ...formData, validation_type: v as ValidationType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {validationTypes.map(t => (
                      <SelectItem key={t} value={t}>{validationTypeLabels[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validation_date">Data da Validação</Label>
                <Input
                  id="validation_date"
                  type="date"
                  value={formData.validation_date}
                  onChange={(e) => setFormData({ ...formData, validation_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validated_by">Validado por</Label>
              <Input
                id="validated_by"
                value={formData.validated_by}
                onChange={(e) => setFormData({ ...formData, validated_by: e.target.value })}
                placeholder="Nome do validador"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre a validação..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createValidation.isPending}>
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
