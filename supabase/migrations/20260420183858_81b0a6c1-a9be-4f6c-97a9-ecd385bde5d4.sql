-- ============================================
-- FASE 2A: UNIFICAÇÃO DO ESQUEMA TRANSACTIONS
-- ============================================

-- Tabela para logar conflitos detectados durante a migração
CREATE TABLE IF NOT EXISTS public.migration_conflicts_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  field_name text NOT NULL,
  legacy_value text,
  uuid_value text,
  resolution text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.migration_conflicts_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read migration conflicts"
ON public.migration_conflicts_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 1. Logar conflitos antes de resolver
-- ============================================

-- Conflitos de account_id vs conta_id
INSERT INTO public.migration_conflicts_log (table_name, record_id, field_name, legacy_value, uuid_value, resolution)
SELECT 'transactions', id, 'account_id_vs_conta_id', conta_id, account_id::text, 'priorizou account_id (uuid)'
FROM public.transactions
WHERE conta_id IS NOT NULL 
  AND account_id IS NOT NULL 
  AND conta_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND conta_id::uuid <> account_id;

-- Conflitos de transaction_category_id vs categoria_id
INSERT INTO public.migration_conflicts_log (table_name, record_id, field_name, legacy_value, uuid_value, resolution)
SELECT 'transactions', id, 'category_id', categoria_id, transaction_category_id::text, 'priorizou transaction_category_id (uuid)'
FROM public.transactions
WHERE categoria_id IS NOT NULL 
  AND transaction_category_id IS NOT NULL
  AND categoria_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND categoria_id::uuid <> transaction_category_id;

-- ============================================
-- 2. Migrar dados de text legado -> uuid
-- ============================================

-- account_id <- conta_id (quando uuid está vazio mas text é uuid válido)
UPDATE public.transactions
SET account_id = conta_id::uuid
WHERE account_id IS NULL
  AND conta_id IS NOT NULL
  AND conta_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = conta_id::uuid);

-- transaction_category_id <- categoria_id
UPDATE public.transactions
SET transaction_category_id = categoria_id::uuid
WHERE transaction_category_id IS NULL
  AND categoria_id IS NOT NULL
  AND categoria_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (SELECT 1 FROM public.transaction_categories c WHERE c.id = categoria_id::uuid);

-- cost_center_id <- centro_custo_id
UPDATE public.transactions
SET cost_center_id = centro_custo_id::uuid
WHERE cost_center_id IS NULL
  AND centro_custo_id IS NOT NULL
  AND centro_custo_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (SELECT 1 FROM public.cost_centers cc WHERE cc.id = centro_custo_id::uuid);

-- ============================================
-- 3. Inferir cost_center_id a partir da categoria (consistência)
-- ============================================
UPDATE public.transactions t
SET cost_center_id = tc.cost_center_id
FROM public.transaction_categories tc
WHERE t.transaction_category_id = tc.id
  AND t.cost_center_id IS NULL;

-- ============================================
-- 4. Dropar colunas text legadas
-- ============================================
ALTER TABLE public.transactions DROP COLUMN IF EXISTS conta_id;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS categoria_id;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS centro_custo_id;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS forma_pagamento_id;

-- ============================================
-- 5. Adicionar Foreign Keys reais
-- ============================================
ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_account
  FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE RESTRICT;

ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_category
  FOREIGN KEY (transaction_category_id) REFERENCES public.transaction_categories(id) ON DELETE RESTRICT;

ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_cost_center
  FOREIGN KEY (cost_center_id) REFERENCES public.cost_centers(id) ON DELETE RESTRICT;

ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_entity
  FOREIGN KEY (entity_id) REFERENCES public.financial_entities(id) ON DELETE RESTRICT;

ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_client
  FOREIGN KEY (cliente_id) REFERENCES public.recurring_clients(id) ON DELETE SET NULL;

ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_contract
  FOREIGN KEY (contrato_id) REFERENCES public.recurring_contracts(id) ON DELETE SET NULL;

ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_installment
  FOREIGN KEY (installment_id) REFERENCES public.recurring_installments(id) ON DELETE SET NULL;

ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_fixed_expense_v2
  FOREIGN KEY (fixed_expense_id) REFERENCES public.fixed_expenses(id) ON DELETE SET NULL;

-- ============================================
-- 6. Índices para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(transaction_category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_cost_center ON public.transactions(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_transactions_entity ON public.transactions(entity_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client ON public.transactions(cliente_id);
CREATE INDEX IF NOT EXISTS idx_transactions_competencia ON public.transactions(competencia_ano, competencia_mes);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_data_pagamento ON public.transactions(data_pagamento) WHERE status = 'PAGO';