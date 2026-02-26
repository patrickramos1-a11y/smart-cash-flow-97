import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Loader2, ArrowDownCircle, ArrowUpCircle, Repeat, Split } from 'lucide-react';
import { useCreateTransaction, useClients } from '@/hooks/useTransactions';
import { useTransactionCategories, usePaymentMethods, type CategorySubtype } from '@/hooks/useFinancialConfig';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface QuickTransactionModalProps {
  open: boolean;
  onClose: () => void;
  tipo: 'ENTRADA' | 'SAIDA';
  natureza: 'AVULSA';
  defaultMonth?: number;
  defaultYear?: number;
  filterSubtype?: CategorySubtype;
}

export function QuickTransactionModal({ 
  open, onClose, tipo, natureza, defaultMonth, defaultYear, filterSubtype
}: QuickTransactionModalProps) {
  const currentDate = new Date();
  const month = defaultMonth || currentDate.getMonth() + 1;
  const year = defaultYear || currentDate.getFullYear();

  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    cliente_id: '',
    categoria_id: '',
    forma_pagamento_id: '',
    data_vencimento: currentDate.toISOString().split('T')[0],
    competencia_mes: month,
    competencia_ano: year,
    notes: '',
  });

  // Repetition state
  const [enableRepetition, setEnableRepetition] = useState(false);
  const [repetitionCount, setRepetitionCount] = useState(2);
  const [repetitionMode, setRepetitionMode] = useState<'parcelamento' | 'repeticao'>('parcelamento');

  const { data: clients } = useClients();
  const { data: categories } = useTransactionCategories();
  const { data: paymentMethods } = usePaymentMethods();
  const createTransaction = useCreateTransaction();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveSubtype = filterSubtype || (tipo === 'ENTRADA' ? 'AVULSA' : 'VARIAVEL');
  const filteredCategories = categories?.filter(c => c.type === tipo && c.subtype === effectiveSubtype && c.active) || [];
  const selectedCategory = categories?.find(c => c.id === formData.categoria_id);

  const isEntrada = tipo === 'ENTRADA';
  const isVariavel = effectiveSubtype === 'VARIAVEL';
  const label = isEntrada ? 'Nova Entrada Avulsa' : 'Nova Despesa Variável';

  const resetForm = () => {
    setFormData({
      descricao: '',
      valor: '',
      cliente_id: '',
      categoria_id: '',
      forma_pagamento_id: '',
      data_vencimento: currentDate.toISOString().split('T')[0],
      competencia_mes: month,
      competencia_ano: year,
      notes: '',
    });
    setEnableRepetition(false);
    setRepetitionCount(2);
    setRepetitionMode('parcelamento');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const valorTotal = parseFloat(formData.valor.replace(/\./g, '').replace(',', '.')) || 0;

    if (!enableRepetition || repetitionCount <= 1) {
      // Single transaction
      await createTransaction.mutateAsync({
        tipo_movimento: tipo,
        natureza,
        origem: 'LANCAMENTO_MANUAL',
        cliente_id: formData.cliente_id || null,
        competencia_mes: formData.competencia_mes,
        competencia_ano: formData.competencia_ano,
        valor: valorTotal,
        data_vencimento: formData.data_vencimento,
        descricao: formData.descricao,
        categoria_id: formData.categoria_id || null,
        centro_custo_id: selectedCategory?.cost_center_id || null,
        conta_id: selectedCategory?.default_account_id || null,
        forma_pagamento_id: formData.forma_pagamento_id || null,
        notes: formData.notes || null,
      });
      handleClose();
      return;
    }

    // Batch creation for repetition/installments
    setIsSubmitting(true);
    try {
      const valorParcela = repetitionMode === 'parcelamento' 
        ? Math.round((valorTotal / repetitionCount) * 100) / 100 
        : valorTotal;

      let currentMonth = formData.competencia_mes;
      let currentYear = formData.competencia_ano;

      for (let i = 0; i < repetitionCount; i++) {
        const suffix = repetitionMode === 'parcelamento'
          ? ` - Parcela ${i + 1}/${repetitionCount}`
          : ` - Repetição ${i + 1}/${repetitionCount}`;

        const dueDate = new Date(currentYear, currentMonth - 1, new Date(formData.data_vencimento).getDate());

        await createTransaction.mutateAsync({
          tipo_movimento: tipo,
          natureza,
          origem: 'LANCAMENTO_MANUAL',
          cliente_id: formData.cliente_id || null,
          competencia_mes: currentMonth,
          competencia_ano: currentYear,
          valor: valorParcela,
          data_vencimento: dueDate.toISOString().split('T')[0],
          descricao: formData.descricao + suffix,
          categoria_id: formData.categoria_id || null,
          centro_custo_id: selectedCategory?.cost_center_id || null,
          conta_id: selectedCategory?.default_account_id || null,
          forma_pagamento_id: formData.forma_pagamento_id || null,
          notes: formData.notes || null,
        });

        // Advance month
        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`${repetitionCount} lançamentos criados com sucesso!`);
      handleClose();
    } catch (error) {
      console.error('Batch creation error:', error);
      toast.error('Erro ao criar lançamentos em lote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = formData.descricao.trim().length > 0 && formData.valor.trim().length > 0;
  const valorTotal = parseFloat(formData.valor.replace(/\./g, '').replace(',', '.')) || 0;
  const valorParcela = enableRepetition && repetitionMode === 'parcelamento' && repetitionCount > 1
    ? Math.round((valorTotal / repetitionCount) * 100) / 100
    : valorTotal;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEntrada ? (
              <ArrowDownCircle className="w-5 h-5 text-income" />
            ) : (
              <ArrowUpCircle className="w-5 h-5 text-expense" />
            )}
            {label}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-2">
          <Badge variant="outline" className={isEntrada ? "text-income border-income/30" : "text-expense border-expense/30"}>
            {isEntrada ? 'Entrada' : 'Saída'}
          </Badge>
          <Badge variant="outline">Avulsa / Pontual</Badge>
        </div>

        <div className="space-y-4">
          {/* CATEGORY */}
          <div>
            <Label>Categoria *</Label>
            <Select value={formData.categoria_id} onValueChange={(v) => setFormData({ ...formData, categoria_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color || '#6366f1' }} />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory && (
              <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                <span>Conta: <strong>{(selectedCategory as any).default_account?.name || '—'}</strong></span>
                <span>C. Custo: <strong>{selectedCategory.cost_center?.name || '—'}</strong></span>
              </div>
            )}
          </div>

          <div>
            <Label>Descrição *</Label>
            <Input 
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder={isEntrada ? "Ex: Serviço de consultoria pontual" : "Ex: Compra de notebook"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{enableRepetition && repetitionMode === 'parcelamento' ? 'Valor Total *' : 'Valor *'}</Label>
              <Input 
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label>Data de Vencimento *</Label>
              <Input 
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
              />
            </div>
          </div>

          {/* REPETITION - only for variable expenses */}
          {isVariavel && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Repetir este lançamento</Label>
                </div>
                <Switch checked={enableRepetition} onCheckedChange={setEnableRepetition} />
              </div>

              {enableRepetition && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Modo</Label>
                      <Select value={repetitionMode} onValueChange={(v) => setRepetitionMode(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parcelamento">
                            <div className="flex items-center gap-2">
                              <Split className="w-3 h-3" />
                              Parcelamento (divide valor)
                            </div>
                          </SelectItem>
                          <SelectItem value="repeticao">
                            <div className="flex items-center gap-2">
                              <Repeat className="w-3 h-3" />
                              Repetição (mesmo valor)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Quantas vezes</Label>
                      <Select value={repetitionCount.toString()} onValueChange={(v) => setRepetitionCount(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 23 }, (_, i) => i + 2).map(n => (
                            <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {valorTotal > 0 && (
                    <div className="text-xs text-muted-foreground bg-background rounded p-2 space-y-1">
                      {repetitionMode === 'parcelamento' ? (
                        <>
                          <p>Valor total: <strong>R$ {valorTotal.toFixed(2)}</strong></p>
                          <p>Valor por parcela: <strong>R$ {valorParcela.toFixed(2)}</strong></p>
                          <p>{repetitionCount} parcelas mensais a partir de {formData.competencia_mes}/{formData.competencia_ano}</p>
                        </>
                      ) : (
                        <>
                          <p>Valor por mês: <strong>R$ {valorTotal.toFixed(2)}</strong></p>
                          <p>Total acumulado: <strong>R$ {(valorTotal * repetitionCount).toFixed(2)}</strong></p>
                          <p>{repetitionCount} repetições mensais a partir de {formData.competencia_mes}/{formData.competencia_ano}</p>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Client - only for ENTRADA */}
          {isEntrada && (
            <div>
              <Label>Cliente</Label>
              <Select value={formData.cliente_id} onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={formData.forma_pagamento_id} onValueChange={(v) => setFormData({ ...formData, forma_pagamento_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods?.filter(p => p.active).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Competência</Label>
              <div className="flex gap-1">
                <Select 
                  value={formData.competencia_mes.toString()} 
                  onValueChange={(v) => setFormData({ ...formData, competencia_mes: parseInt(v) })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'short' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={formData.competencia_ano.toString()} 
                  onValueChange={(v) => setFormData({ ...formData, competencia_ano: parseInt(v) })}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea 
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionais..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit || createTransaction.isPending || isSubmitting}
            className="flex-1"
          >
            {(createTransaction.isPending || isSubmitting) ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {enableRepetition && repetitionCount > 1
              ? `Criar ${repetitionCount} lançamentos`
              : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
