import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Pencil, AlertCircle, History, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatCurrency } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import type { TransactionWithClient } from '@/hooks/useTransactions';

interface TransactionEditModalProps {
  open: boolean;
  onClose: () => void;
  transaction: TransactionWithClient | null;
}

export function TransactionEditModal({ open, onClose, transaction }: TransactionEditModalProps) {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scope, setScope] = useState<'single' | 'future'>('single');

  // Form state
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [status, setStatus] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [entityId, setEntityId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [documentoTipo, setDocumentoTipo] = useState('');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch lookup data
  const { data: categories } = useQuery({
    queryKey: ['transaction_categories'],
    queryFn: async () => {
      const { data } = await supabase.from('transaction_categories').select('id, name, type, expense_type, subtype').eq('active', true).order('name');
      return data || [];
    },
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts_list'],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('id, name').eq('active', true).order('name');
      return data || [];
    },
  });

  const { data: costCenters } = useQuery({
    queryKey: ['cost_centers_list'],
    queryFn: async () => {
      const { data } = await supabase.from('cost_centers').select('id, name').eq('active', true).order('name');
      return data || [];
    },
  });

  const { data: entities } = useQuery({
    queryKey: ['entities_list'],
    queryFn: async () => {
      const { data } = await supabase.from('financial_entities').select('id, name, type').eq('active', true).order('name');
      return data || [];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients_list'],
    queryFn: async () => {
      const { data } = await supabase.from('recurring_clients').select('id, name').eq('active', true).order('name');
      return data || [];
    },
  });

  const isRecurring = transaction?.natureza === 'RECORRENTE';

  useEffect(() => {
    if (transaction && open) {
      setValor(String(transaction.valor));
      setDataVencimento(transaction.data_vencimento || '');
      setDataPagamento(transaction.data_pagamento || '');
      setStatus(transaction.status);
      setValorPago(transaction.valor_pago ? String(transaction.valor_pago) : '');
      setDescricao(transaction.descricao || '');
      setCategoryId((transaction as any).transaction_category_id || transaction.categoria_id || '');
      setAccountId((transaction as any).account_id || transaction.conta_id || '');
      setCostCenterId((transaction as any).cost_center_id || transaction.centro_custo_id || '');
      setEntityId(transaction.entity_id || '');
      setResponsavelId(transaction.responsavel_id || '');
      setClienteId((transaction as any).cliente_id || '');
      setDocumentoTipo(transaction.documento_tipo || '');
      setDocumentoNumero(transaction.documento_numero || '');
      setNotes(transaction.notes || '');
      setScope('single');
    }
  }, [transaction, open]);

  const handleSubmit = async () => {
    if (!transaction) return;
    
    const parsedValor = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
    if (!parsedValor || parsedValor <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    setIsSubmitting(true);
    try {
      // Audit history
      await supabase.from('transaction_history').insert({
        transaction_id: transaction.id,
        evento: 'ALTERADO' as const,
        modulo_origem: 'EDICAO_TRANSACAO',
        user_id: user?.id || 'system',
        dados_anteriores: {
          valor: transaction.valor,
          status: transaction.status,
          data_vencimento: transaction.data_vencimento,
          documento_tipo: transaction.documento_tipo,
          scope,
        },
      });

      // Build update object
      const updates: any = {
        valor: parsedValor,
        data_vencimento: dataVencimento,
        status,
        descricao,
        documento_tipo: documentoTipo || null,
        documento_numero: documentoNumero || null,
        notes: notes || null,
        transaction_category_id: categoryId || null,
        account_id: accountId || null,
        cost_center_id: costCenterId || null,
        entity_id: entityId || null,
        responsavel_id: responsavelId || null,
        cliente_id: clienteId || null,
      };

      // Handle payment fields
      if (status === 'PAGO') {
        updates.data_pagamento = dataPagamento || new Date().toISOString().split('T')[0];
        updates.valor_pago = parseFloat(valorPago.replace(/\./g, '').replace(',', '.')) || parsedValor;
      } else {
        updates.data_pagamento = null;
        updates.valor_pago = null;
      }

      // Role-based approval: financeiro edits reset to pending, admin edits don't
      if (role === 'financeiro') {
        updates.approval_status = 'pendente';
      }

      await supabase.from('transactions').update(updates).eq('id', transaction.id);

      // Handle recurring scope
      if (scope === 'future' && isRecurring) {
        const futureUpdates: any = {};
        
        // Copy fields that should propagate
        if (categoryId) futureUpdates.transaction_category_id = categoryId;
        if (accountId) futureUpdates.account_id = accountId;
        if (costCenterId) futureUpdates.cost_center_id = costCenterId;
        if (entityId) futureUpdates.entity_id = entityId;
        if (responsavelId) futureUpdates.responsavel_id = responsavelId;
        if (documentoTipo) futureUpdates.documento_tipo = documentoTipo;
        futureUpdates.valor = parsedValor;

        if (transaction.contrato_id) {
          const { data: futureInstallments } = await supabase
            .from('recurring_installments')
            .select('id')
            .eq('contract_id', transaction.contrato_id)
            .neq('status', 'PAGO')
            .or(`competence_year.gt.${transaction.competencia_ano},and(competence_year.eq.${transaction.competencia_ano},competence_month.gt.${transaction.competencia_mes})`);

          if (futureInstallments?.length) {
            const ids = futureInstallments.map(i => i.id);
            await supabase.from('recurring_installments').update({ expected_value: parsedValor }).in('id', ids);
            await supabase.from('transactions').update(futureUpdates).in('installment_id', ids).neq('status', 'PAGO');
          }
        } else if (transaction.fixed_expense_id) {
          await supabase
            .from('transactions')
            .update(futureUpdates)
            .eq('fixed_expense_id', transaction.fixed_expense_id)
            .neq('status', 'PAGO')
            .neq('id', transaction.id)
            .or(`competencia_ano.gt.${transaction.competencia_ano},and(competencia_ano.eq.${transaction.competencia_ano},competencia_mes.gt.${transaction.competencia_mes})`);
          
          // Update base fixed expense
          const feUpdates: any = { valor: parsedValor };
          if (categoryId) feUpdates.categoria_id = categoryId;
          if (accountId) feUpdates.conta_id = accountId;
          if (costCenterId) feUpdates.centro_custo_id = costCenterId;
          await supabase.from('fixed_expenses').update(feUpdates).eq('id', transaction.fixed_expense_id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-installments'] });
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approval-count'] });

      const msg = scope === 'future' && isRecurring
        ? 'Lançamento atualizado neste e em todos os próximos.'
        : 'Lançamento atualizado com sucesso.';
      toast.success(msg);
      onClose();
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transaction) return null;

  const filteredCategories = categories?.filter(c => c.type === transaction.tipo_movimento) || [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Lançamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current info */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <p className="text-sm font-medium">{transaction.descricao || '—'}</p>
            <p className="text-xs text-muted-foreground">
              {transaction.recurring_clients?.name || 'Sem cliente'} • 
              {' '}{transaction.competencia_mes.toString().padStart(2, '0')}/{transaction.competencia_ano}
              {isRecurring && ' • Recorrente'}
            </p>
            <p className="text-sm">
              Valor atual: <strong>{formatCurrency(Number(transaction.valor))}</strong>
            </p>
          </div>

          {/* Description */}
          <div>
            <Label>Descrição</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>

          {/* Value + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$) *</Label>
              <Input value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EM_ABERTO">Em Aberto</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
                  <SelectItem value="ATRASADO">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment fields when PAGO */}
          {status === 'PAGO' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor Pago</Label>
                <Input value={valorPago} onChange={(e) => setValorPago(e.target.value)} placeholder={valor} />
              </div>
              <div>
                <Label>Data Pagamento</Label>
                <Input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
              </div>
            </div>
          )}

          {/* Dates */}
          <div>
            <Label>Data Vencimento</Label>
            <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
          </div>

          {/* Cliente */}
          <div>
            <Label>Cliente</Label>
            <Select value={clienteId || '__none__'} onValueChange={(v) => setClienteId(v === '__none__' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {clients?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category + Account */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={categoryId || '__none__'} onValueChange={(v) => setCategoryId(v === '__none__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {filteredCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conta</Label>
              <Select value={accountId || '__none__'} onValueChange={(v) => setAccountId(v === '__none__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {accounts?.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cost Center + Responsible */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Centro de Custo</Label>
              <Select value={costCenterId || '__none__'} onValueChange={(v) => setCostCenterId(v === '__none__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {costCenters?.map(cc => (
                    <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável</Label>
              <Select value={responsavelId || '__none__'} onValueChange={(v) => setResponsavelId(v === '__none__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {entities?.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Document type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo Documento</Label>
              <Select value={documentoTipo} onValueChange={setDocumentoTipo}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEM_DOCUMENTO">Sem Documento</SelectItem>
                  <SelectItem value="NF">Nota Fiscal</SelectItem>
                  <SelectItem value="RECIBO">Recibo</SelectItem>
                  <SelectItem value="NOTA_DEBITO">Nota de Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nº Documento</Label>
              <Input value={documentoNumero} onChange={(e) => setDocumentoNumero(e.target.value)} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {/* Recurring scope */}
          {isRecurring && (
            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                Aplicar alteração em:
              </p>
              <RadioGroup value={scope} onValueChange={(v) => setScope(v as 'single' | 'future')}>
                <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer">
                  <RadioGroupItem value="single" id="edit-scope-single" className="mt-0.5" />
                  <label htmlFor="edit-scope-single" className="cursor-pointer">
                    <p className="text-sm font-medium">Somente neste lançamento</p>
                    <p className="text-xs text-muted-foreground">
                      Apenas na competência {transaction.competencia_mes.toString().padStart(2, '0')}/{transaction.competencia_ano}
                    </p>
                  </label>
                </div>
                <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer">
                  <RadioGroupItem value="future" id="edit-scope-future" className="mt-0.5" />
                  <label htmlFor="edit-scope-future" className="cursor-pointer">
                    <p className="text-sm font-medium">Este e todos os próximos</p>
                    <p className="text-xs text-muted-foreground">Atualiza este e todos os lançamentos futuros em aberto</p>
                  </label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Approval note */}
          {role === 'financeiro' && (
            <div className="flex items-start gap-2 p-2 rounded bg-warning/10 text-xs text-warning">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Esta alteração enviará o lançamento para re-aprovação.</span>
            </div>
          )}

          {/* Audit note */}
          <div className="flex items-start gap-2 p-2 rounded bg-muted/30 text-xs text-muted-foreground">
            <History className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Os valores anteriores serão preservados no histórico para fins de auditoria.</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
