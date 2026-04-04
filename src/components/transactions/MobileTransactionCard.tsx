import { 
  ArrowDownCircle, ArrowUpCircle, CheckCircle, Clock, AlertTriangle,
  MoreVertical, RefreshCw, FileText, Copy, Send, Trash2, Pencil, Undo2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/data/mockData';
import type { TransactionWithClient, TransactionStatusType } from '@/hooks/useTransactions';

const statusConfig: Record<TransactionStatusType, { label: string; color: string; icon: React.ComponentType<{className?: string}> }> = {
  PAGO: { label: 'Pago', color: 'bg-income/10 text-income border-income/20', icon: CheckCircle },
  EM_ABERTO: { label: 'Em Aberto', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  ATRASADO: { label: 'Atrasado', color: 'bg-expense/10 text-expense border-expense/20', icon: AlertTriangle },
};

interface MobileTransactionCardProps {
  transaction: TransactionWithClient;
  onMarkPaid: (t: TransactionWithClient) => void;
  onDuplicate: (t: TransactionWithClient) => void;
  onSendCollection: (t: TransactionWithClient) => void;
  onDelete: (t: TransactionWithClient) => void;
  onEdit: (t: TransactionWithClient) => void;
  onRevert?: (t: TransactionWithClient) => void;
}

export function MobileTransactionCard({ 
  transaction: t, 
  onMarkPaid, 
  onDuplicate, 
  onSendCollection, 
  onDelete 
}: MobileTransactionCardProps) {
  const status = statusConfig[t.status];
  const StatusIcon = status.icon;
  const isEntry = t.tipo_movimento === 'ENTRADA';
  const isRecurring = t.natureza === 'RECORRENTE';

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 active:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        {/* Left: Icon + Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            isEntry ? "bg-income-muted" : "bg-expense-muted"
          )}>
            {isEntry 
              ? <ArrowDownCircle className="w-5 h-5 text-income" />
              : <ArrowUpCircle className="w-5 h-5 text-expense" />
            }
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{t.descricao || '-'}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {t.recurring_clients?.name && (
                <p className="text-xs text-muted-foreground truncate">{t.recurring_clients.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", status.color)}>
                <StatusIcon className="w-3 h-3 mr-0.5" />
                {status.label}
              </Badge>
              {isRecurring && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  <RefreshCw className="w-3 h-3 mr-0.5" />
                  Recorrente
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground">
                {t.competencia_mes.toString().padStart(2, '0')}/{t.competencia_ano}
              </span>
            </div>
          </div>
        </div>
        
        {/* Right: Value + Actions */}
        <div className="flex flex-col items-end gap-1">
          <span className={cn(
            "font-bold text-base",
            isEntry ? "text-income" : "text-expense"
          )}>
            {isEntry ? '+' : '-'}{formatCurrency(Number(t.valor))}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(t)}>
                <Copy className="w-4 h-4 mr-2" /> Duplicar
              </DropdownMenuItem>
              {t.status !== 'PAGO' && (
                <DropdownMenuItem onClick={() => onMarkPaid(t)}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Marcar Pago
                </DropdownMenuItem>
              )}
              {isEntry && t.status !== 'PAGO' && (
                <DropdownMenuItem onClick={() => onSendCollection(t)}>
                  <Send className="w-4 h-4 mr-2" /> Enviar Cobrança
                </DropdownMenuItem>
              )}
              {t.natureza === 'AVULSA' && (
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(t)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
