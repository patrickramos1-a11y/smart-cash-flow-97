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
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Lançamentos', icon: ArrowDownUp },
  { id: 'income', label: 'Entradas', icon: ArrowUpCircle },
  { id: 'expenses', label: 'Despesas', icon: ArrowDownCircle },
  { id: 'clients', label: 'Clientes & Contratos', icon: Users },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'import', label: 'Importar XLSX', icon: FileSpreadsheet },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 z-50",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">SR</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sidebar-foreground font-bold text-lg leading-tight">Sisramos</h1>
            <p className="text-sidebar-foreground/60 text-xs">Módulo Financeiro</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "nav-item w-full",
                isActive && "active"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse button */}
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

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            <span className="text-sidebar-foreground text-sm font-medium">U</span>
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sidebar-foreground text-sm font-medium truncate">Usuário</p>
              <p className="text-sidebar-foreground/60 text-xs truncate">admin@ramos.com</p>
            </div>
          )}
          {!collapsed && (
            <button className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
