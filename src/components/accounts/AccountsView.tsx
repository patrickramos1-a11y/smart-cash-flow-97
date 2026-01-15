import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Wallet, Search, Plus, ArrowUpRight, ArrowDownRight, 
  ArrowLeftRight, FileText, ChevronRight, Eye
} from 'lucide-react';
import { 
  mockAccounts, mockAccountCategories, mockTransactions,
  calculateAccountCategoryBalances, formatCurrency 
} from '@/data/mockData';
import { cn } from '@/lib/utils';

export function AccountsView() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const categoryBalances = calculateAccountCategoryBalances(mockAccounts, mockAccountCategories);
  const totalBalance = categoryBalances.reduce((sum, c) => sum + c.totalBalance, 0);

  const filteredAccounts = mockAccounts.filter(acc => 
    acc.active && 
    acc.name.toLowerCase().includes(search.toLowerCase()) &&
    (!selectedCategory || acc.categoryId === selectedCategory)
  );

  const accountTransactions = selectedAccount 
    ? mockTransactions.filter(t => t.accountId === selectedAccount)
    : [];

  return (
    <div className="space-y-6">
      {/* Saldo Total */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Total</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(totalBalance)}</p>
            </div>
            <Wallet className="w-12 h-12 text-primary/60" />
          </div>
        </CardContent>
      </Card>

      {/* Saldo por Categoria (Cards clicáveis) */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Saldo por Categoria</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categoryBalances.map(cat => (
            <Card 
              key={cat.categoryId}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
                selectedCategory === cat.categoryId && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedCategory(
                selectedCategory === cat.categoryId ? null : cat.categoryId
              )}
            >
              <CardContent className="p-4">
                <div 
                  className="w-3 h-3 rounded-full mb-2"
                  style={{ backgroundColor: cat.color || '#64748B' }}
                />
                <p className="text-xs text-muted-foreground truncate">{cat.categoryName}</p>
                <p className="text-lg font-bold">{formatCurrency(cat.totalBalance)}</p>
                <p className="text-xs text-muted-foreground">{cat.accounts.length} contas</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Lista de Contas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Contas</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar conta..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Conta</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredAccounts.map(acc => (
              <div 
                key={acc.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                  selectedAccount === acc.id && "bg-muted border-primary"
                )}
                onClick={() => setSelectedAccount(selectedAccount === acc.id ? null : acc.id)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: mockAccountCategories.find(c => c.id === acc.categoryId)?.color + '20' }}
                  >
                    <Wallet className="w-5 h-5" style={{ color: mockAccountCategories.find(c => c.id === acc.categoryId)?.color }} />
                  </div>
                  <div>
                    <p className="font-medium">{acc.name}</p>
                    <p className="text-sm text-muted-foreground">{acc.categoryName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-lg">{formatCurrency(acc.balance)}</p>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Extrato (quando conta selecionada) */}
      {selectedAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Extrato - {mockAccounts.find(a => a.id === selectedAccount)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {accountTransactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma movimentação encontrada</p>
              ) : (
                accountTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {t.nature === 'ENTRADA' && <ArrowDownRight className="w-5 h-5 text-income" />}
                      {t.nature === 'SAIDA' && <ArrowUpRight className="w-5 h-5 text-expense" />}
                      {t.nature.startsWith('TRANSFERENCIA') && <ArrowLeftRight className="w-5 h-5 text-info" />}
                      <div>
                        <p className="font-medium text-sm">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{t.categoryName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-semibold",
                        t.nature === 'ENTRADA' && "text-income",
                        t.nature === 'SAIDA' && "text-expense",
                        t.nature.startsWith('TRANSFERENCIA') && "text-info"
                      )}>
                        {t.nature === 'SAIDA' || t.nature === 'TRANSFERENCIA_SAIDA' ? '-' : '+'}
                        {formatCurrency(t.value)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.paymentDate ? new Date(t.paymentDate).toLocaleDateString('pt-BR') : 'Pendente'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
