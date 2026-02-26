
-- Drop all existing triggers first, then recreate
DROP TRIGGER IF EXISTS sync_installment_changes ON public.recurring_installments;
DROP TRIGGER IF EXISTS sync_transaction_changes ON public.transactions;
DROP TRIGGER IF EXISTS trg_sync_installment_to_transaction ON public.recurring_installments;
DROP TRIGGER IF EXISTS trg_sync_transaction_to_installment ON public.transactions;
DROP TRIGGER IF EXISTS trg_recalc_balance_on_transaction ON public.transactions;
DROP TRIGGER IF EXISTS trg_recalc_balance_on_transfer ON public.account_transfers;
DROP TRIGGER IF EXISTS set_updated_at_accounts ON public.accounts;
DROP TRIGGER IF EXISTS set_updated_at_transactions ON public.transactions;
DROP TRIGGER IF EXISTS set_updated_at_recurring_contracts ON public.recurring_contracts;
DROP TRIGGER IF EXISTS set_updated_at_recurring_installments ON public.recurring_installments;

-- 1. Sync installment -> transaction
CREATE TRIGGER sync_installment_changes
  AFTER INSERT OR UPDATE ON public.recurring_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_installment_to_transaction();

-- 2. Sync transaction -> installment
CREATE TRIGGER sync_transaction_changes
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_transaction_to_installment();

-- 3. Recalculate account balance on transaction changes
CREATE TRIGGER trg_recalc_balance_on_transaction
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recalculate_account_balance();

-- 4. Recalculate account balance on transfer changes
CREATE TRIGGER trg_recalc_balance_on_transfer
  AFTER INSERT OR UPDATE OR DELETE ON public.account_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recalculate_transfer_balance();

-- 5. Updated_at triggers
CREATE TRIGGER set_updated_at_accounts
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_transactions
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_recurring_contracts
  BEFORE UPDATE ON public.recurring_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_recurring_installments
  BEFORE UPDATE ON public.recurring_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

NOTIFY pgrst, 'reload schema';
