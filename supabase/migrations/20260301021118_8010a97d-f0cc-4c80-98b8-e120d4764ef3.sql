
-- Phase 1: Add new fields to transactions table
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS origem_receita text,
  ADD COLUMN IF NOT EXISTS documento_recebimento text,
  ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES public.financial_entities(id),
  ADD COLUMN IF NOT EXISTS nf_percentual_aplicado numeric,
  ADD COLUMN IF NOT EXISTS valor_imposto_nf numeric,
  ADD COLUMN IF NOT EXISTS valor_liquido_nf numeric;

-- Phase 2: Create fiscal_config table
CREATE TABLE IF NOT EXISTS public.fiscal_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.fiscal_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for fiscal_config" ON public.fiscal_config FOR SELECT USING (true);
CREATE POLICY "Public insert access for fiscal_config" ON public.fiscal_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for fiscal_config" ON public.fiscal_config FOR UPDATE USING (true);

-- Insert default fiscal config values
INSERT INTO public.fiscal_config (key, value, description) VALUES
  ('nf_percentual_padrao', '0.09', 'Percentual padrão de imposto para Nota Fiscal (9%)'),
  ('nf_permitir_edicao_manual', 'true', 'Permitir edição manual do percentual de NF por lançamento')
ON CONFLICT (key) DO NOTHING;

-- Phase 6: Add exigir_emissao_nf to recurring_contracts
ALTER TABLE public.recurring_contracts
  ADD COLUMN IF NOT EXISTS exigir_emissao_nf text NOT NULL DEFAULT 'PERGUNTAR';

-- Create enum types for new fields
COMMENT ON COLUMN public.transactions.origem_receita IS 'SERVICO, VENDA, REEMBOLSO, AJUSTE_FINANCEIRO, OUTRO';
COMMENT ON COLUMN public.transactions.documento_recebimento IS 'NOTA_FISCAL, RECIBO, NOTA_DE_DEBITO';
COMMENT ON COLUMN public.recurring_contracts.exigir_emissao_nf IS 'SEMPRE, NUNCA, PERGUNTAR';
