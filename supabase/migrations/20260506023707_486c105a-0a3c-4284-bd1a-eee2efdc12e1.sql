
CREATE OR REPLACE FUNCTION public.bulk_quitar_periodo(p_year_from int, p_month_from int, p_year_to int, p_month_to int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  -- Desativa triggers de sincronização para evitar recursão
  SET LOCAL session_replication_role = 'replica';

  -- 1) Quita parcelas de contratos recorrentes
  UPDATE public.recurring_installments
  SET status = 'PAGO',
      paid_value = COALESCE(paid_value, expected_value),
      payment_date = COALESCE(payment_date, due_date),
      updated_at = now()
  WHERE status != 'PAGO'
    AND ((competence_year > p_year_from) OR (competence_year = p_year_from AND competence_month >= p_month_from))
    AND ((competence_year < p_year_to)   OR (competence_year = p_year_to   AND competence_month <= p_month_to));

  -- 2) Garante entity_id em pendências sem entidade
  UPDATE public.transactions
  SET entity_id = 'c3262ee5-7f0c-498e-84e5-bca1368b6591'
  WHERE entity_id IS NULL
    AND status IN ('ATRASADO','EM_ABERTO')
    AND ((competencia_ano > p_year_from) OR (competencia_ano = p_year_from AND competencia_mes >= p_month_from))
    AND ((competencia_ano < p_year_to)   OR (competencia_ano = p_year_to   AND competencia_mes <= p_month_to));

  -- 3) Quita todas as transações do período
  UPDATE public.transactions
  SET status = 'PAGO',
      valor_pago = COALESCE(valor_pago, valor),
      data_pagamento = COALESCE(data_pagamento, data_vencimento),
      approval_status = 'aprovado',
      updated_at = now()
  WHERE status IN ('ATRASADO','EM_ABERTO')
    AND ((competencia_ano > p_year_from) OR (competencia_ano = p_year_from AND competencia_mes >= p_month_from))
    AND ((competencia_ano < p_year_to)   OR (competencia_ano = p_year_to   AND competencia_mes <= p_month_to));
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- 4) Recalcula saldo de todas as contas afetadas
  PERFORM public.recalculate_account_balance(id) FROM public.accounts WHERE active = true;

  RETURN v_count;
END;
$$;
