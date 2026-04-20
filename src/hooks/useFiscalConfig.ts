import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// =============================================
// FISCAL CONFIG
// =============================================

export interface FiscalConfig {
  id: string;
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useFiscalConfig() {
  return useQuery({
    queryKey: ['fiscal-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiscal_config')
        .select('*');
      if (error) throw error;
      return data as FiscalConfig[];
    },
  });
}

export function useFiscalConfigValue(key: string) {
  const { data } = useFiscalConfig();
  const config = data?.find(c => c.key === key);
  return config?.value;
}

export function useNFPercentual() {
  const value = useFiscalConfigValue('nf_percentual_padrao');
  return parseFloat(value || '0.09');
}

export function useNFEditavel() {
  const value = useFiscalConfigValue('nf_permitir_edicao_manual');
  return value !== 'false';
}

export function useUpdateFiscalConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data: existing } = await supabase
        .from('fiscal_config')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('fiscal_config')
          .update({ value })
          .eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fiscal_config')
          .insert({ key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-config'] });
      toast.success('Configuração fiscal atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar configuração: ' + error.message);
    },
  });
}

// =============================================
// FISCAL INDICATORS (computed from transactions)
// =============================================

export type OrigemReceita = 'SERVICO' | 'VENDA' | 'REEMBOLSO' | 'AJUSTE_FINANCEIRO' | 'OUTRO';
export type DocumentoRecebimento = 'NOTA_FISCAL' | 'RECIBO' | 'NOTA_DE_DEBITO';

export function useFiscalIndicators(month?: number, year?: number) {
  return useQuery({
    queryKey: ['fiscal-indicators', month, year],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('id, tipo_movimento, natureza, valor, valor_pago, documento_recebimento, origem_receita, valor_imposto_nf, valor_liquido_nf, nf_percentual_aplicado, cliente_id, status')
        .eq('tipo_movimento', 'ENTRADA');

      if (month) query = query.eq('competencia_mes', month);
      if (year) query = query.eq('competencia_ano', year);

      const { data, error } = await query;
      if (error) throw error;

      const entries = data || [];
      const total = entries.length;

      // Fiscal indicators
      const withNF = entries.filter(e => e.documento_recebimento === 'NOTA_FISCAL');
      const withoutNF = entries.filter(e => e.documento_recebimento && e.documento_recebimento !== 'NOTA_FISCAL');
      const recorrentes = entries.filter(e => e.natureza === 'RECORRENTE');
      const avulsos = entries.filter(e => e.natureza === 'AVULSA');

      const pctReceitasComNF = total > 0 ? (withNF.length / total) * 100 : 0;
      const pctReceitasSemNF = total > 0 ? ((total - withNF.length) / total) * 100 : 0;
      const pctRecorrentesSemNF = recorrentes.length > 0
        ? (recorrentes.filter(r => r.documento_recebimento !== 'NOTA_FISCAL').length / recorrentes.length) * 100 : 0;
      const pctAvulsosComNF = avulsos.length > 0
        ? (avulsos.filter(a => a.documento_recebimento === 'NOTA_FISCAL').length / avulsos.length) * 100 : 0;
      const totalNFsEmitidas = withNF.length;

      // Tax indicators
      const totalImpostosNF = withNF.reduce((sum, e) => sum + (Number(e.valor_imposto_nf) || 0), 0);

      // Group by client
      const impostoPorCliente: Record<string, number> = {};
      withNF.forEach(e => {
        if (e.cliente_id) {
          impostoPorCliente[e.cliente_id] = (impostoPorCliente[e.cliente_id] || 0) + (Number(e.valor_imposto_nf) || 0);
        }
      });

      // Payment method distribution
      const valorPorFormaPagamento: Record<string, number> = {};
      entries.forEach(e => {
        const key = e.forma_pagamento_id || 'sem_forma';
        valorPorFormaPagamento[key] = (valorPorFormaPagamento[key] || 0) + Number(e.valor);
      });

      // Value-based formalization
      const totalValorEntradas = entries.reduce((sum, e) => sum + Number(e.valor), 0);
      const totalValorComNF = withNF.reduce((sum, e) => sum + Number(e.valor), 0);
      const pctReceitasFormalizadas = totalValorEntradas > 0
        ? (totalValorComNF / totalValorEntradas) * 100 : 0;

      return {
        // Fiscal
        pctReceitasComNF,
        pctReceitasSemNF,
        pctRecorrentesSemNF,
        pctAvulsosComNF,
        totalNFsEmitidas,
        // Tax
        totalImpostosNF,
        impostoPorCliente,
        // Financial
        valorPorFormaPagamento,
        totalValorEntradas,
        // Strategic
        pctReceitasFormalizadas,
        // Counts
        totalEntradas: total,
        totalComNF: withNF.length,
        totalRecorrentes: recorrentes.length,
        totalAvulsos: avulsos.length,
      };
    },
  });
}

// =============================================
// MINIMUM WAGE - JANUARY RULE
// =============================================

/**
 * Returns the effective minimum wage for a given month/year
 * Rule: January uses previous year's value, February onwards uses current year
 */
export function useEffectiveMinimumWage(month: number, year: number) {
  const effectiveYear = month === 1 ? year - 1 : year;

  return useQuery({
    queryKey: ['effective-minimum-wage', effectiveYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('minimum_wage_config')
        .select('value')
        .eq('year', effectiveYear)
        .maybeSingle();

      if (error) throw error;
      return data?.value || 1518;
    },
  });
}
