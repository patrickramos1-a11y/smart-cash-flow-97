import { useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowDownUp, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Users, 
  Settings, 
  FileSpreadsheet,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wallet,
  Building2,
  Tags,
  Target,
  CreditCard,
  Landmark,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

type MenuItemType = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
};

const menuItems: MenuItemType[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts', label: 'Contas', icon: Wallet },
  { id: 'transactions', label: 'Transações', icon: ArrowDownUp },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { 
    id: 'settings', 
    label: 'Cadastros', 
    icon: Settings,
    children: [
      { id: 'settings-companies', label: 'Empresas Financeiras', icon: Building2 },
      { id: 'settings-accounts', label: 'Contas', icon: Wallet },
      { id: 'settings-account-categories', label: 'Categorias de Conta', icon: Landmark },
      { id: 'settings-categories', label: 'Categorias de Transação', icon: Tags },
      { id: 'settings-cost-centers', label: 'Centros de Custo', icon: Target },
      { id: 'settings-payment-methods', label: 'Formas de Pagamento', icon: CreditCard },
      { id: 'settings-sources', label: 'Fontes Financeiras', icon: Landmark },
    ]
  },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'import', label: 'Importar/Exportar', icon: FileSpreadsheet },
];

function SidebarContent({ activeTab, onTabChange, collapsed, setCollapsed, isMobile = false }: SidebarProps & { collapsed: boolean; setCollapsed: (v: boolean) => void; isMobile?: boolean }) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const handleMenuClick = (item: MenuItemType) => {
    if (item.children) {
      setExpandedMenu(expandedMenu === item.id ? null : item.id);
    } else {
      onTabChange(item.id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 lg:p-6 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg">
          <span className="text-white font-bold text-lg">SR</span>
        </div>
        {(!collapsed || isMobile) && (
          <div className="overflow-hidden">
            <h1 className="text-sidebar-foreground font-bold text-lg leading-tight">Sisramos</h1>
            <p className="text-sidebar-foreground/60 text-xs">Módulo Financeiro</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.children && activeTab.startsWith('settings'));
          const isExpanded = expandedMenu === item.id;
          
          return (
            <div key={item.id}>
              <button
                onClick={() => handleMenuClick(item)}
                className={cn(
                  "nav-item w-full",
                  isActive && !item.children && "active",
                  item.children && isExpanded && "bg-sidebar-accent/50"
                )}
                title={collapsed && !isMobile ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || isMobile) && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.children && (
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform",
                        isExpanded && "rotate-90"
                      )} />
                    )}
                  </>
                )}
              </button>
              
              {/* Submenu */}
              {item.children && isExpanded && (!collapsed || isMobile) && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-sidebar-border pl-3">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = activeTab === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => onTabChange(child.id)}
                        className={cn(
                          "nav-item w-full text-sm py-2",
                          isChildActive && "active"
                        )}
                      >
                        <ChildIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse button (desktop only) */}
      {!isMobile && (
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="nav-item w-full justify-center"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span>Recolher</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3",
          collapsed && !isMobile && "justify-center"
        )}>
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            <span className="text-sidebar-foreground text-sm font-medium">U</span>
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sidebar-foreground text-sm font-medium truncate">Usuário</p>
              <p className="text-sidebar-foreground/60 text-xs truncate">admin@ramos.com</p>
            </div>
          )}
          {(!collapsed || isMobile) && (
            <button className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border p-3 flex items-center gap-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="p-2 hover:bg-muted rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-sidebar">
            <SidebarContent 
              activeTab={activeTab} 
              onTabChange={(tab) => { onTabChange(tab); setMobileOpen(false); }}
              collapsed={false}
              setCollapsed={setCollapsed}
              isMobile
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">SR</span>
          </div>
          <span className="font-semibold text-foreground">Sisramos Financeiro</span>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex fixed left-0 top-0 h-screen bg-sidebar flex-col border-r border-sidebar-border transition-all duration-300 z-50",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent 
          activeTab={activeTab} 
          onTabChange={onTabChange}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </aside>
    </>
  );
}
