import { X, AlertTriangle, Check } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'success';
}

export function ConfirmModal({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning'
}: ConfirmModalProps) {
  if (!open) return null;

  const colors = {
    danger: 'bg-expense text-white hover:bg-expense/90',
    warning: 'bg-warning text-white hover:bg-warning/90',
    success: 'bg-income text-white hover:bg-income/90',
  };

  const iconColors = {
    danger: 'text-expense bg-expense-muted',
    warning: 'text-warning bg-warning-muted',
    success: 'text-income bg-income-muted',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconColors[type]}`}>
              {type === 'success' ? (
                <Check className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{message}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 px-6 py-4 bg-muted/30 border-t border-border">
          <button onClick={onClose} className="btn-secondary">
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className={`btn-action ${colors[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
