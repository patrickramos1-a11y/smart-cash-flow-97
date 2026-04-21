import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Search, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import {
  type Account, useAccounts, useAccountCategories, useTransactionCategories,
} from '@/hooks/useFinancialConfig';
import { useTransactions } from '@/hooks/useTransactions';
import { AccountCard } from './AccountCard';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface Props {
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  selectedYear: number;
  onNewAccount: () => void;
  onEditAccount: (account: Account) => void;
  onTransfer: (fromAccountId?: string) => void;
}

export function AccountsOverviewTab({
  selectedAccountId, setSelectedAccountId, selectedYear, onNewAccount, onEditAccount, onTransfer,
}: Props) {
  const { data: accounts } = useAccounts();
  const { data: accountCategories } = useAccountCategories();
  const { data: txCategories } = useTransactionCategories();
  const { data: transactions } = useTransactions({});

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const now = new Date();
  const currentMonth = selectedYear === now.getFullYear() ? now.getMonth() + 1 : 12;

  const linkedCountByAccount = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of txCategories ?? []) {
      if (c.default_account_id) map.set(c.default_account_id, (map.get(c.default_account_id) ?? 0) + 1);
    }
    return map;
  }, [txCategories]);

  const totalBalance = (accounts ?? []).reduce((s, a) => s + Number(a.current_balance ?? 0), 0);

  const categoryBalances = (accountCategories ?? []).map(cat => {
    const list = (accounts ?? []).filter(a => a.category_id === cat.id);
    return { ...cat, accounts: list, totalBalance: list.reduce((s, a) => s + Number(a.current_balance), 0) };
  });

  const filteredAccounts = (accounts ?? []).filter(a =>
    a.active &&
    a.name.toLowerCase().includes(search.toLowerCase()) &&
    (!selectedCategory || a.category_id === selectedCategory),
  );

  const accountStats = useMemo(() => {
    const map = new Map<string, { in: number; out: number; variation: number | null; spark: { v: number }[] }>();
    for (const acc of filteredAccounts) {
      let curIn = 0, curOut = 0, prevIn = 0, prevOut = 0;
      const monthly = Array(12).fill(0).map(() => ({ in: 0, out: 0 }));
      for (const t of transactions ?? []) {
        if (t.account_id !== acc.id) continue;
        if (t.competencia_ano !== selectedYear) continue;
        const v = Number(t.valor);
        const idx = (t.competencia_mes ?? 1) - 1;
        if (t.tipo_movimento === 'ENTRADA') monthly[idx].in += v;
        else if (t.tipo_movimento === 'SAIDA') monthly[idx].out += v;
        if (t.competencia_mes === currentMonth) {
          if (t.tipo_movimento === 'ENTRADA') curIn += v; else curOut += v;
        }
        if (t.competencia_mes === currentMonth - 1) {
          if (t.tipo_movimento === 'ENTRADA') prevIn += v; else prevOut += v;
        }
      }
      const cur = curIn - curOut;
      const prev = prevIn - prevOut;
      const variation = prev !== 0 ? ((cur - prev) / Math.abs(prev)) * 100 : null;
      const spark = monthly.slice(Math.max(0, currentMonth - 6), currentMonth).map(m => ({ v: m.in - m.out }));
      map.set(acc.id, { in: curIn, out: curOut, variation, spark });
    }
    return map;
  }, [filteredAccounts, transactions, selectedYear, currentMonth]);

  const accountEvolutionData = useMemo(() => {
    if (!selectedAccountId) return [];
    return MONTHS.map((month, idx) => {
      const monthNum = idx + 1;
      const monthTx = (transactions ?? []).filter(t =>
        t.account_id === selectedAccountId && t.competencia_ano === selectedYear && t.competencia_mes === monthNum,
      );
      const entradas = monthTx.filter(t => t.tipo_movimento === 'ENTRADA').reduce((s, t) => s + Number(t.valor), 0);
      const saidas = monthTx.filter(t => t.tipo_movimento === 'SAIDA').reduce((s, t) => s + Number(t.valor), 0);
      return { month, entradas, saidas };
    });
  }, [selectedAccountId, transactions, selectedYear]);

  const selectedAccount = accounts?.find(a => a.id === selectedAccountId) || null;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4 lg:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs lg:text-sm text-muted-foreground">Saldo Consolidado</p>
            <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(totalBalance)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {accounts?.length ?? 0} contas • {categoryBalances.length} categorias de conta
            </p>
          </div>
          <Wallet className="w-10 h-10 lg:w-12 lg:h-12 text-primary/60" />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm lg:text-base font-semibold mb-2">Saldo por Categoria</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:gap-3 lg:overflow-visible">
          {categoryBalances.map(cat => {
            const linkedTotal = cat.accounts.reduce((s, a) => s + (linkedCountByAccount.get(a.id) ?? 0), 0);
            return (
              <Card
                key={cat.id}
                className={cn('cursor-pointer transition-all hover:shadow flex-shrink-0 w-36 lg:w-auto', selectedCategory === cat.id && 'ring-2 ring-primary')}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              >
                <CardContent className="p-3">
                  <div className="w-3 h-3 rounded-full mb-1.5" style={{ backgroundColor: cat.color || 'hsl(var(--muted-foreground))' }} />
                  <p className="text-[10px] lg:text-xs text-muted-foreground truncate">{cat.name}</p>
                  <p className="text-sm lg:text-base font-bold">{formatCurrency(cat.totalBalance)}</p>
                  <p className="text-[10px] text-muted-foreground">{cat.accounts.length} contas · {linkedTotal} cat. tx.</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pb-3">
          <CardTitle className="text-sm lg:text-base">Contas</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-xs w-full sm:w-56"
              />
            </div>
            <Button size="sm" className="h-8 text-xs" onClick={onNewAccount}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Nova
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAccounts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma conta encontrada.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAccounts.map(acc => {
                const cat = accountCategories?.find(c => c.id === acc.category_id);
                const stats = accountStats.get(acc.id);
                return (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    category={cat}
                    selected={selectedAccountId === acc.id}
                    monthlyIn={stats?.in ?? 0}
                    monthlyOut={stats?.out ?? 0}
                    variationPct={stats?.variation ?? null}
                    sparkline={stats?.spark ?? []}
                    linkedCategoriesCount={linkedCountByAccount.get(acc.id) ?? 0}
                    onSelect={() => setSelectedAccountId(selectedAccountId === acc.id ? null : acc.id)}
                    onEdit={() => onEditAccount(acc)}
                    onTransfer={() => onTransfer(acc.id)}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAccount && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{selectedAccount.name} · evolução mensal {selectedYear}</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Veja a aba <strong>Composição</strong> para o detalhamento de categorias, centros de custo e despesas vinculadas.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accountEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
