import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowRight } from 'lucide-react';
import { useAccounts, useCreateAccountTransfer, type Account } from '@/hooks/useFinancialConfig';
import { format } from 'date-fns';

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function TransferModal({ open, onClose }: TransferModalProps) {
  const { data: accounts } = useAccounts();
  const createTransfer = useCreateAccountTransfer();

  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: 0,
    transferDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fromAccountId || !formData.toAccountId || formData.amount <= 0) {
      return;
    }

    if (formData.fromAccountId === formData.toAccountId) {
      return;
    }

    createTransfer.mutate({
      from_account_id: formData.fromAccountId,
      to_account_id: formData.toAccountId,
      amount: formData.amount,
      transfer_date: formData.transferDate,
      notes: formData.notes || undefined,
    }, {
      onSuccess: () => {
        onClose();
        setFormData({
          fromAccountId: '',
          toAccountId: '',
          amount: 0,
          transferDate: format(new Date(), 'yyyy-MM-dd'),
          notes: '',
        });
      }
    });
  };

  const activeAccounts = accounts?.filter(a => a.active) || [];
  const fromAccount = accounts?.find(a => a.id === formData.fromAccountId);
  const toAccount = accounts?.find(a => a.id === formData.toAccountId);

  const isValid = formData.fromAccountId && 
    formData.toAccountId && 
    formData.fromAccountId !== formData.toAccountId && 
    formData.amount > 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Transferência</DialogTitle>
          <DialogDescription>
            Transfira valores entre suas contas. Esta movimentação não afeta o DRE.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Conta de Origem</Label>
              <Select 
                value={formData.fromAccountId} 
                onValueChange={(v) => setFormData({ ...formData, fromAccountId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.current_balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fromAccount && (
                <p className="text-xs text-muted-foreground">
                  Saldo atual: {formatCurrency(fromAccount.current_balance)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Conta de Destino</Label>
              <Select 
                value={formData.toAccountId} 
                onValueChange={(v) => setFormData({ ...formData, toAccountId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts
                    .filter(a => a.id !== formData.fromAccountId)
                    .map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.current_balance)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {toAccount && (
                <p className="text-xs text-muted-foreground">
                  Saldo atual: {formatCurrency(toAccount.current_balance)}
                </p>
              )}
            </div>
          </div>

          {/* Visual Transfer Indicator */}
          {fromAccount && toAccount && (
            <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="font-medium">{fromAccount.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(fromAccount.current_balance - formData.amount)}
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-primary" />
              <div className="text-center">
                <p className="font-medium">{toAccount.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(toAccount.current_balance + formData.amount)}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input 
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label>Data da Transferência</Label>
              <Input 
                type="date"
                value={formData.transferDate}
                onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea 
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Transferência para reserva de emergência"
              rows={2}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isValid || createTransfer.isPending}
          >
            {createTransfer.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Realizar Transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
