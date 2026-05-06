import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches all rows from a Supabase query bypassing the default 1000-row cap
 * by paginating with .range(). Apply filters via the `build` callback.
 */
export async function fetchAllPaginated<T = any>(
  build: (q: any) => any,
  pageSize = 1000,
): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  // safety cap to avoid infinite loops
  for (let i = 0; i < 50; i++) {
    const q = build(supabase.from('transactions') as any).range(from, from + pageSize - 1);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...(data as T[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

export interface MonthAgg {
  month: number;
  realEntries: number;
  realExpenses: number;
  expectedEntries: number;
  expectedExpenses: number;
}

export function aggregateByMonth(rows: Array<{
  tipo_movimento: string;
  status: string;
  valor: number | string;
  valor_pago: number | string | null;
  competencia_mes: number;
}>): MonthAgg[] {
  const months: MonthAgg[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    realEntries: 0,
    realExpenses: 0,
    expectedEntries: 0,
    expectedExpenses: 0,
  }));
  for (const t of rows) {
    const m = months[t.competencia_mes - 1];
    if (!m) continue;
    const valor = Number(t.valor) || 0;
    const pago = Number(t.valor_pago ?? 0) || valor;
    if (t.tipo_movimento === 'ENTRADA') {
      m.expectedEntries += valor;
      if (t.status === 'PAGO') m.realEntries += pago;
    } else if (t.tipo_movimento === 'SAIDA') {
      m.expectedExpenses += valor;
      if (t.status === 'PAGO') m.realExpenses += pago;
    }
  }
  return months;
}
