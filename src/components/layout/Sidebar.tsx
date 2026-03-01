import { useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowDownUp, 
  Wallet, 
  Users, 
  Settings, 
  FileSpreadsheet,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  RefreshCw,
  AlertCircle,
  ClipboardList,
  ChevronDown,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (v: boolean) => void;
}

type SubMenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type MenuItemType = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: 'new' | 'critical';
  subItems?: SubMenuItem[];
};

const menuItems: MenuItemType[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { 
    id: 'transactions', 
    label: 'Transações', 
    icon: ArrowDownUp,
    subItems: [
      { id: 'transactions', label: 'Visão Geral', icon: ArrowDownUp },
      { id: 'entradas-recorrentes', label: 'Entradas Recorrentes', icon: RefreshCw },
      { id: 'entradas-avulsas', label: 'Entradas Avulsas', icon: ArrowDownCircle },
      { id: 'despesas-fixas', label: 'Despesas Fixas', icon: RefreshCw },
      { id: 'despesas-variaveis', label: 'Despesas Variáveis', icon: ArrowUpCircle },
    ]
  },
  { id: 'accounts', label: 'Contas', icon: Wallet },
  { id: 'open-payments', label: 'Em Aberto', icon: AlertCircle, badge: 'critical' },
  { id: 'recurring-contracts', label: 'Contratos', icon: RefreshCw },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'entities', label: 'Entidades', icon: Building2 },
  { id: 'backlog', label: 'Backlog', icon: ClipboardList, badge: 'new' },
  { id: 'config', label: 'Configuração', icon: Settings },
  { id: 'reclassification', label: 'Reclassificação', icon: FileText },
  { id: 'import', label: 'Importar/Exportar', icon: FileSpreadsheet },
];

function SidebarContent({ 
  activeTab, 
  onTabChange, 
  collapsed, 
  setCollapsed, 
  isMobile = false 
}: { 
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean; 
  setCollapsed: (v: boolean) => void; 
  isMobile?: boolean 
}) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['transactions']);

  const toggleExpanded = (id: string) => {
    setExpandedMenus(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleMenuClick = (item: MenuItemType) => {
    if (item.subItems && !collapsed) {
      toggleExpanded(item.id);
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
          const isActive = activeTab === item.id || (item.subItems && item.subItems.some(s => s.id === activeTab));
          const isExpanded = expandedMenus.includes(item.id);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          
          return (
            <div key={item.id}>
              <button
                onClick={() => handleMenuClick(item)}
                className={cn(
                  "nav-item w-full relative",
                  isActive && !hasSubItems && "active",
                  hasSubItems && isActive && "bg-sidebar-accent/50"
                )}
                title={collapsed && !isMobile ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || isMobile) && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge === 'critical' && (
                      <span className="w-2 h-2 bg-expense rounded-full animate-pulse" />
                    )}
                    {item.badge === 'new' && (
                      <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                        Novo
                      </span>
                    )}
                    {hasSubItems && (
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    )}
                  </>
                )}
                {collapsed && !isMobile && item.badge === 'critical' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-expense rounded-full animate-pulse" />
                )}
              </button>

              {/* Sub-items */}
              {hasSubItems && isExpanded && (!collapsed || isMobile) && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-sidebar-border pl-3">
                  {item.subItems!.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isSubActive = activeTab === subItem.id;
                    
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => onTabChange(subItem.id)}
                        className={cn(
                          "nav-item w-full text-sm py-2",
                          isSubActive && "active"
                        )}
                      >
                        <SubIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{subItem.label}</span>
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

export function Sidebar({ activeTab, onTabChange, mobileOpen, setMobileOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isControlled = mobileOpen !== undefined && setMobileOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = isControlled ? mobileOpen : internalOpen;
  const setOpen = isControlled ? setMobileOpen : setInternalOpen;

  return (
    <>
      {/* Mobile Menu Button - top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-14 flex items-center px-3 gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2 hover:bg-muted rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-sidebar">
            <SidebarContent 
              activeTab={activeTab} 
              onTabChange={(tab) => { onTabChange(tab); setOpen(false); }}
              collapsed={false}
              setCollapsed={setCollapsed}
              isMobile
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">SR</span>
          </div>
          <span className="font-semibold text-foreground text-sm truncate">Sisramos Financeiro</span>
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
