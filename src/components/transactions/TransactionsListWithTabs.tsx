import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, Table2 } from 'lucide-react';
import { TransactionsList } from './TransactionsList';
import type { TransactionFilters } from '@/hooks/useTransactions';
import type { BulkContext } from './BulkEditPanel';

interface Props {
  /** Filtros base (devem incluir competencia_ano e competencia_mes para a aba mensal). */
  filters: TransactionFilters;
  bulkContext?: BulkContext;
  /** Rótulo customizado da aba mensal. Padrão: "Mês". */
  monthlyLabel?: string;
  /** Rótulo customizado da aba anual. Padrão: "Planilha Anual". */
  annualLabel?: string;
}

/**
 * Wrapper que adiciona uma aba interna "Planilha Anual" à listagem de transações.
 * Útil para auditar inconsistências em todo o ano sem precisar navegar mês a mês.
 *
 * - Aba "Mês": usa os filtros completos (mês + ano).
 * - Aba "Planilha Anual": remove `competencia_mes`, mostra todas as transações do ano
 *   com os mesmos filtros (tipo_movimento, natureza, origem, etc.), permitindo
 *   bulk edit, ordenação e filtros por coluna.
 */
export function TransactionsListWithTabs({
  filters,
  bulkContext = 'GERAL',
  monthlyLabel = 'Mês',
  annualLabel = 'Planilha Anual',
}: Props) {
  const [tab, setTab] = useState<'mes' | 'ano'>('mes');

  // Para a planilha anual, removemos o filtro de mês.
  const annualFilters: TransactionFilters = { ...filters };
  delete annualFilters.competencia_mes;

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as 'mes' | 'ano')} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
        <TabsTrigger value="mes" className="gap-2">
          <Calendar className="w-4 h-4" />
          {monthlyLabel}
        </TabsTrigger>
        <TabsTrigger value="ano" className="gap-2">
          <Table2 className="w-4 h-4" />
          {annualLabel}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="mes" className="mt-0">
        <TransactionsList filters={filters} bulkContext={bulkContext} />
      </TabsContent>

      <TabsContent value="ano" className="mt-0">
        <div className="mb-3 px-3 py-2 rounded-lg bg-info/10 border border-info/20 text-xs text-info">
          📊 Visualizando <strong>todas as transações de {filters.competencia_ano}</strong> para auditoria.
          Use os filtros nas colunas (ícone <span className="inline-block">⏷</span>) e a edição em massa para corrigir inconsistências.
        </div>
        <TransactionsList filters={annualFilters} bulkContext={bulkContext} />
      </TabsContent>
    </Tabs>
  );
}
