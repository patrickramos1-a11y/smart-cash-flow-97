import { useState } from 'react';
import { X, Save, User } from 'lucide-react';
import { Client, ClientType } from '@/types/financial';
import { toast } from 'sonner';

interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  client?: Client;
  onSave?: (client: Partial<Client>) => void;
}

export function ClientModal({ open, onClose, client, onSave }: ClientModalProps) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    type: client?.type || 'RECORRENTE' as ClientType,
    email: client?.email || '',
    phone: client?.phone || '',
    document: client?.document || '',
    address: client?.address || '',
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    const newClient: Partial<Client> = {
      id: client?.id || `cli_${Date.now()}`,
      name: formData.name,
      type: formData.type,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      document: formData.document || undefined,
      address: formData.address || undefined,
      contracts: client?.contracts || [],
      createdAt: client?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave?.(newClient);
    toast.success(client ? 'Cliente atualizado!' : 'Cliente criado!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {client ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-foreground">Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input mt-1"
              placeholder="Nome do cliente"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium text-foreground">Tipo</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="clientType"
                  value="RECORRENTE"
                  checked={formData.type === 'RECORRENTE'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ClientType })}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm">Recorrente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="clientType"
                  value="AVULSO"
                  checked={formData.type === 'AVULSO'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ClientType })}
                  className="w-4 h-4 text-warning"
                />
                <span className="text-sm">Avulso</span>
              </label>
            </div>
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input mt-1"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input mt-1"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          {/* Document */}
          <div>
            <label className="text-sm font-medium text-foreground">CNPJ/CPF</label>
            <input
              type="text"
              value={formData.document}
              onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              className="form-input mt-1"
              placeholder="00.000.000/0001-00"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-medium text-foreground">Endereço</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="form-input mt-1"
              rows={2}
              placeholder="Endereço completo"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              <Save className="w-4 h-4" />
              {client ? 'Salvar Alterações' : 'Criar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
