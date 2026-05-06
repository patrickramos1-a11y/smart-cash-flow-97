import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area,
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Zap, AlertTriangle } from 'lucide-react';
import { useProjections } from '@/hooks/useProjections';
import { useAccounts } from '@/hooks/useFinancialConfig';

const monthLabels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

interface KpiProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: 'income' | 'expense' | 'info' | 'warning';
}
function MiniKPI({ label, value, hint, icon: Icon, tone = 'info' }: KpiProps) {
  const toneClass = {
    income: 'text-income',
    expense: 'text-expense',
    info: 'text-primary',
    warning: 'text-warning',
  }[tone];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          {Icon && <Icon className={`w-4 h-4 ${toneClass}`} />}
        </div>
        <div className={`text-xl font-semibold ${toneClass}`}>{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export function ProjectionsTab() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const { data: accounts } = useAccounts();
  const totalBalance = accounts?.reduce((s, a) => s + Number(a.current_balance || 0), 0) || 0;

  const { data, isLoading } = useProjections(year, totalBalance);

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  const projData = data.monthly.map(m => ({
    month: monthLabels[m.month - 1],
    'Receita Prevista': m.receitaPrevista,
    'Receita Realizada': m.receitaRealizada,
    'Despesa Prevista': m.despesaPrevista,
    'Despesa Realizada': m.despesaRealizada,
  }));

  const yoyData = data.yoy.map(m => ({
    month: monthLabels[m.month - 1],
    [`Receita ${year}`]: m.receitaAtual,
    [`Receita ${year - 1}`]: m.receitaAnterior,
    [`Despesa ${year}`]: m.despesaAtual,
    [`Despesa ${year - 1}`]: m.despesaAnterior,
  }));

  const cashData = data.cashForecast.map(m => ({
    month: monthLabels[m.month - 1],
    'Saldo Projetado': m.saldoProjetado,
    Entradas: m.entradasPrevistas,
    Saídas: m.saidasPrevistas,
  }));

  const minSaldo = Math.min(...data.cashForecast.map(c => c.saldoProjetado), totalBalance);
  const cashAlert = minSaldo < 0;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center bg-card border border-border rounded-xl px-3 py-2.5">
        <span className="text-xs lg:text-sm font-medium text-muted-foreground">Ano base:</span>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-background border border-border rounded-md px-2 py-1 text-sm"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <Badge variant="outline" className="ml-auto text-xs">
          Saldo atual: {fmt(totalBalance)}
        </Badge>
      </div>

      {/* KPIs Run-rate & acurácia */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
        <MiniKPI
          label="Receita anualizada (run-rate)"
          value={fmt(data.receitaRunRateAnual)}
          hint="Média 3M × 12"
          icon={TrendingUp}
          tone="income"
        />
        <MiniKPI
          label="Despesa anualizada (run-rate)"
          value={fmt(data.despesaRunRateAnual)}
          hint="Média 3M × 12"
          icon={TrendingDown}
          tone="expense"
        />
        <MiniKPI
          label="Acurácia Receita YTD"
          value={fmtPct(data.acuraciaReceita)}
          hint="Realizado / Previsto"
          icon={Target}
          tone={data.acuraciaReceita >= 90 ? 'income' : 'warning'}
        />
        <MiniKPI
          label="Resultado projetado anual"
          value={fmt(data.resultadoRunRateAnual)}
          hint="Receita − Despesa (run-rate)"
          icon={Zap}
          tone={data.resultadoRunRateAnual >= 0 ? 'income' : 'expense'}
        />
      </div>

      {/* Realizado vs Previsto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Realizado vs Previsto — {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={projData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => fmt(v)} width={80} />
              <Tooltip
                formatter={(v: number) => fmt(v)}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
              />
              <Legend />
              <Bar dataKey="Receita Prevista" fill="hsl(var(--income) / 0.3)" />
              <Bar dataKey="Receita Realizada" fill="hsl(var(--income))" />
              <Bar dataKey="Despesa Prevista" fill="hsl(var(--expense) / 0.3)" />
              <Bar dataKey="Despesa Realizada" fill="hsl(var(--expense))" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* YoY */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparativo Anual — {year} vs {year - 1}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={yoyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => fmt(v)} width={80} />
              <Tooltip
                formatter={(v: number) => fmt(v)}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
              />
              <Legend />
              <Line type="monotone" dataKey={`Receita ${year}`} stroke="hsl(var(--income))" strokeWidth={2} />
              <Line type="monotone" dataKey={`Receita ${year - 1}`} stroke="hsl(var(--income))" strokeDasharray="5 5" strokeWidth={2} />
              <Line type="monotone" dataKey={`Despesa ${year}`} stroke="hsl(var(--expense))" strokeWidth={2} />
              <Line type="monotone" dataKey={`Despesa ${year - 1}`} stroke="hsl(var(--expense))" strokeDasharray="5 5" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cash forecast */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Projeção de Caixa (próximos meses)</CardTitle>
            {cashAlert && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                Saldo projetado ficará negativo: {fmt(minSaldo)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {cashData.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Sem meses futuros para projetar neste ano.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={cashData}>
                <defs>
                  <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => fmt(v)} width={80} />
                <Tooltip
                  formatter={(v: number) => fmt(v)}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Saldo Projetado"
                  stroke="hsl(var(--primary))"
                  fill="url(#saldoGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
