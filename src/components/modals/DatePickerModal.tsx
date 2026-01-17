import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (month: number, year: number) => void;
  currentMonth: number;
  currentYear: number;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 
  'Maio', 'Junho', 'Julho', 'Agosto', 
  'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function DatePickerModal({ 
  open, 
  onClose, 
  onSelect, 
  currentMonth, 
  currentYear 
}: DatePickerModalProps) {
  const [selectedYear, setSelectedYear] = useState(currentYear);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Selecionar Período</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Year Selector */}
        <div className="flex items-center justify-between px-6 py-4 bg-muted/30">
          <button 
            onClick={() => setSelectedYear(y => y - 1)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xl font-bold text-foreground">{selectedYear}</span>
          <button 
            onClick={() => setSelectedYear(y => y + 1)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Months Grid */}
        <div className="p-4 grid grid-cols-3 gap-2">
          {MONTHS.map((month, index) => {
            const isSelected = index + 1 === currentMonth && selectedYear === currentYear;
            return (
              <button
                key={month}
                onClick={() => {
                  onSelect(index + 1, selectedYear);
                  onClose();
                }}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                {month}
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 p-4 border-t border-border">
          <button 
            onClick={() => {
              const now = new Date();
              onSelect(now.getMonth() + 1, now.getFullYear());
              onClose();
            }}
            className="flex-1 btn-secondary text-sm"
          >
            Mês Atual
          </button>
          <button 
            onClick={onClose}
            className="flex-1 btn-primary text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
