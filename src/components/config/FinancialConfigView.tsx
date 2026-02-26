import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  useBulkUpdateTransactionCategories,
  type CategorySubtype,
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
// TRANSACTION CATEGORIES TAB (Redesigned - Category as Core)
// =============================================


const SUBTYPE_LABELS: Record<string, string> = {
  RECORRENTE: 'Entrada Recorrente',
  AVULSA: 'Entrada Avulsa',
  FIXA: 'Despesa Fixa',
  VARIAVEL: 'Despesa Variável',
};

const SUBTYPE_COLORS: Record<string, string> = {
  RECORRENTE: 'bg-emerald-700 text-white',
  AVULSA: 'bg-emerald-400 text-white',
  FIXA: 'bg-red-700 text-white',
  VARIAVEL: 'bg-red-400 text-white',
};

function TransactionCategoriesTab() {
  const { data: categories, isLoading } = useTransactionCategories();
  const { data: costCenters } = useCostCenters();
  const { data: accounts } = useAccounts();
  const createCategory = useCreateTransactionCategory();
  const updateCategory = useUpdateTransactionCategory();
  const deleteCategory = useDeleteTransactionCategory();
  const bulkUpdate = useBulkUpdateTransactionCategories();
  
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkField, setBulkField] = useState<'subtype' | 'account' | 'cost_center' | 'active'>('subtype');
  const [bulkValue, setBulkValue] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    cost_center_id: '',
    type: 'SAIDA' as 'ENTRADA' | 'SAIDA',
    subtype: '' as CategorySubtype | '',
    default_account_id: '',
    color: '#6366f1',
    active: true
  });

  // Derive expense_type from subtype for backward compatibility
  const getExpenseType = (subtype: string) => {
    if (subtype === 'FIXA') return 'FIXA';
    if (subtype === 'VARIAVEL') return 'VARIAVEL';
    return null;
  };

  const handleSubmit = () => {
    const payload = {
      name: formData.name,
      cost_center_id: formData.cost_center_id,
      type: formData.type,
      subtype: formData.subtype || null,
      expense_type: formData.type === 'SAIDA' ? getExpenseType(formData.subtype) : null,
      default_account_id: formData.default_account_id || null,
      color: formData.color,
      active: formData.active,
      company_id: '00000000-0000-0000-0000-000000000001',
    };

    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, ...payload } as any, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingCategory(null);
        }
      });
    } else {
      createCategory.mutate(payload as any, {
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
      subtype: (cat.subtype || '') as CategorySubtype | '',
      default_account_id: cat.default_account_id || '',
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
      subtype: '',
      default_account_id: '',
      color: '#6366f1',
      active: true
    });
    setIsDialogOpen(true);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === (categories?.length || 0)) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(categories?.map(c => c.id) || []));
    }
  };

  const handleBulkAction = () => {
    const ids = Array.from(selectedIds);
    let updates: any = {};
    if (bulkField === 'subtype') updates.subtype = bulkValue;
    if (bulkField === 'account') updates.default_account_id = bulkValue;
    if (bulkField === 'cost_center') updates.cost_center_id = bulkValue;
    if (bulkField === 'active') updates.active = bulkValue === 'true';
    
    bulkUpdate.mutate({ ids, updates }, {
      onSuccess: () => {
        setBulkDialogOpen(false);
        setSelectedIds(new Set());
        setBulkValue('');
      }
    });
  };

  // Auto-set subtype options based on type
  const subtypeOptions = formData.type === 'ENTRADA' 
    ? [{ value: 'RECORRENTE', label: 'Recorrente' }, { value: 'AVULSA', label: 'Avulsa' }]
    : [{ value: 'FIXA', label: 'Fixa' }, { value: 'VARIAVEL', label: 'Variável' }];

  // Group categories by full type
  const grouped = {
    RECORRENTE: categories?.filter(c => c.type === 'ENTRADA' && c.subtype === 'RECORRENTE') || [],
    AVULSA: categories?.filter(c => c.type === 'ENTRADA' && c.subtype === 'AVULSA') || [],
    FIXA: categories?.filter(c => c.type === 'SAIDA' && c.subtype === 'FIXA') || [],
    VARIAVEL: categories?.filter(c => c.type === 'SAIDA' && c.subtype === 'VARIAVEL') || [],
    SEM_SUBTIPO: categories?.filter(c => !c.subtype) || [],
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const renderGroup = (label: string, items: TransactionCategory[], badgeClass: string) => {
    if (items.length === 0) return null;
    return (
      <div key={label} className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge className={badgeClass}>{label}</Badge>
          <span className="text-xs text-muted-foreground">{items.length} categorias</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox 
                  checked={items.every(i => selectedIds.has(i.id))}
                  onCheckedChange={() => {
                    const next = new Set(selectedIds);
                    const allSelected = items.every(i => next.has(i.id));
                    items.forEach(i => allSelected ? next.delete(i.id) : next.add(i.id));
                    setSelectedIds(next);
                  }}
                />
              </TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Conta Vinculada</TableHead>
              <TableHead>Centro de Custo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((cat) => (
              <TableRow key={cat.id} className={!cat.active ? 'opacity-50' : ''}>
                <TableCell>
                  <Checkbox 
                    checked={selectedIds.has(cat.id)}
                    onCheckedChange={() => toggleSelect(cat.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: cat.color || '#6366f1' }} />
                </TableCell>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-sm">
                  {(cat as any).default_account?.name || <span className="text-muted-foreground italic">Não definida</span>}
                </TableCell>
                <TableCell className="text-sm">{cat.cost_center?.name || '-'}</TableCell>
                <TableCell>
                  <Badge variant={cat.active ? 'default' : 'secondary'}>
                    {cat.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCategory.mutate(cat.id)} className="text-destructive">
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
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <p className="text-muted-foreground text-sm">
          A Categoria é o núcleo do sistema. Ela define tipo, conta e centro de custo automaticamente.
        </p>
        <div className="flex gap-2">
          {selectedIds.size >= 2 && (
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setBulkDialogOpen(true)}>
                  Editar {selectedIds.size} selecionadas
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edição em Massa</DialogTitle>
                  <DialogDescription>Alterar {selectedIds.size} categorias selecionadas.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Campo a alterar</Label>
                    <Select value={bulkField} onValueChange={(v: any) => { setBulkField(v); setBulkValue(''); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subtype">Subtipo</SelectItem>
                        <SelectItem value="account">Conta Vinculada</SelectItem>
                        <SelectItem value="cost_center">Centro de Custo</SelectItem>
                        <SelectItem value="active">Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Novo valor</Label>
                    {bulkField === 'subtype' && (
                      <Select value={bulkValue} onValueChange={setBulkValue}>
                        <SelectTrigger><SelectValue placeholder="Selecionar subtipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RECORRENTE">Recorrente</SelectItem>
                          <SelectItem value="AVULSA">Avulsa</SelectItem>
                          <SelectItem value="FIXA">Fixa</SelectItem>
                          <SelectItem value="VARIAVEL">Variável</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {bulkField === 'account' && (
                      <Select value={bulkValue} onValueChange={setBulkValue}>
                        <SelectTrigger><SelectValue placeholder="Selecionar conta" /></SelectTrigger>
                        <SelectContent>
                          {accounts?.filter(a => a.active).map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {bulkField === 'cost_center' && (
                      <Select value={bulkValue} onValueChange={setBulkValue}>
                        <SelectTrigger><SelectValue placeholder="Selecionar centro de custo" /></SelectTrigger>
                        <SelectContent>
                          {costCenters?.map(cc => (
                            <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {bulkField === 'active' && (
                      <Select value={bulkValue} onValueChange={setBulkValue}>
                        <SelectTrigger><SelectValue placeholder="Selecionar status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Ativa</SelectItem>
                          <SelectItem value="false">Inativa</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleBulkAction} disabled={!bulkValue || bulkUpdate.isPending}>
                    {bulkUpdate.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Aplicar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nova Categoria</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                <DialogDescription>A categoria define automaticamente conta e centro de custo nos lançamentos.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Acompanhamento Ambiental, Aluguel, Papelaria..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select value={formData.type} onValueChange={(v: 'ENTRADA' | 'SAIDA') => setFormData({ ...formData, type: v, subtype: '' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENTRADA">Entrada</SelectItem>
                        <SelectItem value="SAIDA">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subtipo *</Label>
                    <Select value={formData.subtype} onValueChange={(v: CategorySubtype) => setFormData({ ...formData, subtype: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {subtypeOptions.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Conta Vinculada *</Label>
                  <Select value={formData.default_account_id} onValueChange={(v) => setFormData({ ...formData, default_account_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar conta" /></SelectTrigger>
                    <SelectContent>
                      {accounts?.filter(a => a.active).map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name} {a.bank ? `(${a.bank})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Conta herdada automaticamente nos lançamentos.</p>
                </div>

                <div className="space-y-2">
                  <Label>Centro de Custo *</Label>
                  <Select value={formData.cost_center_id} onValueChange={(v) => setFormData({ ...formData, cost_center_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar centro de custo" /></SelectTrigger>
                    <SelectContent>
                      {costCenters?.map(cc => (
                        <SelectItem key={cc.id} value={cc.id}>{cc.name} ({cc.dre_label})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <Input 
                      type="color"
                      value={formData.color} 
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 w-20"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch 
                      checked={formData.active} 
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                    <Label>Ativa</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={!formData.name || !formData.cost_center_id || !formData.subtype}>
                  {editingCategory ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grouped display */}
      <div className="space-y-6">
        {renderGroup('Entrada Recorrente', grouped.RECORRENTE, SUBTYPE_COLORS.RECORRENTE)}
        {renderGroup('Entrada Avulsa', grouped.AVULSA, SUBTYPE_COLORS.AVULSA)}
        {renderGroup('Despesa Fixa', grouped.FIXA, SUBTYPE_COLORS.FIXA)}
        {renderGroup('Despesa Variável', grouped.VARIAVEL, SUBTYPE_COLORS.VARIAVEL)}
        {grouped.SEM_SUBTIPO.length > 0 && renderGroup('Sem Subtipo (classificar)', grouped.SEM_SUBTIPO, 'bg-muted text-muted-foreground')}
      </div>
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
