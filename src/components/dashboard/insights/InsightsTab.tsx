import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle, CheckCircle2, Info, AlertCircle, Lightbulb, Search, Filter,
} from 'lucide-react';
import { useInsights, type Insight, type InsightCategory, type InsightSeverity } from '@/hooks/useInsights';

const severityConfig: Record<InsightSeverity, { icon: any; color: string; bg: string; label: string }> = {
  critical: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', label: 'Crítico' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10 border-warning/30', label: 'Atenção' },
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10 border-primary/30', label: 'Info' },
  success: { icon: CheckCircle2, color: 'text-income', bg: 'bg-income/10 border-income/30', label: 'Positivo' },
};

const categoryLabels: Record<InsightCategory, string> = {
  receita: 'Receita',
  despesa: 'Despesa',
  caixa: 'Caixa',
  cliente: 'Cliente',
  operacional: 'Operacional',
};

export function InsightsTab() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const [search, setSearch] = useState('');
  const [filterSev, setFilterSev] = useState<InsightSeverity | 'all'>('all');
  const [filterCat, setFilterCat] = useState<InsightCategory | 'all'>('all');

  const { data: insights, isLoading } = useInsights(year);

  const filtered = useMemo(() => {
    if (!insights) return [];
    return insights.filter(i => {
      if (filterSev !== 'all' && i.severity !== filterSev) return false;
      if (filterCat !== 'all' && i.category !== filterCat) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!i.title.toLowerCase().includes(q) && !i.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [insights, search, filterSev, filterCat]);

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0, success: 0 } as Record<InsightSeverity, number>;
    insights?.forEach(i => { c[i.severity] += 1; });
    return c;
  }, [insights]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center bg-card border border-border rounded-xl px-3 py-2.5">
        <span className="text-xs lg:text-sm font-medium text-muted-foreground">Ano:</span>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-background border border-border rounded-md px-2 py-1 text-sm"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar insight..."
            className="pl-8 h-9"
          />
        </div>

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value as any)}
          className="bg-background border border-border rounded-md px-2 py-1 text-sm"
        >
          <option value="all">Todas categorias</option>
          {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Severity counters as filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
        {(['critical', 'warning', 'info', 'success'] as InsightSeverity[]).map(sev => {
          const cfg = severityConfig[sev];
          const Icon = cfg.icon;
          const isActive = filterSev === sev;
          return (
            <button
              key={sev}
              onClick={() => setFilterSev(isActive ? 'all' : sev)}
              className={`text-left rounded-xl border p-3 transition ${cfg.bg} ${
                isActive ? 'ring-2 ring-offset-2 ring-offset-background ring-current' : 'hover:opacity-80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{cfg.label}</span>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div className={`text-2xl font-bold ${cfg.color}`}>{counts[sev]}</div>
            </button>
          );
        })}
      </div>

      {filterSev !== 'all' || filterCat !== 'all' || search ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="w-3 h-3" />
          {filtered.length} de {insights?.length || 0} insights
          <Button size="sm" variant="ghost" className="h-6 text-xs"
            onClick={() => { setFilterSev('all'); setFilterCat('all'); setSearch(''); }}>
            Limpar filtros
          </Button>
        </div>
      ) : null}

      {/* Insights list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {insights && insights.length === 0
                ? 'Nenhum insight disponível para este ano. A operação parece estável.'
                : 'Nenhum insight corresponde aos filtros aplicados.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(insight => <InsightCard key={insight.id} insight={insight} />)}
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const cfg = severityConfig[insight.severity];
  const Icon = cfg.icon;
  return (
    <div className={`border rounded-xl p-4 ${cfg.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-semibold text-sm">{insight.title}</h4>
            <Badge variant="outline" className="text-[10px] py-0 h-5">
              {categoryLabels[insight.category]}
            </Badge>
            {insight.metric && (
              <Badge variant="secondary" className="text-[10px] py-0 h-5">{insight.metric}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{insight.description}</p>
        </div>
      </div>
    </div>
  );
}
