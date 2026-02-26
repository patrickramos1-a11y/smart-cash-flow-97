
-- ============================================
-- 1. CREATE TRIGGERS FOR INSTALLMENT <-> TRANSACTION SYNC
-- These functions already exist but triggers were never attached
-- ============================================

-- Trigger: sync installments to transactions on INSERT/UPDATE
CREATE TRIGGER trg_sync_installment_to_transaction
  AFTER INSERT OR UPDATE ON public.recurring_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_installment_to_transaction();

-- Trigger: sync transactions back to installments on UPDATE
CREATE TRIGGER trg_sync_transaction_to_installment
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_transaction_to_installment();

-- ============================================
-- 2. CREATE FINANCIAL ENTITIES TABLE
-- ============================================

CREATE TABLE public.financial_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('COLABORADOR', 'FORNECEDOR', 'SOCIO', 'GRUPO')),
  email TEXT,
  phone TEXT,
  document TEXT,
  cost_center_id UUID REFERENCES public.cost_centers(id),
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies for financial_entities
ALTER TABLE public.financial_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for financial_entities" ON public.financial_entities
  FOR SELECT USING (true);
CREATE POLICY "Public insert access for financial_entities" ON public.financial_entities
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for financial_entities" ON public.financial_entities
  FOR UPDATE USING (true);
CREATE POLICY "Public delete access for financial_entities" ON public.financial_entities
  FOR DELETE USING (true);

-- ============================================
-- 3. ADD entity_id COLUMN TO TRANSACTIONS
-- ============================================

ALTER TABLE public.transactions 
  ADD COLUMN entity_id UUID REFERENCES public.financial_entities(id);

-- ============================================
-- 4. ACCOUNT BALANCE RECALCULATION FUNCTION + TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.recalculate_account_balance(p_account_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_initial NUMERIC;
  v_tx_balance NUMERIC;
  v_transfer_in NUMERIC;
  v_transfer_out NUMERIC;
BEGIN
  -- Get initial balance
  SELECT initial_balance INTO v_initial
  FROM public.accounts WHERE id = p_account_id;

  -- Sum paid transactions (entries positive, exits negative)
  -- Check both conta_id (text legacy) and try to match by UUID
  SELECT COALESCE(SUM(
    CASE 
      WHEN tipo_movimento = 'ENTRADA' THEN COALESCE(valor_pago, valor)
      WHEN tipo_movimento = 'SAIDA' THEN -COALESCE(valor_pago, valor)
      ELSE 0
    END
  ), 0) INTO v_tx_balance
  FROM public.transactions
  WHERE status = 'PAGO'
    AND (conta_id = p_account_id::text OR account_id = p_account_id);

  -- Sum transfers in
  SELECT COALESCE(SUM(amount), 0) INTO v_transfer_in
  FROM public.account_transfers
  WHERE to_account_id = p_account_id;

  -- Sum transfers out
  SELECT COALESCE(SUM(amount), 0) INTO v_transfer_out
  FROM public.account_transfers
  WHERE from_account_id = p_account_id;

  -- Update current_balance
  UPDATE public.accounts
  SET current_balance = v_initial + v_tx_balance + v_transfer_in - v_transfer_out,
      updated_at = now()
  WHERE id = p_account_id;
END;
$$;

-- Trigger function to recalculate on transaction changes
CREATE OR REPLACE FUNCTION public.trg_recalculate_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_old_account UUID;
  v_new_account UUID;
BEGIN
  -- Determine account IDs
  IF TG_OP = 'DELETE' THEN
    v_old_account := CASE WHEN OLD.account_id IS NOT NULL THEN OLD.account_id 
                          WHEN OLD.conta_id IS NOT NULL THEN OLD.conta_id::uuid 
                          ELSE NULL END;
    IF v_old_account IS NOT NULL THEN
      PERFORM recalculate_account_balance(v_old_account);
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_new_account := CASE WHEN NEW.account_id IS NOT NULL THEN NEW.account_id 
                          WHEN NEW.conta_id IS NOT NULL THEN 
                            CASE WHEN NEW.conta_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                              THEN NEW.conta_id::uuid ELSE NULL END
                          ELSE NULL END;
    
    IF TG_OP = 'UPDATE' THEN
      v_old_account := CASE WHEN OLD.account_id IS NOT NULL THEN OLD.account_id 
                            WHEN OLD.conta_id IS NOT NULL THEN 
                              CASE WHEN OLD.conta_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                                THEN OLD.conta_id::uuid ELSE NULL END
                            ELSE NULL END;
      IF v_old_account IS DISTINCT FROM v_new_account AND v_old_account IS NOT NULL THEN
        PERFORM recalculate_account_balance(v_old_account);
      END IF;
    END IF;

    IF v_new_account IS NOT NULL THEN
      PERFORM recalculate_account_balance(v_new_account);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Attach trigger to transactions
CREATE TRIGGER trg_transactions_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recalculate_account_balance();

-- Trigger for transfers
CREATE OR REPLACE FUNCTION public.trg_recalculate_transfer_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_account_balance(OLD.from_account_id);
    PERFORM recalculate_account_balance(OLD.to_account_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM recalculate_account_balance(NEW.from_account_id);
    PERFORM recalculate_account_balance(NEW.to_account_id);
    IF TG_OP = 'UPDATE' THEN
      IF OLD.from_account_id IS DISTINCT FROM NEW.from_account_id THEN
        PERFORM recalculate_account_balance(OLD.from_account_id);
      END IF;
      IF OLD.to_account_id IS DISTINCT FROM NEW.to_account_id THEN
        PERFORM recalculate_account_balance(OLD.to_account_id);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_transfers_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.account_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recalculate_transfer_balance();

-- ============================================
-- 5. RECALCULATE ALL EXISTING ACCOUNT BALANCES
-- ============================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.accounts LOOP
    PERFORM recalculate_account_balance(r.id);
  END LOOP;
END;
$$;

-- ============================================
-- 6. UPDATE TRIGGER for updated_at on financial_entities
-- ============================================

CREATE TRIGGER update_financial_entities_updated_at
  BEFORE UPDATE ON public.financial_entities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
