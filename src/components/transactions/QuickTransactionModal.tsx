import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useCreateTransaction, useClients } from '@/hooks/useTransactions';
import { useTransactionCategories, usePaymentMethods, type CategorySubtype } from '@/hooks/useFinancialConfig';

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

  const { data: clients } = useClients();
  const { data: categories } = useTransactionCategories();
  const { data: paymentMethods } = usePaymentMethods();
  const createTransaction = useCreateTransaction();

  // Filter categories by tipo AND subtype
  const effectiveSubtype = filterSubtype || (tipo === 'ENTRADA' ? 'AVULSA' : 'VARIAVEL');
  const filteredCategories = categories?.filter(c => c.type === tipo && c.subtype === effectiveSubtype && c.active) || [];

  // Get selected category to auto-fill account and cost center
  const selectedCategory = categories?.find(c => c.id === formData.categoria_id);

  const isEntrada = tipo === 'ENTRADA';
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
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const valor = parseFloat(formData.valor.replace(/\./g, '').replace(',', '.')) || 0;

    await createTransaction.mutateAsync({
      tipo_movimento: tipo,
      natureza,
      origem: 'LANCAMENTO_MANUAL',
      cliente_id: formData.cliente_id || null,
      competencia_mes: formData.competencia_mes,
      competencia_ano: formData.competencia_ano,
      valor,
      data_vencimento: formData.data_vencimento,
      descricao: formData.descricao,
      categoria_id: formData.categoria_id || null,
      // Auto-inherit from category
      centro_custo_id: selectedCategory?.cost_center_id || null,
      conta_id: selectedCategory?.default_account_id || null,
      forma_pagamento_id: formData.forma_pagamento_id || null,
      notes: formData.notes || null,
    });

    handleClose();
  };

  const canSubmit = formData.descricao.trim().length > 0 && formData.valor.trim().length > 0;

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
          {/* CATEGORY - Primary field */}
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
              placeholder={isEntrada ? "Ex: Serviço de consultoria pontual" : "Ex: Compra de material"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor *</Label>
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

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit || createTransaction.isPending}
            className="flex-1"
          >
            {createTransaction.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
