import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Building2, Info } from 'lucide-react';
import { useCreateFixedExpense, useGenerateFixedExpenseTransactions } from '@/hooks/useFixedExpenses';
import { useAccounts, useTransactionCategories, useCostCenters, usePaymentMethods } from '@/hooks/useFinancialConfig';
import { formatCurrency } from '@/data/mockData';

interface NewFixedExpenseModalProps {
  open: boolean;
  onClose: () => void;
  defaultMonth?: number;
  defaultYear?: number;
}

export function NewFixedExpenseModal({ open, onClose, defaultMonth, defaultYear }: NewFixedExpenseModalProps) {
  const currentYear = defaultYear || new Date().getFullYear();
  const currentMonth = defaultMonth || new Date().getMonth() + 1;

  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    dia_vencimento: 10,
    conta_id: '',
    categoria_id: '',
    forma_pagamento_id: '',
    data_inicio: `${currentYear}-01-01`,
    data_fim: '',
    notes: '',
  });

  const { data: accounts } = useAccounts();
  const { data: categories } = useTransactionCategories();
  const { data: costCenters } = useCostCenters();
  const { data: paymentMethods } = usePaymentMethods();
  
  const createFixedExpense = useCreateFixedExpense();
  const generateTransactions = useGenerateFixedExpenseTransactions();

  // Filter categories to SAIDA type
  const expenseCategories = categories?.filter(c => c.type === 'SAIDA') || [];
  
  // Get linked cost center from selected category
  const selectedCategory = categories?.find(c => c.id === formData.categoria_id);
  const linkedCostCenter = costCenters?.find(cc => cc.id === selectedCategory?.cost_center_id);

  const valor = parseFloat(formData.valor.replace(/\./g, '').replace(',', '.')) || 0;

  const resetForm = () => {
    setFormData({
      nome: '',
      valor: '',
      dia_vencimento: 10,
      conta_id: '',
      categoria_id: '',
      forma_pagamento_id: '',
      data_inicio: `${currentYear}-01-01`,
      data_fim: '',
      notes: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    // 1. Create the fixed expense
    await createFixedExpense.mutateAsync({
      nome: formData.nome,
      valor,
      dia_vencimento: formData.dia_vencimento,
      categoria_id: formData.categoria_id || null,
      centro_custo_id: linkedCostCenter?.id || null,
      conta_id: formData.conta_id || null,
      forma_pagamento_id: formData.forma_pagamento_id || null,
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim || null,
      notes: formData.notes || null,
    });

    // 2. Generate transactions for ALL remaining months of the year
    for (let m = 1; m <= 12; m++) {
      await generateTransactions.mutateAsync({
        year: currentYear,
        month: m,
      });
    }

    handleClose();
  };

  const isSubmitting = createFixedExpense.isPending || generateTransactions.isPending;
  const canSubmit = formData.nome.trim().length > 0 && valor > 0 && formData.dia_vencimento >= 1 && formData.dia_vencimento <= 31;

  // Calculate annual projection
  const startDate = new Date(formData.data_inicio);
  const startMonth = startDate.getMonth() + 1;
  const monthsInYear = 12 - startMonth + 1;
  const annualProjection = valor * monthsInYear;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-expense" />
            Nova Despesa Fixa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic info */}
          <div>
            <Label>Nome / Fornecedor *</Label>
            <Input 
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Aluguel Escritório, Internet, Contador..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor Mensal (R$) *</Label>
              <Input 
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label>Dia do Vencimento *</Label>
              <Input 
                type="number"
                min={1}
                max={31}
                value={formData.dia_vencimento}
                onChange={(e) => setFormData({ ...formData, dia_vencimento: parseInt(e.target.value) || 10 })}
              />
            </div>
          </div>

          {/* Account and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Conta de Pagamento</Label>
              <Select value={formData.conta_id} onValueChange={(v) => setFormData({ ...formData, conta_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.filter(a => a.active).map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>

          <div>
            <Label>Categoria</Label>
            <Select value={formData.categoria_id} onValueChange={(v) => setFormData({ ...formData, categoria_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar categoria" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {linkedCostCenter && (
              <p className="text-xs text-muted-foreground mt-1">
                Centro de Custo: <span className="font-medium">{linkedCostCenter.name}</span> ({linkedCostCenter.dre_label})
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Início</Label>
              <Input 
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              />
            </div>
            <div>
              <Label>Data de Fim (opcional)</Label>
              <Input 
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              />
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

          {/* Summary */}
          {valor > 0 && (
            <Card className="bg-expense/5 border-expense/20">
              <CardContent className="p-3 text-sm space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-expense" />
                  <span className="font-medium">Resumo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Mensal:</span>
                  <span className="font-bold text-expense">{formatCurrency(valor)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vencimento:</span>
                  <span>Todo dia {formData.dia_vencimento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projeção Anual:</span>
                  <span className="font-medium">{formatCurrency(annualProjection)}</span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t">
                  <span className="text-muted-foreground">Descrição gerada:</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {formData.nome || '...'} — MM/{currentYear}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Criar Despesa e Gerar Lançamentos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
