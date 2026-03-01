import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Pencil, AlertCircle, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatCurrency } from '@/data/mockData';
import type { TransactionWithClient } from '@/hooks/useTransactions';

interface EditRecurringValueModalProps {
  open: boolean;
  onClose: () => void;
  transaction: TransactionWithClient | null;
}

export function EditRecurringValueModal({ open, onClose, transaction }: EditRecurringValueModalProps) {
  const [newValue, setNewValue] = useState('');
  const [scope, setScope] = useState<'single' | 'future'>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleOpen = () => {
    if (transaction) {
      setNewValue(String(transaction.valor));
      setScope('single');
    }
  };

  const handleSubmit = async () => {
    if (!transaction) return;
    const valor = parseFloat(newValue.replace(/\./g, '').replace(',', '.'));
    if (!valor || valor <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Save audit history with old value
      await supabase.from('transaction_history').insert({
        transaction_id: transaction.id,
        evento: 'ALTERADO',
        modulo_origem: 'EDICAO_RECORRENTE',
        user_id: 'system',
        dados_anteriores: { valor: transaction.valor, scope },
      });

      // 2. Update this transaction
      await supabase
        .from('transactions')
        .update({ valor })
        .eq('id', transaction.id);

      if (scope === 'future') {
        // 3. Update all future EM_ABERTO transactions from same contract/fixed_expense
        if (transaction.contrato_id) {
          // Recurring contract: update future installments + transactions
          const { data: futureInstallments } = await supabase
            .from('recurring_installments')
            .select('id')
            .eq('contract_id', transaction.contrato_id)
            .neq('status', 'PAGO')
            .or(
              `competence_year.gt.${transaction.competencia_ano},and(competence_year.eq.${transaction.competencia_ano},competence_month.gt.${transaction.competencia_mes})`
            );

          if (futureInstallments && futureInstallments.length > 0) {
            const ids = futureInstallments.map(i => i.id);
            
            // Update installments expected_value
            await supabase
              .from('recurring_installments')
              .update({ expected_value: valor })
              .in('id', ids);

            // Update linked transactions
            await supabase
              .from('transactions')
              .update({ valor })
              .in('installment_id', ids)
              .neq('status', 'PAGO');
          }
        } else if (transaction.fixed_expense_id) {
          // Fixed expense: update future transactions
          await supabase
            .from('transactions')
            .update({ valor })
            .eq('fixed_expense_id', transaction.fixed_expense_id)
            .neq('status', 'PAGO')
            .or(
              `competencia_ano.gt.${transaction.competencia_ano},and(competencia_ano.eq.${transaction.competencia_ano},competencia_mes.gt.${transaction.competencia_mes})`
            );

          // Also update the fixed_expense base value
          await supabase
            .from('fixed_expenses')
            .update({ valor })
            .eq('id', transaction.fixed_expense_id);
        } else {
          // Generic recurring: update future transactions with same description
          await supabase
            .from('transactions')
            .update({ valor })
            .eq('natureza', 'RECORRENTE')
            .eq('descricao', transaction.descricao)
            .neq('status', 'PAGO')
            .neq('id', transaction.id)
            .or(
              `competencia_ano.gt.${transaction.competencia_ano},and(competencia_ano.eq.${transaction.competencia_ano},competencia_mes.gt.${transaction.competencia_mes})`
            );
        }
      }

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-installments'] });
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });

      const msg = scope === 'single'
        ? 'Valor atualizado apenas neste lançamento.'
        : 'Valor atualizado neste e em todos os próximos lançamentos.';
      toast.success(msg);
      onClose();
    } catch (error: any) {
      console.error('Error updating recurring value:', error);
      toast.error('Erro ao atualizar valor: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); else handleOpen(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Valor Recorrente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current info */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <p className="text-sm font-medium">{transaction.descricao || '—'}</p>
            <p className="text-xs text-muted-foreground">
              {transaction.recurring_clients?.name || 'Sem cliente'} • 
              {' '}{transaction.competencia_mes.toString().padStart(2, '0')}/{transaction.competencia_ano}
            </p>
            <p className="text-sm">
              Valor atual: <strong>{formatCurrency(Number(transaction.valor))}</strong>
            </p>
          </div>

          {/* New value */}
          <div>
            <Label>Novo Valor (R$) *</Label>
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="0,00"
              autoFocus
            />
          </div>

          {/* Scope selection */}
          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              Aplicar alteração em:
            </p>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as 'single' | 'future')}>
              <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer">
                <RadioGroupItem value="single" id="scope-single" className="mt-0.5" />
                <label htmlFor="scope-single" className="cursor-pointer">
                  <p className="text-sm font-medium">Somente neste lançamento</p>
                  <p className="text-xs text-muted-foreground">O valor muda apenas na competência {transaction.competencia_mes.toString().padStart(2, '0')}/{transaction.competencia_ano}</p>
                </label>
              </div>
              <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer">
                <RadioGroupItem value="future" id="scope-future" className="mt-0.5" />
                <label htmlFor="scope-future" className="cursor-pointer">
                  <p className="text-sm font-medium">Este e todos os próximos</p>
                  <p className="text-xs text-muted-foreground">Atualiza este e todos os lançamentos futuros em aberto</p>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Audit note */}
          <div className="flex items-start gap-2 p-2 rounded bg-muted/30 text-xs text-muted-foreground">
            <History className="w-4 h-4 mt-0.5 shrink-0" />
            <span>O valor anterior será preservado no histórico para fins de auditoria.</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Pencil className="w-4 h-4 mr-2" />}
            Confirmar Alteração
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
