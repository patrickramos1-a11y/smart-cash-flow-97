-- ============= BLOCO 3: Trigger de bloqueio + FKs faltantes =============
-- 1) Atualiza enforce_transaction_required_fields para BLOQUEAR (não só warning)
--    Considera-se "manual" qualquer transação cuja origem seja LANCAMENTO_MANUAL ou IMPORTACAO.
--    Para origens automatizadas (CONTRATO_RECORRENTE, DESPESA_FIXA) mantém warning, pois
--    despesas/contratos órfãos antigos podem regenerar parcelas durante reprocessamento.

CREATE OR REPLACE FUNCTION public.enforce_transaction_required_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_manual BOOLEAN;
BEGIN
  v_is_manual := NEW.origem IN ('LANCAMENTO_MANUAL', 'IMPORTACAO');

  IF v_is_manual THEN
    IF NEW.account_id IS NULL THEN
      RAISE EXCEPTION 'Lançamento manual requer Conta (account_id).';
    END IF;
    IF NEW.transaction_category_id IS NULL THEN
      RAISE EXCEPTION 'Lançamento manual requer Categoria (transaction_category_id).';
    END IF;
    IF NEW.entity_id IS NULL THEN
      RAISE EXCEPTION 'Lançamento manual requer Entidade/Responsável (entity_id).';
    END IF;
  ELSE
    -- Origem automática: warnings apenas (parcelas geradas precisam fluir)
    IF NEW.account_id IS NULL THEN
      RAISE WARNING 'Transação automática sem account_id (origem=%).', NEW.origem;
    END IF;
    IF NEW.transaction_category_id IS NULL THEN
      RAISE WARNING 'Transação automática sem transaction_category_id (origem=%).', NEW.origem;
    END IF;
    IF NEW.entity_id IS NULL THEN
      RAISE WARNING 'Transação automática sem entity_id (origem=%).', NEW.origem;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Garantir que o trigger esteja ligado em INSERT/UPDATE
DROP TRIGGER IF EXISTS trg_enforce_transaction_required_fields ON public.transactions;
CREATE TRIGGER trg_enforce_transaction_required_fields
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_transaction_required_fields();

-- 3) Foreign keys faltantes em fixed_expenses (necessárias para os JOINs nomeados do PostgREST)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fixed_expenses_transaction_category_id_fkey'
  ) THEN
    ALTER TABLE public.fixed_expenses
      ADD CONSTRAINT fixed_expenses_transaction_category_id_fkey
      FOREIGN KEY (transaction_category_id) REFERENCES public.transaction_categories(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fixed_expenses_account_id_fkey'
  ) THEN
    ALTER TABLE public.fixed_expenses
      ADD CONSTRAINT fixed_expenses_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fixed_expenses_cost_center_id_fkey'
  ) THEN
    ALTER TABLE public.fixed_expenses
      ADD CONSTRAINT fixed_expenses_cost_center_id_fkey
      FOREIGN KEY (cost_center_id) REFERENCES public.cost_centers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fixed_expenses_payment_method_id_fkey'
  ) THEN
    ALTER TABLE public.fixed_expenses
      ADD CONSTRAINT fixed_expenses_payment_method_id_fkey
      FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fixed_expenses_cliente_id_fkey'
  ) THEN
    ALTER TABLE public.fixed_expenses
      ADD CONSTRAINT fixed_expenses_cliente_id_fkey
      FOREIGN KEY (cliente_id) REFERENCES public.recurring_clients(id) ON DELETE SET NULL;
  END IF;
END $$;