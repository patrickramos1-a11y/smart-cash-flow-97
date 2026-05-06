
-- 1) Recurring contracts trigger: stop concatenating month/year into descricao.
-- Use client name as the base description (competência already lives in competencia_mes/ano).
CREATE OR REPLACE FUNCTION public.sync_installment_to_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_client_name TEXT;
  v_transaction_id UUID;
BEGIN
  SELECT rc.client_id, rcl.name
  INTO v_client_id, v_client_name
  FROM public.recurring_contracts rc
  LEFT JOIN public.recurring_clients rcl ON rcl.id = rc.client_id
  WHERE rc.id = NEW.contract_id;

  SELECT id INTO v_transaction_id
  FROM public.transactions
  WHERE installment_id = NEW.id;

  IF v_transaction_id IS NULL THEN
    INSERT INTO public.transactions (
      tipo_movimento, natureza, origem, cliente_id, contrato_id, installment_id,
      competencia_mes, competencia_ano, valor, valor_pago,
      data_vencimento, data_pagamento, status, descricao
    ) VALUES (
      'ENTRADA', 'RECORRENTE', 'CONTRATO_RECORRENTE',
      v_client_id, NEW.contract_id, NEW.id,
      NEW.competence_month, NEW.competence_year,
      NEW.expected_value, NEW.paid_value,
      NEW.due_date, NEW.payment_date,
      CASE
        WHEN NEW.status = 'PAGO' THEN 'PAGO'::transaction_status
        WHEN NEW.status = 'ATRASADO' THEN 'ATRASADO'::transaction_status
        ELSE 'EM_ABERTO'::transaction_status
      END,
      COALESCE(v_client_name, 'Contrato Recorrente')
    )
    RETURNING id INTO v_transaction_id;

    INSERT INTO public.transaction_history (transaction_id, evento, modulo_origem, user_id)
    VALUES (v_transaction_id, 'CRIADO', 'CONTRATOS_RECORRENTES', 'system');
  ELSE
    UPDATE public.transactions SET
      valor = NEW.expected_value,
      valor_pago = NEW.paid_value,
      data_vencimento = NEW.due_date,
      data_pagamento = NEW.payment_date,
      status = CASE
        WHEN NEW.status = 'PAGO' THEN 'PAGO'::transaction_status
        WHEN NEW.status = 'ATRASADO' THEN 'ATRASADO'::transaction_status
        ELSE 'EM_ABERTO'::transaction_status
      END,
      updated_at = now()
    WHERE id = v_transaction_id;

    IF NEW.status = 'PAGO' AND OLD.status != 'PAGO' THEN
      INSERT INTO public.transaction_history (transaction_id, evento, modulo_origem, user_id, dados_anteriores)
      VALUES (v_transaction_id, 'MARCADO_PAGO', 'CONTRATOS_RECORRENTES', 'system',
        jsonb_build_object('status_anterior', OLD.status, 'valor_anterior', OLD.paid_value));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2) Backfill: strip " - MM/YYYY" suffix and "Contrato Recorrente - <Mes>/YYYY" pattern from existing descriptions
-- Recurring: replace "Contrato Recorrente - <anything>" with client name
UPDATE public.transactions t
SET descricao = COALESCE(rcl.name, 'Contrato Recorrente')
FROM public.recurring_contracts rc
LEFT JOIN public.recurring_clients rcl ON rcl.id = rc.client_id
WHERE t.contrato_id = rc.id
  AND t.origem = 'CONTRATO_RECORRENTE'
  AND t.descricao ~ '^Contrato Recorrente - ';

-- Fixed expenses & others: strip trailing " - MM/YYYY"
UPDATE public.transactions
SET descricao = regexp_replace(descricao, '\s*-\s*\d{2}/\d{4}\s*$', '')
WHERE descricao ~ '\s*-\s*\d{2}/\d{4}\s*$';
