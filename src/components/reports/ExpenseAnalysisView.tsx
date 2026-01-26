import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { 
  TrendingDown, Tags, Target, Calendar, DollarSign
} from 'lucide-react';
import { useCostCenterAnalysis } from '@/hooks/useDREReport';
import { cn } from '@/lib/utils';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--expense))',
  'hsl(var(--warning))',
  'hsl(var(--info))',
  'hsl(var(--income))',
  '#8b5cf6',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function ExpenseAnalysisView() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState('category');

  const { data, isLoading, error } = useCostCenterAnalysis(selectedYear);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Erro ao carregar dados de despesas
        </CardContent>
      </Card>
    );
  }

  const { byCategory, byCostCenter, byMonth, total } = data;

  // Prepare data for charts
  const categoryPieData = byCategory.slice(0, 8).map((c, i) => ({
    name: c.name,
    value: c.total,
    color: COLORS[i % COLORS.length],
  }));

  const costCenterPieData = byCostCenter.slice(0, 8).map((c, i) => ({
    name: c.name,
    value: c.total,
    color: COLORS[i % COLORS.length],
  }));

  const monthlyData = MONTHS.map((m, i) => ({
    month: m,
    value: byMonth[i + 1] || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Análise de Despesas</h2>
          <p className="text-sm text-muted-foreground">
            Despesas por categoria, centro de custo e período
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Total Card */}
      <Card className="bg-gradient-to-br from-expense/10 to-expense/5 border-expense/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Despesas</p>
              <p className="text-3xl font-bold text-expense">{formatCurrency(total)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {byCategory.length} categorias • {Object.keys(byMonth).length} meses com lançamentos
              </p>
            </div>
            <TrendingDown className="w-12 h-12 text-expense/60" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="category" className="gap-2">
            <Tags className="w-4 h-4" />
            Por Categoria
          </TabsTrigger>
          <TabsTrigger value="costcenter" className="gap-2">
            <Target className="w-4 h-4" />
            Por Centro de Custo
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <Calendar className="w-4 h-4" />
            Por Mês
          </TabsTrigger>
        </TabsList>

        {/* By Category */}
        <TabsContent value="category" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {byCategory.slice(0, 10).map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cat.name}</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="h-2 rounded-full transition-all"
                            style={{ 
                              width: `${(cat.total / total) * 100}%`,
                              backgroundColor: COLORS[i % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(cat.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {((cat.total / total) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Cost Center */}
        <TabsContent value="costcenter" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Centro de Custo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costCenterPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name.substring(0, 15)}... (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {costCenterPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Centros de Custo (DRE)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {byCostCenter.slice(0, 10).map((cc, i) => (
                    <div key={cc.name} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cc.name}</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="h-2 rounded-full transition-all"
                            style={{ 
                              width: `${(cc.total / total) * 100}%`,
                              backgroundColor: COLORS[i % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(cc.total)}</p>
                        <p className="text-xs text-muted-foreground">{cc.count} lançamentos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Month */}
        <TabsContent value="monthly" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução Mensal de Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      name="Despesas"
                      fill="hsl(var(--expense))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly summary table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {MONTHS.map(m => (
                        <th key={m} className="text-center py-2 px-2 font-medium text-muted-foreground">{m}</th>
                      ))}
                      <th className="text-center py-2 px-4 font-semibold">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {MONTHS.map((_, i) => (
                        <td key={i} className="text-center py-2 px-2">
                          {byMonth[i + 1] ? formatCurrency(byMonth[i + 1]) : '-'}
                        </td>
                      ))}
                      <td className="text-center py-2 px-4 font-bold text-expense">
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
