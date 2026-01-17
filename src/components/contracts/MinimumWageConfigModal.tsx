import { useState } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { useMinimumWageConfig, useUpdateMinimumWage, useContractPlans } from '@/hooks/useRecurringContracts';
import { formatCurrency } from '@/data/mockData';
import { toast } from 'sonner';

interface MinimumWageConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export function MinimumWageConfigModal({ open, onClose }: MinimumWageConfigModalProps) {
  const { data: configs, isLoading: loadingConfigs } = useMinimumWageConfig();
  const { data: plans, isLoading: loadingPlans } = useContractPlans();
  const updateMutation = useUpdateMinimumWage();

  const [newYear, setNewYear] = useState(2026);
  const [newValue, setNewValue] = useState('1518.00');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!open) return null;

  const handleSaveNew = async () => {
    try {
      await updateMutation.mutateAsync({
        year: newYear,
        value: parseFloat(newValue),
      });
      toast.success('Salário mínimo adicionado!');
      setNewValue('1518.00');
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const handleUpdate = async (year: number) => {
    try {
      await updateMutation.mutateAsync({
        year,
        value: parseFloat(editValue),
      });
      toast.success('Salário mínimo atualizado!');
      setEditingId(null);
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Configuração do Salário Mínimo</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Plans */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Planos Disponíveis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {plans?.map((plan) => (
                <div key={plan.id} className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="font-semibold text-foreground">{plan.name}</p>
                  <p className="text-sm text-primary">{plan.minimum_wage_factor} SM</p>
                </div>
              ))}
            </div>
          </div>

          {/* Minimum Wage by Year */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Salário Mínimo por Ano</h3>
            <div className="space-y-2">
              {configs?.map((config) => (
                <div 
                  key={config.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-foreground">{config.year}</span>
                    {editingId === config.id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="form-input w-32"
                        step="0.01"
                      />
                    ) : (
                      <span className="text-lg text-income font-semibold">
                        {formatCurrency(Number(config.value))}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === config.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(config.year)}
                          disabled={updateMutation.isPending}
                          className="btn-primary text-sm py-1 px-3"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn-secondary text-sm py-1 px-3"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(config.id);
                          setEditValue(String(config.value));
                        }}
                        className="btn-secondary text-sm py-1 px-3"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Year */}
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Adicionar Novo Ano</h3>
            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Ano</label>
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  className="form-input w-24"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Valor (R$)</label>
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="form-input w-32"
                  step="0.01"
                />
              </div>
              <button
                onClick={handleSaveNew}
                disabled={updateMutation.isPending}
                className="btn-primary mt-4"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
          </div>

          {/* Impact Preview */}
          <div className="bg-info-muted rounded-lg p-4">
            <h4 className="font-semibold text-info mb-2">Simulação de Impacto</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Com base no valor do SM definido, cada plano terá o seguinte valor mensal:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {plans?.map((plan) => {
                const smValue = configs?.[0]?.value || 1518;
                const monthlyValue = Number(smValue) * plan.minimum_wage_factor;
                return (
                  <div key={plan.id} className="bg-card rounded-lg p-3 text-center">
                    <p className="font-medium text-foreground">{plan.name}</p>
                    <p className="text-income font-semibold">{formatCurrency(monthlyValue)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <button onClick={onClose} className="btn-secondary">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
