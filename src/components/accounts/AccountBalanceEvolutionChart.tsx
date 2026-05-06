import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useAccountAnnual } from '@/hooks/useAccountAnnual';
import { useAccountForecast } from '@/hooks/useAccountForecast';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

interface Props {
  accountId: string;
  year: number;
}

export function AccountBalanceEvolutionChart({ accountId, year }: Props) {
  const { data, isLoading } = useAccountAnnual(accountId, year);
  const { data: forecast } = useAccountForecast(accountId, year);
  const [showBars, setShowBars] = useState(false);
  const [showForecast, setShowForecast] = useState(true);

  const chart = useMemo(() => {
    if (!data) return [];
    const fcMap = new Map<number, { realBalance: number; forecastBalance: number }>();
    (forecast?.months || []).forEach((f) =>
      fcMap.set(f.month, { realBalance: f.realBalance, forecastBalance: f.forecastBalance }),
    );
    return data.months.map((m) => {
      const fc = fcMap.get(m.month);
      const hasForecastDelta =
        fc && Math.abs(fc.forecastBalance - fc.realBalance) > 0.01;
      return {
        month: MONTHS[m.month - 1],
        saldo: Math.round(m.endBalance),
        previsto: showForecast && fc && hasForecastDelta ? Math.round(fc.forecastBalance) : null,
        entradas: Math.round(m.totalIn + m.transferIn),
        saidas: -Math.round(m.totalOut + m.transferOut),
      };
    });
  }, [data, forecast, showForecast]);

  if (isLoading) return <Skeleton className="h-56 w-full" />;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Label htmlFor="forecast-toggle" className="text-xs text-muted-foreground cursor-pointer">
            Saldo previsto
          </Label>
          <Switch id="forecast-toggle" checked={showForecast} onCheckedChange={setShowForecast} />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="bars-toggle" className="text-xs text-muted-foreground cursor-pointer">
            Mostrar entradas/saídas
          </Label>
          <Switch id="bars-toggle" checked={showBars} onCheckedChange={setShowBars} />
        </div>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickFormatter={(v) => fmt(Number(v))}
              width={70}
            />
            <Tooltip
              formatter={(v: any, name: any) => [fmt(Number(v)), name]}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {showBars && <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--primary))" opacity={0.6} />}
            {showBars && <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--destructive))" opacity={0.6} />}
            <Area
              type="monotone"
              dataKey="saldo"
              name="Saldo real"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#balanceFill)"
            />
            {showForecast && (
              <Line
                type="monotone"
                dataKey="previsto"
                name="Saldo previsto"
                stroke="hsl(var(--accent-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
