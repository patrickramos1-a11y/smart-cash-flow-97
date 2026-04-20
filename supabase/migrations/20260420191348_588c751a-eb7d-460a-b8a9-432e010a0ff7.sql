-- Create rejected_transactions audit table
CREATE TABLE public.rejected_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_transaction_id UUID NOT NULL,
  tipo_movimento transaction_tipo_movimento NOT NULL,
  natureza transaction_natureza NOT NULL,
  origem transaction_origem NOT NULL,
  descricao TEXT,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  competencia_mes INTEGER NOT NULL,
  competencia_ano INTEGER NOT NULL,
  cliente_id UUID,
  entity_id UUID,
  account_id UUID,
  transaction_category_id UUID,
  cost_center_id UUID,
  responsavel_id UUID,
  fixed_expense_id UUID,
  installment_id UUID,
  contrato_id UUID,
  documento_tipo documento_tipo,
  documento_numero TEXT,
  notes TEXT,
  rejection_reason TEXT NOT NULL,
  rejected_by UUID,
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  original_created_at TIMESTAMPTZ,
  full_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rejected_tx_rejected_at ON public.rejected_transactions(rejected_at DESC);
CREATE INDEX idx_rejected_tx_original_id ON public.rejected_transactions(original_transaction_id);

ALTER TABLE public.rejected_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read rejected_transactions" ON public.rejected_transactions FOR SELECT USING (true);
CREATE POLICY "Public insert rejected_transactions" ON public.rejected_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete rejected_transactions" ON public.rejected_transactions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RPC: archive_and_delete_rejected
-- Copies the transaction (and its lookups) into rejected_transactions, then deletes from transactions.
CREATE OR REPLACE FUNCTION public.archive_and_delete_rejected(
  p_ids UUID[],
  p_reason TEXT,
  p_rejected_by UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Insert snapshot rows
  INSERT INTO public.rejected_transactions (
    original_transaction_id, tipo_movimento, natureza, origem, descricao,
    valor, data_vencimento, competencia_mes, competencia_ano,
    cliente_id, entity_id, account_id, transaction_category_id, cost_center_id,
    responsavel_id, fixed_expense_id, installment_id, contrato_id,
    documento_tipo, documento_numero, notes,
    rejection_reason, rejected_by, created_by, original_created_at, full_payload
  )
  SELECT
    t.id, t.tipo_movimento, t.natureza, t.origem, t.descricao,
    t.valor, t.data_vencimento, t.competencia_mes, t.competencia_ano,
    t.cliente_id, t.entity_id, t.account_id, t.transaction_category_id, t.cost_center_id,
    t.responsavel_id, t.fixed_expense_id, t.installment_id, t.contrato_id,
    t.documento_tipo, t.documento_numero, t.notes,
    p_reason, p_rejected_by, t.created_by, t.created_at, to_jsonb(t)
  FROM public.transactions t
  WHERE t.id = ANY(p_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Delete the original transactions (account balance trigger will recalc)
  DELETE FROM public.transactions WHERE id = ANY(p_ids);

  RETURN v_count;
END;
$$;