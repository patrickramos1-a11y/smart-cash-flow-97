-- Drop minhas FKs duplicadas (manter as originais transactions_*_fkey)
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_transactions_account;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_transactions_category;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_transactions_cost_center;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_transactions_entity;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_transactions_client;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_transactions_contract;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_transactions_installment;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_transactions_fixed_expense_v2;