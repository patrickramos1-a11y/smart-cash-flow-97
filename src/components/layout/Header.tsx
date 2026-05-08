import { Bell, Search, Calendar, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [period, setPeriod] = useState('Janeiro 2026');
  const [showSearch, setShowSearch] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <header className="bg-card border-b border-border px-4 py-3">
        {showSearch ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar..."
                className="pl-9 h-9"
                autoFocus
              />
            </div>
            <button 
              onClick={() => setShowSearch(false)}
              className="p-2 rounded-lg hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground text-xs truncate">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button 
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Search className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="w-5 h-5 text-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-expense rounded-full" />
              </button>
            </div>
          </div>
        )}
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 glass border-b border-border/60 px-8 py-4">
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground text-sm mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary border border-border/40 hover:border-primary/40 hover:bg-accent/40 transition-colors">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{period}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar..." className="form-input pl-10 w-64 h-10" />
          </div>
          <button className="relative w-10 h-10 rounded-xl bg-secondary border border-border/40 hover:border-primary/40 hover:bg-accent/40 transition-colors flex items-center justify-center">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-expense rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
