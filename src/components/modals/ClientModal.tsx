import { useEffect, useState } from 'react';
import { X, Save, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export interface ClientRecord {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  address?: string | null;
  notes?: string | null;
  active?: boolean;
}

interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  client?: ClientRecord | null;
  onSaved?: (client: ClientRecord) => void;
}

export function ClientModal({ open, onClose, client, onSaved }: ClientModalProps) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: client?.name || '',
        email: client?.email || '',
        phone: client?.phone || '',
        document: client?.document || '',
        address: client?.address || '',
        notes: client?.notes || '',
      });
    }
  }, [open, client]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        document: formData.document.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        active: true,
      };

      let saved: ClientRecord;
      if (client?.id) {
        const { data, error } = await supabase
          .from('recurring_clients')
          .update(payload)
          .eq('id', client.id)
          .select()
          .single();
        if (error) throw error;
        saved = data as ClientRecord;
        toast.success('Cliente atualizado!');
      } else {
        const { data, error } = await supabase
          .from('recurring_clients')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        saved = data as ClientRecord;
        toast.success('Cliente criado!');
      }

      await qc.invalidateQueries({ queryKey: ['recurring_clients'] });
      await qc.invalidateQueries({ queryKey: ['clients'] });
      onSaved?.(saved);
      onClose();
    } catch (err: any) {
      console.error('[ClientModal] save error', err);
      toast.error(err?.message || 'Erro ao salvar cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {client?.id ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted" type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input mt-1"
              placeholder="Nome do cliente"
              required
              autoFocus
            />
          </div>

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

          <div>
            <label className="text-sm font-medium text-foreground">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-input mt-1"
              rows={2}
              placeholder="Notas internas (opcional)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {client?.id ? 'Salvar Alterações' : 'Criar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
