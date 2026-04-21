-- ============================================================
-- BLOCO 1 (corrigido) — Refatoração estrutural do banco
-- ============================================================

-- ============================================================
-- PARTE 1 — Reescrever a função/trigger de saldo PRIMEIRO
-- (a antiga ainda referencia NEW.conta_id que já foi dropada)
-- ============================================================

CREATE OR REPLACE FUNCTION public.recalculate_account_balance(p_account_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_initial NUMERIC;
  v_tx_balance NUMERIC;
  v_transfer_in NUMERIC;
  v_transfer_out NUMERIC;
BEGIN
  SELECT initial_balance INTO v_initial
  FROM public.accounts WHERE id = p_account_id;

  SELECT COALESCE(SUM(
    CASE
      WHEN tipo_movimento = 'ENTRADA' THEN COALESCE(valor_pago, valor)
      WHEN tipo_movimento = 'SAIDA' THEN -COALESCE(valor_pago, valor)
      ELSE 0
    END
  ), 0) INTO v_tx_balance
  FROM public.transactions
  WHERE status = 'PAGO'
    AND account_id = p_account_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_transfer_in
  FROM public.account_transfers
  WHERE to_account_id = p_account_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_transfer_out
  FROM public.account_transfers
  WHERE from_account_id = p_account_id;

  UPDATE public.accounts
  SET current_balance = COALESCE(v_initial, 0) + v_tx_balance + v_transfer_in - v_transfer_out,
      updated_at = now()
  WHERE id = p_account_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recalculate_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.account_id IS NOT NULL THEN
      PERFORM recalculate_account_balance(OLD.account_id);
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF TG_OP = 'UPDATE' AND OLD.account_id IS DISTINCT FROM NEW.account_id AND OLD.account_id IS NOT NULL THEN
      PERFORM recalculate_account_balance(OLD.account_id);
    END IF;
    IF NEW.account_id IS NOT NULL THEN
      PERFORM recalculate_account_balance(NEW.account_id);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Remover triggers duplicadas e recriar uma única canônica
DROP TRIGGER IF EXISTS trg_recalc_balance_on_transaction ON public.transactions;
DROP TRIGGER IF EXISTS trg_transactions_account_balance ON public.transactions;
DROP TRIGGER IF EXISTS trg_recalc_balance_on_transfer ON public.account_transfers;
DROP TRIGGER IF EXISTS trg_transfers_account_balance ON public.account_transfers;

CREATE TRIGGER trg_transactions_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_account_balance();

CREATE TRIGGER trg_transfers_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.account_transfers
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_transfer_balance();

-- ============================================================
-- PARTE 2 — Criar placeholders "A REVISAR" para órfãos
-- ============================================================

DO $$
DECLARE
  v_revisar_account_id uuid;
  v_revisar_cost_center_id uuid;
  v_revisar_category_in_id uuid;
  v_revisar_category_out_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE name = '⚠️ A REVISAR') THEN
    INSERT INTO public.accounts (name, bank, initial_balance, current_balance, active)
    VALUES ('⚠️ A REVISAR', 'Sem banco definido', 0, 0, true);
  END IF;
  SELECT id INTO v_revisar_account_id FROM public.accounts WHERE name = '⚠️ A REVISAR' LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM public.cost_centers WHERE name = '⚠️ A REVISAR') THEN
    INSERT INTO public.cost_centers (name, code, dre_group, dre_label, dre_order, is_expense, active)
    VALUES ('⚠️ A REVISAR', 'REVISAR', 'OUTROS', '⚠️ A Revisar', 999, true, true);
  END IF;
  SELECT id INTO v_revisar_cost_center_id FROM public.cost_centers WHERE name = '⚠️ A REVISAR' LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM public.transaction_categories WHERE name = '⚠️ A REVISAR (Entrada)') THEN
    INSERT INTO public.transaction_categories (name, type, cost_center_id, active)
    VALUES ('⚠️ A REVISAR (Entrada)', 'ENTRADA', v_revisar_cost_center_id, true);
  END IF;
  SELECT id INTO v_revisar_category_in_id FROM public.transaction_categories
  WHERE name = '⚠️ A REVISAR (Entrada)' LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM public.transaction_categories WHERE name = '⚠️ A REVISAR (Saída)') THEN
    INSERT INTO public.transaction_categories (name, type, cost_center_id, active)
    VALUES ('⚠️ A REVISAR (Saída)', 'SAIDA', v_revisar_cost_center_id, true);
  END IF;
  SELECT id INTO v_revisar_category_out_id FROM public.transaction_categories
  WHERE name = '⚠️ A REVISAR (Saída)' LIMIT 1;

  -- Atribuir aos órfãos em transactions
  UPDATE public.transactions
  SET account_id = v_revisar_account_id
  WHERE account_id IS NULL;

  UPDATE public.transactions
  SET transaction_category_id = v_revisar_category_in_id
  WHERE transaction_category_id IS NULL AND tipo_movimento = 'ENTRADA';

  UPDATE public.transactions
  SET transaction_category_id = v_revisar_category_out_id
  WHERE transaction_category_id IS NULL AND tipo_movimento = 'SAIDA';

  UPDATE public.transactions
  SET cost_center_id = v_revisar_cost_center_id
  WHERE cost_center_id IS NULL;
END $$;

-- ============================================================
-- PARTE 3 — Unificar fixed_expenses (Fase 2B)
-- ============================================================

ALTER TABLE public.fixed_expenses
  ADD COLUMN IF NOT EXISTS account_id uuid,
  ADD COLUMN IF NOT EXISTS transaction_category_id uuid,
  ADD COLUMN IF NOT EXISTS cost_center_id uuid,
  ADD COLUMN IF NOT EXISTS payment_method_id uuid;

UPDATE public.fixed_expenses
SET account_id = conta_id::uuid
WHERE conta_id IS NOT NULL
  AND conta_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND account_id IS NULL
  AND EXISTS (SELECT 1 FROM public.accounts WHERE id = fixed_expenses.conta_id::uuid);

UPDATE public.fixed_expenses
SET transaction_category_id = categoria_id::uuid
WHERE categoria_id IS NOT NULL
  AND categoria_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND transaction_category_id IS NULL
  AND EXISTS (SELECT 1 FROM public.transaction_categories WHERE id = fixed_expenses.categoria_id::uuid);

UPDATE public.fixed_expenses
SET cost_center_id = centro_custo_id::uuid
WHERE centro_custo_id IS NOT NULL
  AND centro_custo_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND cost_center_id IS NULL
  AND EXISTS (SELECT 1 FROM public.cost_centers WHERE id = fixed_expenses.centro_custo_id::uuid);

UPDATE public.fixed_expenses
SET payment_method_id = forma_pagamento_id::uuid
WHERE forma_pagamento_id IS NOT NULL
  AND forma_pagamento_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND payment_method_id IS NULL
  AND EXISTS (SELECT 1 FROM public.payment_methods WHERE id = fixed_expenses.forma_pagamento_id::uuid);

UPDATE public.fixed_expenses
SET account_id = (SELECT id FROM public.accounts WHERE name = '⚠️ A REVISAR' LIMIT 1)
WHERE account_id IS NULL;

UPDATE public.fixed_expenses
SET transaction_category_id = (SELECT id FROM public.transaction_categories WHERE name = '⚠️ A REVISAR (Saída)' LIMIT 1)
WHERE transaction_category_id IS NULL;

UPDATE public.fixed_expenses
SET cost_center_id = (SELECT id FROM public.cost_centers WHERE name = '⚠️ A REVISAR' LIMIT 1)
WHERE cost_center_id IS NULL;

ALTER TABLE public.fixed_expenses DROP COLUMN IF EXISTS conta_id;
ALTER TABLE public.fixed_expenses DROP COLUMN IF EXISTS categoria_id;
ALTER TABLE public.fixed_expenses DROP COLUMN IF EXISTS centro_custo_id;
ALTER TABLE public.fixed_expenses DROP COLUMN IF EXISTS forma_pagamento_id;

ALTER TABLE public.fixed_expenses
  DROP CONSTRAINT IF EXISTS fixed_expenses_account_id_fkey,
  DROP CONSTRAINT IF EXISTS fixed_expenses_transaction_category_id_fkey,
  DROP CONSTRAINT IF EXISTS fixed_expenses_cost_center_id_fkey,
  DROP CONSTRAINT IF EXISTS fixed_expenses_payment_method_id_fkey;

ALTER TABLE public.fixed_expenses
  ADD CONSTRAINT fixed_expenses_account_id_fkey
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL,
  ADD CONSTRAINT fixed_expenses_transaction_category_id_fkey
    FOREIGN KEY (transaction_category_id) REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  ADD CONSTRAINT fixed_expenses_cost_center_id_fkey
    FOREIGN KEY (cost_center_id) REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  ADD CONSTRAINT fixed_expenses_payment_method_id_fkey
    FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_account_id ON public.fixed_expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_category_id ON public.fixed_expenses(transaction_category_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_cost_center_id ON public.fixed_expenses(cost_center_id);

-- ============================================================
-- PARTE 4 — Trigger de validação obrigatória (modo WARNING)
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_transaction_required_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.account_id IS NULL THEN
    RAISE WARNING 'Transação salva sem account_id. No Bloco 3 isso será bloqueado.';
  END IF;
  IF NEW.transaction_category_id IS NULL THEN
    RAISE WARNING 'Transação salva sem transaction_category_id. No Bloco 3 isso será bloqueado.';
  END IF;
  IF NEW.entity_id IS NULL THEN
    RAISE WARNING 'Transação salva sem entity_id. No Bloco 3 isso será bloqueado.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_transaction_required ON public.transactions;
CREATE TRIGGER trg_enforce_transaction_required
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_transaction_required_fields();

-- ============================================================
-- PARTE 5 — Reprocessamento de dados (Fase 4)
-- ============================================================

-- Recalcular status de TODAS as transações
UPDATE public.transactions
SET status = CASE
  WHEN data_pagamento IS NOT NULL THEN 'PAGO'::transaction_status
  WHEN data_vencimento < CURRENT_DATE THEN 'ATRASADO'::transaction_status
  ELSE 'EM_ABERTO'::transaction_status
END
WHERE status IS DISTINCT FROM (CASE
  WHEN data_pagamento IS NOT NULL THEN 'PAGO'::transaction_status
  WHEN data_vencimento < CURRENT_DATE THEN 'ATRASADO'::transaction_status
  ELSE 'EM_ABERTO'::transaction_status
END);

-- Recalcular saldo de TODAS as contas
DO $$
DECLARE
  v_account RECORD;
BEGIN
  FOR v_account IN SELECT id FROM public.accounts WHERE active = true LOOP
    PERFORM public.recalculate_account_balance(v_account.id);
  END LOOP;
END $$;