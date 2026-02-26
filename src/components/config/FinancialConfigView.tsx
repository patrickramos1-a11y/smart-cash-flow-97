import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  Wallet, 
  Landmark, 
  Tags, 
  Target, 
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Loader2,
  Users
} from 'lucide-react';
import { 
  useCompanies,
  useAccounts,
  useAccountCategories,
  useCostCenters,
  useTransactionCategories,
  usePaymentMethods,
  useCreateCompany,
  useUpdateCompany,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useCreateAccountCategory,
  useUpdateAccountCategory,
  useDeleteAccountCategory,
  useCreateCostCenter,
  useUpdateCostCenter,
  useCreateTransactionCategory,
  useUpdateTransactionCategory,
  useDeleteTransactionCategory,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  type FinancialCompany,
  type Account,
  type AccountCategory,
  type CostCenter,
  type TransactionCategory,
  type PaymentMethod,
} from '@/hooks/useFinancialConfig';
import { useRecurringContracts, useContractPlans, useCreateContractPlan, useUpdateContractPlan, type ContractPlan } from '@/hooks/useRecurringContracts';
import { MinimumWageConfigModal } from '@/components/contracts/MinimumWageConfigModal';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// =============================================
// COMPANIES TAB
// =============================================

function CompaniesTab() {
  const { data: companies, isLoading } = useCompanies();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const [editingCompany, setEditingCompany] = useState<FinancialCompany | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', cnpj: '', active: true });

  const handleSubmit = () => {
    if (editingCompany) {
      updateCompany.mutate({ id: editingCompany.id, ...formData }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingCompany(null);
        }
      });
    } else {
      createCompany.mutate(formData, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setFormData({ name: '', cnpj: '', active: true });
        }
      });
    }
  };

  const openEdit = (company: FinancialCompany) => {
    setEditingCompany(company);
    setFormData({ name: company.name, cnpj: company.cnpj || '', active: company.active });
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingCompany(null);
    setFormData({ name: '', cnpj: '', active: true });
    setIsDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Gerencie as empresas/fontes financeiras do sistema.</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Empresa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCompany ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
              <DialogDescription>Preencha os dados da empresa.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input 
                  value={formData.cnpj} 
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.active} 
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label>Ativa</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!formData.name}>
                {editingCompany ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies?.map((company) => (
            <TableRow key={company.id}>
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell>{company.cnpj || '-'}</TableCell>
              <TableCell>
                <Badge variant={company.active ? 'default' : 'secondary'}>
                  {company.active ? 'Ativa' : 'Inativa'}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => openEdit(company)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {companies?.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                Nenhuma empresa cadastrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// =============================================
// ACCOUNTS TAB
// =============================================

function AccountsTab() {
  const { data: accounts, isLoading } = useAccounts();
  const { data: categories } = useAccountCategories();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    category_id: '',
    initial_balance: 0,
    active: true
  });

  const handleSubmit = () => {
    const payload = {
      ...formData,
      company_id: '00000000-0000-0000-0000-000000000001',
      category_id: formData.category_id || null,
    };

    if (editingAccount) {
      updateAccount.mutate({ id: editingAccount.id, ...payload }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingAccount(null);
        }
      });
    } else {
      createAccount.mutate({ ...payload, current_balance: formData.initial_balance }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setFormData({ name: '', bank: '', category_id: '', initial_balance: 0, active: true });
        }
      });
    }
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      bank: account.bank || '',
      category_id: account.category_id || '',
      initial_balance: account.initial_balance,
      active: account.active
    });
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingAccount(null);
    setFormData({ name: '', bank: '', category_id: '', initial_balance: 0, active: true });
    setIsDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Contas bancárias e carteiras da empresa.</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Conta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da conta"
                />
              </div>
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input 
                  value={formData.bank} 
                  onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                  placeholder="Nome do banco"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Saldo Inicial</Label>
                <Input 
                  type="number"
                  value={formData.initial_balance} 
                  onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.active} 
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label>Ativa</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!formData.name}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Banco</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Saldo Atual</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts?.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">{account.name}</TableCell>
              <TableCell>{account.bank || '-'}</TableCell>
              <TableCell>
                {account.category ? (
                  <Badge style={{ backgroundColor: account.category.color || undefined }}>
                    {account.category.name}
                  </Badge>
                ) : '-'}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(account.current_balance)}
              </TableCell>
              <TableCell>
                <Badge variant={account.active ? 'default' : 'secondary'}>
                  {account.active ? 'Ativa' : 'Inativa'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(account)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteAccount.mutate(account.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// =============================================
// ACCOUNT CATEGORIES TAB
// =============================================

function AccountCategoriesTab() {
  const { data: categories, isLoading } = useAccountCategories();
  const createCategory = useCreateAccountCategory();
  const updateCategory = useUpdateAccountCategory();
  const deleteCategory = useDeleteAccountCategory();
  const [editingCategory, setEditingCategory] = useState<AccountCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: '#6366f1', display_order: 0, active: true });

  const handleSubmit = () => {
    const payload = {
      ...formData,
      company_id: '00000000-0000-0000-0000-000000000001',
    };

    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, ...payload }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingCategory(null);
        }
      });
    } else {
      createCategory.mutate(payload, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setFormData({ name: '', color: '#6366f1', display_order: 0, active: true });
        }
      });
    }
  };

  const openEdit = (category: AccountCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color || '#6366f1',
      display_order: category.display_order,
      active: category.active
    });
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingCategory(null);
    setFormData({ name: '', color: '#6366f1', display_order: (categories?.length || 0) + 1, active: true });
    setIsDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Agrupadores para organizar as contas (ex: Bancária, Caixa, Investimentos).</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Categoria</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da categoria"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input 
                  type="color"
                  value={formData.color} 
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20"
                />
              </div>
              <div className="space-y-2">
                <Label>Ordem de Exibição</Label>
                <Input 
                  type="number"
                  value={formData.display_order} 
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.active} 
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label>Ativa</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!formData.name}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cor</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Ordem</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories?.map((category) => (
            <TableRow key={category.id}>
              <TableCell>
                <div 
                  className="w-6 h-6 rounded-full" 
                  style={{ backgroundColor: category.color || '#6366f1' }}
                />
              </TableCell>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>{category.display_order}</TableCell>
              <TableCell>
                <Badge variant={category.active ? 'default' : 'secondary'}>
                  {category.active ? 'Ativa' : 'Inativa'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteCategory.mutate(category.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// =============================================
// COST CENTERS TAB
// =============================================

function CostCentersTab() {
  const { data: costCenters, isLoading } = useCostCenters();
  const createCostCenter = useCreateCostCenter();
  const updateCostCenter = useUpdateCostCenter();
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    dre_group: '',
    dre_label: '',
    dre_order: 0,
    is_expense: true,
    active: true
  });

  const dreGroups = [
    { value: 'RECEITA', label: 'Receita' },
    { value: 'DEDUCAO', label: 'Dedução' },
    { value: 'CUSTO', label: 'Custo' },
    { value: 'DESPESA_OP', label: 'Despesa Operacional' },
    { value: 'IMPOSTO', label: 'Imposto' },
    { value: 'OUTRAS_REC', label: 'Outras Receitas' },
    { value: 'OUTRAS_DESP', label: 'Outras Despesas' },
    { value: 'PROVISAO', label: 'Provisão' },
    { value: 'INVESTIMENTO', label: 'Investimento' },
    { value: 'DISTRIBUICAO', label: 'Distribuição' },
  ];

  const handleSubmit = () => {
    const payload = {
      ...formData,
      company_id: '00000000-0000-0000-0000-000000000001',
    };

    if (editingCostCenter) {
      updateCostCenter.mutate({ id: editingCostCenter.id, ...payload }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingCostCenter(null);
        }
      });
    } else {
      createCostCenter.mutate(payload, {
        onSuccess: () => {
          setIsDialogOpen(false);
        }
      });
    }
  };

  const openEdit = (cc: CostCenter) => {
    setEditingCostCenter(cc);
    setFormData({
      name: cc.name,
      code: cc.code || '',
      dre_group: cc.dre_group,
      dre_label: cc.dre_label,
      dre_order: cc.dre_order,
      is_expense: cc.is_expense,
      active: cc.active
    });
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingCostCenter(null);
    setFormData({
      name: '',
      code: '',
      dre_group: '',
      dre_label: '',
      dre_order: (costCenters?.length || 0) + 1,
      is_expense: true,
      active: true
    });
    setIsDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Centros de custo que definem a estrutura do DRE (15 grupos).</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo Centro de Custo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCostCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input 
                    value={formData.code} 
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Grupo DRE</Label>
                <Select value={formData.dre_group} onValueChange={(v) => setFormData({ ...formData, dre_group: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {dreGroups.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Label no DRE</Label>
                <Input 
                  value={formData.dre_label} 
                  onChange={(e) => setFormData({ ...formData, dre_label: e.target.value })}
                  placeholder="Ex: (-) Despesas administrativas"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ordem no DRE</Label>
                  <Input 
                    type="number"
                    value={formData.dre_order} 
                    onChange={(e) => setFormData({ ...formData, dre_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch 
                    checked={formData.is_expense} 
                    onCheckedChange={(checked) => setFormData({ ...formData, is_expense: checked })}
                  />
                  <Label>É despesa (deduz)</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!formData.name || !formData.dre_group}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ordem</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Grupo DRE</TableHead>
            <TableHead>Label DRE</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {costCenters?.map((cc) => (
            <TableRow key={cc.id}>
              <TableCell>{cc.dre_order}</TableCell>
              <TableCell><Badge variant="outline">{cc.code}</Badge></TableCell>
              <TableCell className="font-medium">{cc.name}</TableCell>
              <TableCell>{cc.dre_group}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{cc.dre_label}</TableCell>
              <TableCell>
                <Badge variant={cc.is_expense ? 'destructive' : 'default'}>
                  {cc.is_expense ? 'Despesa' : 'Receita'}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => openEdit(cc)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// =============================================
// TRANSACTION CATEGORIES TAB
// =============================================

function TransactionCategoriesTab() {
  const { data: categories, isLoading } = useTransactionCategories();
  const { data: costCenters } = useCostCenters();
  const createCategory = useCreateTransactionCategory();
  const updateCategory = useUpdateTransactionCategory();
  const deleteCategory = useDeleteTransactionCategory();
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cost_center_id: '',
    type: 'SAIDA' as 'ENTRADA' | 'SAIDA',
    expense_type: '' as 'FIXA' | 'VARIAVEL' | 'IMPOSTO' | '',
    color: '#6366f1',
    active: true
  });

  const handleSubmit = () => {
    const payload = {
      ...formData,
      company_id: '00000000-0000-0000-0000-000000000001',
      expense_type: formData.expense_type || null,
    };

    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, ...payload }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingCategory(null);
        }
      });
    } else {
      createCategory.mutate(payload, {
        onSuccess: () => {
          setIsDialogOpen(false);
        }
      });
    }
  };

  const openEdit = (cat: TransactionCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      cost_center_id: cat.cost_center_id,
      type: cat.type,
      expense_type: cat.expense_type || '',
      color: cat.color || '#6366f1',
      active: cat.active
    });
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      cost_center_id: '',
      type: 'SAIDA',
      expense_type: '',
      color: '#6366f1',
      active: true
    });
    setIsDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Categorias para classificar as transações (vinculadas a centros de custo).</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Categoria</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Centro de Custo *</Label>
                <Select value={formData.cost_center_id} onValueChange={(v) => setFormData({ ...formData, cost_center_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o centro de custo" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCenters?.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(v: 'ENTRADA' | 'SAIDA') => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENTRADA">Entrada</SelectItem>
                      <SelectItem value="SAIDA">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Natureza da Despesa</Label>
                  <Select 
                    value={formData.expense_type} 
                    onValueChange={(v: 'FIXA' | 'VARIAVEL' | 'IMPOSTO' | '') => setFormData({ ...formData, expense_type: v })}
                    disabled={formData.type === 'ENTRADA'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXA">Fixa</SelectItem>
                      <SelectItem value="VARIAVEL">Variável</SelectItem>
                      <SelectItem value="IMPOSTO">Imposto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input 
                  type="color"
                  value={formData.color} 
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!formData.name || !formData.cost_center_id}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cor</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Centro de Custo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Natureza</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories?.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell>
                <div 
                  className="w-6 h-6 rounded-full" 
                  style={{ backgroundColor: cat.color || '#6366f1' }}
                />
              </TableCell>
              <TableCell className="font-medium">{cat.name}</TableCell>
              <TableCell>{cat.cost_center?.name || '-'}</TableCell>
              <TableCell>
                <Badge variant={cat.type === 'ENTRADA' ? 'default' : 'destructive'}>
                  {cat.type === 'ENTRADA' ? 'Entrada' : 'Saída'}
                </Badge>
              </TableCell>
              <TableCell>
                {cat.expense_type ? (
                  <Badge variant="outline">{cat.expense_type}</Badge>
                ) : '-'}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteCategory.mutate(cat.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// =============================================
// PAYMENT METHODS TAB
// =============================================

function PaymentMethodsTab() {
  const { data: methods, isLoading } = usePaymentMethods();
  const createMethod = useCreatePaymentMethod();
  const updateMethod = useUpdatePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', active: true });

  const handleSubmit = () => {
    const payload = {
      ...formData,
      company_id: '00000000-0000-0000-0000-000000000001',
    };

    if (editingMethod) {
      updateMethod.mutate({ id: editingMethod.id, ...payload }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingMethod(null);
        }
      });
    } else {
      createMethod.mutate(payload, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setFormData({ name: '', active: true });
        }
      });
    }
  };

  const openEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({ name: method.name, active: method.active });
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingMethod(null);
    setFormData({ name: '', active: true });
    setIsDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Formas de pagamento aceitas pela empresa.</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Forma</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMethod ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: PIX, Boleto, Cartão..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.active} 
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label>Ativa</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!formData.name}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {methods?.map((method) => (
          <Card key={method.id} className={!method.active ? 'opacity-50' : ''}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{method.name}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(method)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteMethod.mutate(method.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// =============================================
// MINIMUM WAGE TAB
// =============================================

function MinimumWageTab() {
  const { data: contracts } = useRecurringContracts();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Configuração do salário mínimo por ano para cálculo de contratos recorrentes.</p>
        <Button onClick={() => setIsModalOpen(true)}>
          <DollarSign className="w-4 h-4 mr-2" />
          Configurar Salário Mínimo
        </Button>
      </div>

      <Card className="border-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Badge variant="default">Atual</Badge>
            2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(1518)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {contracts?.length || 0} contratos ativos
          </p>
        </CardContent>
      </Card>

      <MinimumWageConfigModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

// =============================================
// CONTRACT PLANS TAB
// =============================================

function ContractPlansTab() {
  const { data: plans, isLoading } = useContractPlans();
  const createPlan = useCreateContractPlan();
  const updatePlan = useUpdateContractPlan();
  const [editingPlan, setEditingPlan] = useState<ContractPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', minimum_wage_factor: 1, description: '', active: true });

  const handleSubmit = () => {
    if (editingPlan) {
      updatePlan.mutate({ id: editingPlan.id, ...formData }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingPlan(null);
        }
      });
    } else {
      createPlan.mutate(formData, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setFormData({ name: '', minimum_wage_factor: 1, description: '', active: true });
        }
      });
    }
  };

  const openEdit = (plan: ContractPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      minimum_wage_factor: plan.minimum_wage_factor,
      description: plan.description || '',
      active: plan.active,
    });
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingPlan(null);
    setFormData({ name: '', minimum_wage_factor: 1, description: '', active: true });
    setIsDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Planos de contrato com fator de salário mínimo para vincular aos contratos recorrentes.</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo Plano</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
              <DialogDescription>Defina o nome e o fator de salário mínimo do plano.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Plano *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Básico, VIP, Premium, Master"
                />
              </div>
              <div className="space-y-2">
                <Label>Fator de Salário Mínimo *</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={formData.minimum_wage_factor}
                  onChange={(e) => setFormData({ ...formData, minimum_wage_factor: parseFloat(e.target.value) || 0 })}
                  placeholder="Ex: 0.75, 1.5, 2, 3"
                />
                <p className="text-xs text-muted-foreground">
                  Quantos salários mínimos este plano representa (ex: 1.5 = 1,5 SM)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional do plano"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label>Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!formData.name || formData.minimum_wage_factor <= 0}>
                {editingPlan ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plano</TableHead>
            <TableHead>Fator SM</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans?.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">{plan.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono">
                  {plan.minimum_wage_factor} SM
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{plan.description || '-'}</TableCell>
              <TableCell>
                <Badge variant={plan.active ? 'default' : 'secondary'}>
                  {plan.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {plans?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Nenhum plano cadastrado. Crie planos como Básico, VIP, Premium e Master.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// =============================================
// MAIN COMPONENT
// =============================================

export function FinancialConfigView() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Configuração Financeira</CardTitle>
          <CardDescription>
            Gerencie todos os elementos estruturais do sistema financeiro em um só lugar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="companies" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6">
              <TabsTrigger value="companies" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span className="hidden lg:inline">Empresas</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span className="hidden lg:inline">Contas</span>
              </TabsTrigger>
              <TabsTrigger value="account-categories" className="flex items-center gap-2">
                <Landmark className="w-4 h-4" />
                <span className="hidden lg:inline">Agrupadores</span>
              </TabsTrigger>
              <TabsTrigger value="cost-centers" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="hidden lg:inline">Centros de Custo</span>
              </TabsTrigger>
              <TabsTrigger value="transaction-categories" className="flex items-center gap-2">
                <Tags className="w-4 h-4" />
                <span className="hidden lg:inline">Categorias</span>
              </TabsTrigger>
              <TabsTrigger value="payment-methods" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="hidden lg:inline">Pagamentos</span>
              </TabsTrigger>
              <TabsTrigger value="contract-plans" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden lg:inline">Planos</span>
              </TabsTrigger>
              <TabsTrigger value="minimum-wage" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden lg:inline">Salário Mínimo</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="companies">
              <CompaniesTab />
            </TabsContent>
            <TabsContent value="accounts">
              <AccountsTab />
            </TabsContent>
            <TabsContent value="account-categories">
              <AccountCategoriesTab />
            </TabsContent>
            <TabsContent value="cost-centers">
              <CostCentersTab />
            </TabsContent>
            <TabsContent value="transaction-categories">
              <TransactionCategoriesTab />
            </TabsContent>
            <TabsContent value="payment-methods">
              <PaymentMethodsTab />
            </TabsContent>
            <TabsContent value="contract-plans">
              <ContractPlansTab />
            </TabsContent>
            <TabsContent value="minimum-wage">
              <MinimumWageTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
