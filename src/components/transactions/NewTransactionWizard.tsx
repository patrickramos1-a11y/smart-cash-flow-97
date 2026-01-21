import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowDownCircle, ArrowUpCircle, RefreshCw, FileText, 
  ChevronRight, ChevronLeft, Check, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateTransaction, useClients } from '@/hooks/useTransactions';
import { useCreateFixedExpense, useGenerateFixedExpenseTransactions } from '@/hooks/useFixedExpenses';
import { mockTransactionCategories, mockCostCenters, mockAccounts, mockPaymentMethods } from '@/data/mockData';

interface NewTransactionWizardProps {
  open: boolean;
  onClose: () => void;
  defaultMonth?: number;
  defaultYear?: number;
}

type Step = 'tipo' | 'natureza' | 'form';
type TipoMovimento = 'ENTRADA' | 'SAIDA';
type Natureza = 'RECORRENTE' | 'AVULSA';

export function NewTransactionWizard({ open, onClose, defaultMonth, defaultYear }: NewTransactionWizardProps) {
  const currentDate = new Date();
  const [step, setStep] = useState<Step>('tipo');
  const [tipo, setTipo] = useState<TipoMovimento | null>(null);
  const [natureza, setNatureza] = useState<Natureza | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    cliente_id: '',
    categoria_id: '',
    centro_custo_id: '',
    conta_id: '',
    forma_pagamento_id: '',
    data_vencimento: currentDate.toISOString().split('T')[0],
    competencia_mes: defaultMonth || currentDate.getMonth() + 1,
    competencia_ano: defaultYear || currentDate.getFullYear(),
    notes: '',
    // For fixed expenses
    dia_vencimento: 10,
  });

  const { data: clients } = useClients();
  const createTransaction = useCreateTransaction();
  const createFixedExpense = useCreateFixedExpense();
  const generateFixedExpenseTransactions = useGenerateFixedExpenseTransactions();

  const resetWizard = () => {
    setStep('tipo');
    setTipo(null);
    setNatureza(null);
    setFormData({
      descricao: '',
      valor: '',
      cliente_id: '',
      categoria_id: '',
      centro_custo_id: '',
      conta_id: '',
      forma_pagamento_id: '',
      data_vencimento: currentDate.toISOString().split('T')[0],
      competencia_mes: defaultMonth || currentDate.getMonth() + 1,
      competencia_ano: defaultYear || currentDate.getFullYear(),
      notes: '',
      dia_vencimento: 10,
    });
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const handleSubmit = async () => {
    if (!tipo || !natureza) return;

    const valor = parseFloat(formData.valor.replace(/\./g, '').replace(',', '.')) || 0;

    if (tipo === 'SAIDA' && natureza === 'RECORRENTE') {
      // Create fixed expense
      await createFixedExpense.mutateAsync({
        nome: formData.descricao,
        valor,
        dia_vencimento: formData.dia_vencimento,
        categoria_id: formData.categoria_id || null,
        centro_custo_id: formData.centro_custo_id || null,
        conta_id: formData.conta_id || null,
        forma_pagamento_id: formData.forma_pagamento_id || null,
        notes: formData.notes || null,
      });

      // Generate transactions for current month
      await generateFixedExpenseTransactions.mutateAsync({
        year: formData.competencia_ano,
        month: formData.competencia_mes,
      });
    } else {
      // Create regular transaction
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
        centro_custo_id: formData.centro_custo_id || null,
        conta_id: formData.conta_id || null,
        forma_pagamento_id: formData.forma_pagamento_id || null,
        notes: formData.notes || null,
      });
    }

    handleClose();
  };

  const isSubmitting = createTransaction.isPending || createFixedExpense.isPending;

  const filteredCategories = mockTransactionCategories.filter(c => 
    tipo === 'ENTRADA' ? c.nature === 'ENTRADA' : c.nature === 'SAIDA'
  );

  const renderStepContent = () => {
    switch (step) {
      case 'tipo':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-center">
              Que tipo de lançamento você deseja criar?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:border-income",
                  tipo === 'ENTRADA' && "border-income bg-income/5"
                )}
                onClick={() => { setTipo('ENTRADA'); setStep('natureza'); }}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                  <ArrowDownCircle className="w-12 h-12 text-income" />
                  <span className="font-medium">Entrada</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Receitas, pagamentos de clientes
                  </span>
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:border-expense",
                  tipo === 'SAIDA' && "border-expense bg-expense/5"
                )}
                onClick={() => { setTipo('SAIDA'); setStep('natureza'); }}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                  <ArrowUpCircle className="w-12 h-12 text-expense" />
                  <span className="font-medium">Saída</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Despesas, pagamentos, custos
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'natureza':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-center">
              {tipo === 'ENTRADA' 
                ? 'Esta entrada é recorrente ou avulsa?' 
                : 'Esta despesa é fixa ou pontual?'}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:border-primary",
                  natureza === 'RECORRENTE' && "border-primary bg-primary/5"
                )}
                onClick={() => { setNatureza('RECORRENTE'); setStep('form'); }}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                  <RefreshCw className="w-12 h-12 text-primary" />
                  <span className="font-medium">
                    {tipo === 'ENTRADA' ? 'Recorrente' : 'Fixa'}
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    {tipo === 'ENTRADA' 
                      ? 'Vinculada a um contrato mensal' 
                      : 'Despesa mensal automática'}
                  </span>
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:border-secondary",
                  natureza === 'AVULSA' && "border-secondary bg-secondary/5"
                )}
                onClick={() => { setNatureza('AVULSA'); setStep('form'); }}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                  <FileText className="w-12 h-12 text-secondary-foreground" />
                  <span className="font-medium">
                    {tipo === 'ENTRADA' ? 'Avulsa' : 'Pontual'}
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    {tipo === 'ENTRADA' 
                      ? 'Lançamento único, sem contrato' 
                      : 'Despesa eventual, única'}
                  </span>
                </CardContent>
              </Card>
            </div>

            <Button variant="ghost" onClick={() => setStep('tipo')} className="w-full">
              <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          </div>
        );

      case 'form':
        const isFixedExpense = tipo === 'SAIDA' && natureza === 'RECORRENTE';
        
        return (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                tipo === 'ENTRADA' ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
              )}>
                {tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {natureza === 'RECORRENTE' 
                  ? (tipo === 'ENTRADA' ? 'Recorrente' : 'Fixa') 
                  : (tipo === 'ENTRADA' ? 'Avulsa' : 'Pontual')}
              </span>
            </div>

            <div className="grid gap-4">
              <div>
                <Label>Descrição *</Label>
                <Input 
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder={isFixedExpense ? "Ex: Aluguel Escritório" : "Ex: Serviço de consultoria"}
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
                
                {isFixedExpense ? (
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
                ) : (
                  <div>
                    <Label>Data Vencimento *</Label>
                    <Input 
                      type="date"
                      value={formData.data_vencimento}
                      onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {tipo === 'ENTRADA' && (
                <div>
                  <Label>Cliente</Label>
                  <Select 
                    value={formData.cliente_id} 
                    onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}
                  >
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
                  <Label>Categoria</Label>
                  <Select 
                    value={formData.categoria_id} 
                    onValueChange={(v) => setFormData({ ...formData, categoria_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Centro de Custo</Label>
                  <Select 
                    value={formData.centro_custo_id} 
                    onValueChange={(v) => setFormData({ ...formData, centro_custo_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCostCenters.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Conta</Label>
                  <Select 
                    value={formData.conta_id} 
                    onValueChange={(v) => setFormData({ ...formData, conta_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockAccounts.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select 
                    value={formData.forma_pagamento_id} 
                    onValueChange={(v) => setFormData({ ...formData, forma_pagamento_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPaymentMethods.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!isFixedExpense && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Competência - Mês</Label>
                    <Select 
                      value={formData.competencia_mes.toString()} 
                      onValueChange={(v) => setFormData({ ...formData, competencia_mes: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Competência - Ano</Label>
                    <Select 
                      value={formData.competencia_ano.toString()} 
                      onValueChange={(v) => setFormData({ ...formData, competencia_ano: parseInt(v) })}
                    >
                      <SelectTrigger>
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
              )}

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

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('natureza')} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={!formData.descricao || !formData.valor || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'tipo' && 'Novo Lançamento'}
            {step === 'natureza' && `Nova ${tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}`}
            {step === 'form' && 'Detalhes do Lançamento'}
          </DialogTitle>
        </DialogHeader>
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
