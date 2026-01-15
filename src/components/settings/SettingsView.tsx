import { useState } from 'react';
import { 
  CreditCard, 
  Tag, 
  Building2, 
  Wallet,
  FileText,
  Wand2,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { 
  mockAccounts, 
  mockCategories, 
  mockCostCenters, 
  mockPaymentMethods 
} from '@/data/mockData';
import { cn } from '@/lib/utils';

type SettingsTab = 'accounts' | 'categories' | 'costcenters' | 'payment' | 'documents' | 'rules';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('accounts');

  const tabs = [
    { id: 'accounts' as const, label: 'Contas', icon: CreditCard },
    { id: 'categories' as const, label: 'Categorias', icon: Tag },
    { id: 'costcenters' as const, label: 'Centros de Custo', icon: Building2 },
    { id: 'payment' as const, label: 'Formas de Pagamento', icon: Wallet },
    { id: 'documents' as const, label: 'Tipos de Documento', icon: FileText },
    { id: 'rules' as const, label: 'Regras Automáticas', icon: Wand2 },
  ];

  const documentTypes = [
    { id: 'NF', name: 'Nota Fiscal', active: true },
    { id: 'RECIBO', name: 'Recibo', active: true },
    { id: 'NOTA_DEBITO', name: 'Nota de Débito', active: true },
    { id: 'SEM_DOCUMENTO', name: 'Sem Documento', active: true },
  ];

  const automationRules = [
    { 
      id: '1', 
      name: 'Receita Recorrente', 
      condition: 'Descrição contém "Recorrente"', 
      action: 'Tipo receita = RECORRENTE',
      active: true 
    },
    { 
      id: '2', 
      name: 'Despesa Fixa - Aluguel', 
      condition: 'Categoria = "ALUGUEL"', 
      action: 'Tipo despesa = FIXA',
      active: true 
    },
    { 
      id: '3', 
      name: 'Despesa Fixa - Salários', 
      condition: 'Categoria = "SALÁRIOS"', 
      action: 'Tipo despesa = FIXA',
      active: true 
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'accounts':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Gerencie as contas bancárias e de caixa</p>
              <button className="btn-primary">
                <Plus className="w-4 h-4" />
                Nova Conta
              </button>
            </div>
            <div className="space-y-3">
              {mockAccounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{account.name}</p>
                      <p className="text-sm text-muted-foreground">{account.bank || account.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      account.active ? "bg-income-muted text-income" : "bg-muted text-muted-foreground"
                    )}>
                      {account.active ? 'Ativo' : 'Inativo'}
                    </span>
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Categorias para classificação de lançamentos</p>
              <button className="btn-primary">
                <Plus className="w-4 h-4" />
                Nova Categoria
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-income"></span>
                  Entradas
                </h4>
                <div className="space-y-2">
                  {mockCategories.filter(c => c.nature === 'ENTRADA').map((category) => (
                    <div 
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-income-muted/50 rounded-lg"
                    >
                      <span className="font-medium text-foreground">{category.name}</span>
                      <button className="p-1.5 rounded hover:bg-muted transition-colors">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-expense"></span>
                  Saídas
                </h4>
                <div className="space-y-2">
                  {mockCategories.filter(c => c.nature === 'SAIDA').map((category) => (
                    <div 
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-expense-muted/50 rounded-lg"
                    >
                      <span className="font-medium text-foreground">{category.name}</span>
                      <button className="p-1.5 rounded hover:bg-muted transition-colors">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'costcenters':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Centros de custo para análise gerencial</p>
              <button className="btn-primary">
                <Plus className="w-4 h-4" />
                Novo Centro
              </button>
            </div>
            <div className="space-y-3">
              {mockCostCenters.map((center) => (
                <div 
                  key={center.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-info-muted flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{center.name}</p>
                      <p className="text-sm text-muted-foreground">Código: {center.code}</p>
                    </div>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Formas de pagamento disponíveis</p>
              <button className="btn-primary">
                <Plus className="w-4 h-4" />
                Nova Forma
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {mockPaymentMethods.map((method) => (
                <div 
                  key={method.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                >
                  <span className="font-medium text-foreground">{method.name}</span>
                  <button className="text-muted-foreground hover:text-foreground">
                    {method.active ? (
                      <ToggleRight className="w-5 h-5 text-income" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Tipos de documento fiscal</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {documentTypes.map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{doc.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'rules':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Regras de classificação automática</p>
              <button className="btn-primary">
                <Plus className="w-4 h-4" />
                Nova Regra
              </button>
            </div>
            <div className="space-y-3">
              {automationRules.map((rule) => (
                <div 
                  key={rule.id}
                  className="p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Wand2 className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-foreground">{rule.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-muted-foreground hover:text-foreground">
                        {rule.active ? (
                          <ToggleRight className="w-5 h-5 text-income" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <button className="p-1.5 rounded hover:bg-muted transition-colors">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="px-2 py-1 bg-info-muted text-info rounded">
                      SE: {rule.condition}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="px-2 py-1 bg-income-muted text-income rounded">
                      ENTÃO: {rule.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-card rounded-xl border border-border/50 p-6">
        {renderContent()}
      </div>
    </div>
  );
}
