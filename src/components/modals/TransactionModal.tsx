import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Transaction, TransactionNature, DocumentType } from '@/types/financial';
import { 
  mockAccounts, 
  mockTransactionCategories, 
  mockCostCenters,
  mockPaymentMethods,
  mockClients,
  formatCurrency 
} from '@/data/mockData';
import { toast } from 'sonner';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  type: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA';
  transaction?: Transaction;
  onSave?: (transaction: Partial<Transaction>) => void;
}

export function TransactionModal({ open, onClose, type, transaction, onSave }: TransactionModalProps) {
  const [formData, setFormData] = useState({
    description: transaction?.description || '',
    value: transaction?.value?.toString() || '',
    accountId: transaction?.accountId || '',
    categoryId: transaction?.categoryId || '',
    costCenterId: transaction?.costCenterId || '',
    paymentMethodId: transaction?.paymentMethodId || '',
    clientId: transaction?.clientId || '',
    dueDate: transaction?.dueDate ? new Date(transaction.dueDate).toISOString().split('T')[0] : '',
    documentType: transaction?.documentType || 'NF',
    documentNumber: transaction?.documentNumber || '',
    notes: transaction?.serviceDescription || '',
  });

  if (!open) return null;

  const isEntry = type === 'ENTRADA';
  const isTransfer = type === 'TRANSFERENCIA';
  
  const categories = mockTransactionCategories.filter(c => 
    isEntry ? c.nature === 'ENTRADA' || c.nature === 'AMBOS' : c.nature === 'SAIDA' || c.nature === 'AMBOS'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.value || !formData.accountId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const newTransaction: Partial<Transaction> = {
      id: transaction?.id || `trx_${Date.now()}`,
      description: formData.description,
      value: parseFloat(formData.value),
      accountId: formData.accountId,
      accountName: mockAccounts.find(a => a.id === formData.accountId)?.name,
      categoryId: formData.categoryId,
      categoryName: mockTransactionCategories.find(c => c.id === formData.categoryId)?.name,
      costCenterId: formData.costCenterId,
      costCenterName: mockCostCenters.find(c => c.id === formData.costCenterId)?.name,
      paymentMethodId: formData.paymentMethodId,
      paymentMethodName: mockPaymentMethods.find(p => p.id === formData.paymentMethodId)?.name,
      clientId: formData.clientId || undefined,
      clientName: mockClients.find(c => c.id === formData.clientId)?.name,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      documentType: formData.documentType as any,
      documentNumber: formData.documentNumber,
      serviceDescription: formData.notes,
      nature: type as TransactionNature,
      status: 'EM_ABERTO',
      isPaid: false,
      competenceMonth: new Date().getMonth() + 1,
      competenceYear: new Date().getFullYear(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onSave?.(newTransaction);
    toast.success(transaction ? 'Transação atualizada!' : 'Transação criada!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-border ${isEntry ? 'bg-income/10' : 'bg-expense/10'}`}>
          <h2 className="text-xl font-semibold text-foreground">
            {transaction ? 'Editar' : 'Nova'} {isEntry ? 'Entrada' : isTransfer ? 'Transferência' : 'Saída'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground">Descrição *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input mt-1"
              placeholder="Descrição da transação"
              required
            />
          </div>

          {/* Value and Account */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Valor (R$) *</label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="form-input mt-1"
                placeholder="0,00"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Conta *</label>
              <select
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                className="form-input mt-1"
                required
              >
                <option value="">Selecione...</option>
                {mockAccounts.filter(a => a.active).map(account => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category and Cost Center */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Categoria</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="form-input mt-1"
              >
                <option value="">Selecione...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Centro de Custo</label>
              <select
                value={formData.costCenterId}
                onChange={(e) => setFormData({ ...formData, costCenterId: e.target.value })}
                className="form-input mt-1"
              >
                <option value="">Selecione...</option>
                {mockCostCenters.map(cc => (
                  <option key={cc.id} value={cc.id}>{cc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method and Client */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Forma de Pagamento</label>
              <select
                value={formData.paymentMethodId}
                onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
                className="form-input mt-1"
              >
                <option value="">Selecione...</option>
                {mockPaymentMethods.filter(p => p.active).map(pm => (
                  <option key={pm.id} value={pm.id}>{pm.name}</option>
                ))}
              </select>
            </div>
            {isEntry && (
              <div>
                <label className="text-sm font-medium text-foreground">Cliente</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="form-input mt-1"
                >
                  <option value="">Selecione...</option>
                  {mockClients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Due Date and Document */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Data de Vencimento</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="form-input mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Tipo de Documento</label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value as DocumentType })}
                className="form-input mt-1"
              >
                <option value="NF">Nota Fiscal</option>
                <option value="RECIBO">Recibo</option>
                <option value="NOTA_DEBITO">Nota de Débito</option>
                <option value="SEM_DOCUMENTO">Sem Documento</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Nº Documento</label>
              <input
                type="text"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                className="form-input mt-1"
                placeholder="NF-001234"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-foreground">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-input mt-1"
              rows={3}
              placeholder="Descrição adicional..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className={isEntry ? "btn-income" : "btn-expense"}>
              <Save className="w-4 h-4" />
              {transaction ? 'Salvar Alterações' : 'Criar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
