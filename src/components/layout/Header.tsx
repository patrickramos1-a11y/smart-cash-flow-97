import { Bell, Search, Calendar, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [period, setPeriod] = useState('Janeiro 2026');

  return (
    <header className="bg-card border-b border-border px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Period Selector */}
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{period}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              className="form-input pl-10 w-64"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-expense rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
