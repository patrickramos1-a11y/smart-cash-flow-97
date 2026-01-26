import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Calendar,
  Loader2,
  Filter,
  DollarSign,
  Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useOpenPayments, 
  useOpenPaymentStats, 
  useMarkAsPaid,
  useUpdateDueDate,
  useOpenPaymentsEvolution,
  type OpenPayment 
} from '@/hooks/useOpenPayments';
import { useAccounts } from '@/hooks/useFinancialConfig';
import { KPICard } from '@/components/dashboard/KPICard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// =============================================
// PAYMENT ROW COMPONENT
// =============================================

interface PaymentRowProps {
  payment: OpenPayment;
  onMarkPaid: (payment: OpenPayment) => void;
  onUpdateDueDate: (payment: OpenPayment) => void;
}

function PaymentRow({ payment, onMarkPaid, onUpdateDueDate }: PaymentRowProps) {
  const isOverdue = payment.days_overdue > 0;
  
  return (
    <TableRow className={isOverdue ? 'bg-destructive/5' : ''}>
      <TableCell>
        {payment.tipo_movimento === 'ENTRADA' ? (
          <ArrowDownCircle className="w-5 h-5 text-green-500" />
        ) : (
          <ArrowUpCircle className="w-5 h-5 text-red-500" />
        )}
      </TableCell>
      <TableCell className="font-medium">
        {payment.descricao || 'Sem descrição'}
        {payment.cliente && (
          <span className="block text-sm text-muted-foreground">{payment.cliente.name}</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={payment.natureza === 'RECORRENTE' ? 'default' : 'secondary'}>
          {payment.natureza}
        </Badge>
      </TableCell>
      <TableCell>
        {format(parseISO(payment.data_vencimento), 'dd/MM/yyyy')}
        {isOverdue && (
          <span className="block text-xs text-destructive font-medium">
            {payment.days_overdue} dias atrasado
          </span>
        )}
      </TableCell>
      <TableCell className="text-right font-mono font-semibold">
        {formatCurrency(payment.valor)}
      </TableCell>
      <TableCell>
        <Badge variant={isOverdue ? 'destructive' : 'outline'}>
          {isOverdue ? 'ATRASADO' : 'EM ABERTO'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onMarkPaid(payment)}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Quitar
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onUpdateDueDate(payment)}
          >
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// =============================================
// PAYMENT LIST COMPONENT
// =============================================

interface PaymentListProps {
  type: 'ENTRADA' | 'SAIDA' | 'all';
  statusFilter?: 'EM_ABERTO' | 'ATRASADO' | 'all';
}

function PaymentList({ type, statusFilter = 'all' }: PaymentListProps) {
  const { data: payments, isLoading } = useOpenPayments({ type, status: statusFilter });
  const { data: accounts } = useAccounts();
  const markAsPaid = useMarkAsPaid();
  const updateDueDate = useUpdateDueDate();
  
  const [selectedPayment, setSelectedPayment] = useState<OpenPayment | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [dueDateDialogOpen, setDueDateDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paidValue: 0,
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    accountId: ''
  });
  const [newDueDate, setNewDueDate] = useState('');

  const handleMarkPaid = (payment: OpenPayment) => {
    setSelectedPayment(payment);
    setPaymentForm({
      paidValue: payment.valor,
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      accountId: ''
    });
    setPaymentDialogOpen(true);
  };

  const handleUpdateDueDate = (payment: OpenPayment) => {
    setSelectedPayment(payment);
    setNewDueDate(payment.data_vencimento);
    setDueDateDialogOpen(true);
  };

  const confirmPayment = () => {
    if (!selectedPayment) return;
    
    markAsPaid.mutate({
      transactionId: selectedPayment.id,
      paidValue: paymentForm.paidValue,
      paymentDate: paymentForm.paymentDate,
      accountId: paymentForm.accountId || undefined
    }, {
      onSuccess: () => {
        setPaymentDialogOpen(false);
        setSelectedPayment(null);
      }
    });
  };

  const confirmDueDateUpdate = () => {
    if (!selectedPayment) return;
    
    updateDueDate.mutate({
      transactionId: selectedPayment.id,
      newDueDate
    }, {
      onSuccess: () => {
        setDueDateDialogOpen(false);
        setSelectedPayment(null);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!payments?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum pagamento em aberto nesta categoria.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Natureza</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[150px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <PaymentRow 
              key={payment.id} 
              payment={payment}
              onMarkPaid={handleMarkPaid}
              onUpdateDueDate={handleUpdateDueDate}
            />
          ))}
        </TableBody>
      </Table>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              {selectedPayment?.descricao} - Valor original: {formatCurrency(selectedPayment?.valor || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor Pago</Label>
              <Input 
                type="number"
                value={paymentForm.paidValue}
                onChange={(e) => setPaymentForm({ ...paymentForm, paidValue: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <Input 
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Conta (opcional)</Label>
              <Select 
                value={paymentForm.accountId} 
                onValueChange={(v) => setPaymentForm({ ...paymentForm, accountId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.filter(a => a.active).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.current_balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmPayment} disabled={markAsPaid.isPending}>
              {markAsPaid.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Due Date Dialog */}
      <Dialog open={dueDateDialogOpen} onOpenChange={setDueDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Vencimento</DialogTitle>
            <DialogDescription>
              {selectedPayment?.descricao}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nova Data de Vencimento</Label>
              <Input 
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDueDateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmDueDateUpdate} disabled={updateDueDate.isPending}>
              {updateDueDate.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Alterar Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// =============================================
// EVOLUTION CHART
// =============================================

function EvolutionChart() {
  const { data: evolution, isLoading } = useOpenPaymentsEvolution();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={evolution}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-xs" />
        <YAxis 
          tickFormatter={(value) => formatCurrency(value).replace('R$', '')}
          className="text-xs"
        />
        <Tooltip 
          formatter={(value: number) => formatCurrency(value)}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="receivable" 
          name="A Receber"
          stroke="hsl(var(--chart-1))" 
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="payable" 
          name="A Pagar"
          stroke="hsl(var(--chart-2))" 
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// =============================================
// MAIN COMPONENT
// =============================================

export function OpenPaymentsView() {
  const { data: stats, isLoading: statsLoading } = useOpenPaymentStats();

  const getTrendIcon = () => {
    if (!stats) return <Minus className="w-4 h-4" />;
    switch (stats.trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-destructive" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="A Receber"
          value={stats?.totalReceivable || 0}
          icon={ArrowDownCircle}
          type="income"
          subtitle={`${stats?.countReceivable || 0} lançamentos`}
        />
        <KPICard
          title="A Pagar"
          value={stats?.totalPayable || 0}
          icon={ArrowUpCircle}
          type="expense"
          subtitle={`${stats?.countPayable || 0} lançamentos`}
        />
        <KPICard
          title="Total Atrasado"
          value={stats?.totalOverdue || 0}
          icon={AlertTriangle}
          type="warning"
          subtitle={`${stats?.countOverdue || 0} lançamentos`}
        />
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tendência</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              {getTrendIcon()}
              {stats?.trend === 'increasing' ? 'Aumentando' : 
               stats?.trend === 'decreasing' ? 'Diminuindo' : 'Estável'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats?.trendPercentage.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução do Saldo em Aberto</CardTitle>
          <CardDescription>Últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <EvolutionChart />
        </CardContent>
      </Card>

      {/* Payment Lists */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pagamentos em Aberto</CardTitle>
          <CardDescription>
            Gerencie todos os valores pendentes de entrada e saída
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="receivable" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="receivable" className="flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4" />
                A Receber ({stats?.countReceivable || 0})
              </TabsTrigger>
              <TabsTrigger value="payable" className="flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4" />
                A Pagar ({stats?.countPayable || 0})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Atrasados ({stats?.countOverdue || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="receivable">
              <PaymentList type="ENTRADA" />
            </TabsContent>
            <TabsContent value="payable">
              <PaymentList type="SAIDA" />
            </TabsContent>
            <TabsContent value="overdue">
              <PaymentList type="all" statusFilter="ATRASADO" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
