import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingDown, FileText, Plus, Wallet, BarChart3, PieChart, Users
} from 'lucide-react';
import { useTransactions, useTransactionKPIs } from '@/hooks/useTransactions';
import { useAccounts, useCostCenters, useTransactionCategories } from '@/hooks/useFinancialConfig';
import { useFinancialEntities, ENTITY_TYPE_LABELS, EntityType } from '@/hooks/useFinancialEntities';
import { TransactionsListWithTabs } from './TransactionsListWithTabs';
import { QuickTransactionModal } from './QuickTransactionModal';
import { MonthYearNavigator } from '@/components/ui/month-year-navigator';
import { formatCurrency } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const COLORS = ['hsl(var(--expense))', 'hsl(var(--warning))', 'hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--income))'];

export function DespesasVariaveisPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showModal, setShowModal] = useState(false);
  const { isFinanceiro } = useAuth();

  const { data: accounts } = useAccounts();
  const { data: categories } = useTransactionCategories();
  const { data: costCenters } = useCostCenters();
  const { data: entities } = useFinancialEntities();

  const { kpis } = useTransactionKPIs({
    competencia_ano: selectedYear,
    competencia_mes: selectedMonth,
    tipo_movimento: 'SAIDA',
    natureza: 'AVULSA'
  });

  const { kpis: yearKpis } = useTransactionKPIs({
    competencia_ano: selectedYear,
    tipo_movimento: 'SAIDA',
    natureza: 'AVULSA'
  });

  const { data: yearlyTransactions } = useTransactions({
    competencia_ano: selectedYear,
    tipo_movimento: 'SAIDA',
    natureza: 'AVULSA'
  });

  const chartData = MONTH_LABELS.map((label, idx) => {
    const monthTransactions = yearlyTransactions?.filter(t => t.competencia_mes === idx + 1) || [];
    const total = monthTransactions.reduce((sum, t) => sum + Number(t.valor), 0);
    return { month: label, valor: total };
  });

  const byCategory = yearlyTransactions?.reduce((acc, t) => {
    const catId = t.transaction_category_id || 'sem-categoria';
    if (!acc[catId]) acc[catId] = 0;
    acc[catId] += Number(t.valor);
    return acc;
  }, {} as Record<string, number>) || {};

  const categoryData = Object.entries(byCategory)
    .map(([id, value]) => ({
      name: categories?.find(c => c.id === id)?.name || 'Sem categoria',
      value
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const byCostCenter = yearlyTransactions?.reduce((acc, t) => {
    const ccId = t.cost_center_id || 'sem-centro';
    if (!acc[ccId]) acc[ccId] = 0;
    acc[ccId] += Number(t.valor);
    return acc;
  }, {} as Record<string, number>) || {};

  const costCenterData = Object.entries(byCostCenter)
    .map(([id, value]) => ({
      name: costCenters?.find(c => c.id === id)?.name || 'Sem centro',
      value
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const byAccount = yearlyTransactions?.reduce((acc, t) => {
    const accId = t.account_id || 'sem-conta';
    if (!acc[accId]) acc[accId] = 0;
    acc[accId] += Number(t.valor);
    return acc;
  }, {} as Record<string, number>) || {};

  const accountData = Object.entries(byAccount)
    .map(([id, value]) => ({
      name: accounts?.find(a => a.id === id)?.name || 'Sem conta',
      value
    }))
    .sort((a, b) => b.value - a.value);

  // Entity breakdown
  const byEntity = yearlyTransactions?.reduce((acc, t) => {
    const entId = (t as any).entity_id || 'sem-entidade';
    if (!acc[entId]) acc[entId] = 0;
    acc[entId] += Number(t.valor);
    return acc;
  }, {} as Record<string, number>) || {};

  const entityData = Object.entries(byEntity)
    .map(([id, value]) => ({
      name: entities?.find(e => e.id === id)?.name || 'Sem entidade',
      type: entities?.find(e => e.id === id)?.type as EntityType | undefined,
      value
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-expense" />
          <h2 className="text-xl font-bold">Despesas Variáveis</h2>
          <Badge variant="outline" className="ml-2">Pontuais</Badge>
        </div>
        {!isFinanceiro && (
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Despesa
          </Button>
        )}
      </div>

      <MonthYearNavigator 
        month={selectedMonth} 
        year={selectedYear} 
        onMonthChange={setSelectedMonth} 
        onYearChange={setSelectedYear} 
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-expense">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-expense" />
              Despesas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-expense">{formatCurrency(kpis.totalEsperado)}</p>
            <p className="text-xs text-muted-foreground">{kpis.quantidadeTotal} lançamentos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Despesas Anuais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(yearKpis.totalEsperado)}</p>
            <p className="text-xs text-muted-foreground">{yearKpis.quantidadeTotal} no ano</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PieChart className="w-4 h-4 text-info" />
              Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{categoryData.length}</p>
            <p className="text-xs text-muted-foreground">categorias diferentes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4 text-warning" />
              Média Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(yearKpis.totalEsperado / 12)}</p>
            <p className="text-xs text-muted-foreground">por mês (média)</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Despesas Variáveis por Mês ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="valor" name="Valor" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Por Categoria ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name.substring(0, 10)}${name.length > 10 ? '...' : ''} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Cost Center and Account */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Por Centro de Custo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {costCenterData.map((cc, idx) => (
                <div key={cc.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-expense/10 text-expense text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-sm truncate max-w-[200px]">{cc.name}</span>
                  </div>
                  <p className="text-sm font-semibold text-expense">{formatCurrency(cc.value)}</p>
                </div>
              ))}
              {costCenterData.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Sem dados</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Por Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {accountData.slice(0, 6).map((acc, idx) => (
                <div key={acc.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-warning/10 text-warning text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-sm truncate max-w-[200px]">{acc.name}</span>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(acc.value)}</p>
                </div>
              ))}
              {accountData.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Sem dados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Entity */}
      {entityData.length > 0 && entityData[0].name !== 'Sem entidade' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Por Entidade / Responsável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {entityData.filter(e => e.name !== 'Sem entidade').map((ent, idx) => (
                <div key={ent.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-medium text-sm">{ent.name}</span>
                      {ent.type && (
                        <span className="text-[10px] text-muted-foreground ml-2">{ENTITY_TYPE_LABELS[ent.type]}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-expense">{formatCurrency(ent.value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsListWithTabs 
            filters={{ 
              competencia_mes: selectedMonth, 
              competencia_ano: selectedYear,
              tipo_movimento: 'SAIDA',
              natureza: 'AVULSA'
            }}
            bulkContext="DESPESAS_VARIAVEIS"
          />
        </CardContent>
      </Card>

      <QuickTransactionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        tipo="SAIDA"
        natureza="AVULSA"
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
      />
    </div>
  );
}
