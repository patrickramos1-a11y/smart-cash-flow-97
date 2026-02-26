
-- ============================================
-- FIX: Remove duplicate triggers causing stack depth exceeded
-- The original migration already created sync_installment_changes and sync_transaction_changes
-- The newer migration duplicated them as trg_sync_installment_to_transaction and trg_sync_transaction_to_installment
-- ============================================

DROP TRIGGER IF EXISTS trg_sync_installment_to_transaction ON public.recurring_installments;
DROP TRIGGER IF EXISTS trg_sync_transaction_to_installment ON public.transactions;

-- ============================================
-- FIX: Add recursion guards to sync functions
-- Prevents infinite loop between installment and transaction triggers
-- ============================================

CREATE OR REPLACE FUNCTION public.sync_installment_to_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_transaction_id UUID;
  v_category_id UUID;
  v_account_id UUID;
  v_cost_center_id UUID;
  v_client_name TEXT;
BEGIN
  -- Recursion guard: if called from sync_transaction_to_installment, skip
  IF current_setting('app.syncing_from_transaction', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Set flag to prevent reverse trigger from firing back
  PERFORM set_config('app.syncing_from_installment', 'true', true);

  -- Get client_id and name from contract
  SELECT rc.client_id INTO v_client_id
  FROM public.recurring_contracts rc
  WHERE rc.id = NEW.contract_id;

  SELECT name INTO v_client_name
  FROM public.recurring_clients
  WHERE id = v_client_id;

  -- Try to get category/account from transaction_categories for ENTRADA + RECORRENTE
  SELECT id, default_account_id, cost_center_id 
  INTO v_category_id, v_account_id, v_cost_center_id
  FROM public.transaction_categories
  WHERE type = 'ENTRADA' AND subtype = 'RECORRENTE' AND active = true
  LIMIT 1;

  -- Check if transaction already exists for this installment
  SELECT id INTO v_transaction_id
  FROM public.transactions
  WHERE installment_id = NEW.id;

  IF v_transaction_id IS NULL THEN
    INSERT INTO public.transactions (
      tipo_movimento, natureza, origem, cliente_id, contrato_id, installment_id,
      competencia_mes, competencia_ano, valor, valor_pago, data_vencimento, data_pagamento,
      status, descricao, transaction_category_id, account_id, cost_center_id
    ) VALUES (
      'ENTRADA', 'RECORRENTE', 'CONTRATO_RECORRENTE', v_client_id, NEW.contract_id, NEW.id,
      NEW.competence_month, NEW.competence_year, NEW.expected_value, NEW.paid_value,
      NEW.due_date, NEW.payment_date,
      CASE 
        WHEN NEW.status = 'PAGO' THEN 'PAGO'::transaction_status
        WHEN NEW.status = 'ATRASADO' THEN 'ATRASADO'::transaction_status
        ELSE 'EM_ABERTO'::transaction_status
      END,
      COALESCE(v_client_name, 'Contrato') || ' - ' || to_char(to_date(NEW.competence_month::text, 'MM'), 'TMMonth') || '/' || NEW.competence_year,
      v_category_id, v_account_id, v_cost_center_id
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

    IF NEW.status = 'PAGO' AND (TG_OP = 'INSERT' OR OLD.status != 'PAGO') THEN
      INSERT INTO public.transaction_history (transaction_id, evento, modulo_origem, user_id, dados_anteriores)
      VALUES (v_transaction_id, 'MARCADO_PAGO', 'CONTRATOS_RECORRENTES', 'system', 
        jsonb_build_object('status_anterior', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE 'NOVO' END));
    END IF;
  END IF;

  -- Reset flag
  PERFORM set_config('app.syncing_from_installment', 'false', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_transaction_to_installment()
RETURNS TRIGGER AS $$
BEGIN
  -- Recursion guard: if called from sync_installment_to_transaction, skip
  IF current_setting('app.syncing_from_installment', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Only sync if this transaction is linked to an installment
  IF NEW.installment_id IS NOT NULL AND NEW.origem = 'CONTRATO_RECORRENTE' THEN
    -- Set flag to prevent reverse trigger
    PERFORM set_config('app.syncing_from_transaction', 'true', true);

    UPDATE public.recurring_installments SET
      paid_value = NEW.valor_pago,
      payment_date = NEW.data_pagamento,
      status = CASE 
        WHEN NEW.status = 'PAGO' THEN 'PAGO'
        WHEN NEW.status = 'ATRASADO' THEN 'ATRASADO'
        ELSE 'EM_ABERTO'
      END,
      updated_at = now()
    WHERE id = NEW.installment_id;

    IF NEW.status = 'PAGO' AND (OLD.status IS NULL OR OLD.status != 'PAGO') THEN
      INSERT INTO public.transaction_history (transaction_id, evento, modulo_origem, user_id, dados_anteriores)
      VALUES (NEW.id, 'MARCADO_PAGO', 'TRANSACOES', 'system',
        jsonb_build_object('status_anterior', OLD.status, 'valor_anterior', OLD.valor_pago));
    END IF;

    -- Reset flag
    PERFORM set_config('app.syncing_from_transaction', 'false', true);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
