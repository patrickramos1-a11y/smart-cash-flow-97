-- =========================================================================
-- BACKFILL: account_id em fixed_expenses e transactions órfãs
-- =========================================================================

-- 1) Despesas fixas: herda default_account_id da categoria
UPDATE public.fixed_expenses fe
SET account_id = tc.default_account_id,
    updated_at = now()
FROM public.transaction_categories tc
WHERE fe.account_id IS NULL
  AND fe.transaction_category_id = tc.id
  AND tc.default_account_id IS NOT NULL
  AND fe.active = true;

-- 2) Transações de DESPESA_FIXA: herda da despesa fixa-mãe (já corrigida acima)
UPDATE public.transactions t
SET account_id = fe.account_id,
    updated_at = now()
FROM public.fixed_expenses fe
WHERE t.account_id IS NULL
  AND t.origem = 'DESPESA_FIXA'
  AND t.fixed_expense_id = fe.id
  AND fe.account_id IS NOT NULL;

-- 3) Varredura de segurança: qualquer transação órfã com categoria que tem default_account_id
UPDATE public.transactions t
SET account_id = tc.default_account_id,
    updated_at = now()
FROM public.transaction_categories tc
WHERE t.account_id IS NULL
  AND t.transaction_category_id = tc.id
  AND tc.default_account_id IS NOT NULL
  AND t.origem IN ('CONTRATO_RECORRENTE', 'LANCAMENTO_MANUAL', 'IMPORTACAO', 'DESPESA_FIXA');

-- 4) Recalcula saldo de todas as contas (mais simples que rastrear quais foram tocadas)
DO $$
DECLARE
  acc_id UUID;
BEGIN
  FOR acc_id IN SELECT id FROM public.accounts WHERE active = true LOOP
    PERFORM public.recalculate_account_balance(acc_id);
  END LOOP;
END $$;

-- 5) Loga despesas fixas que continuam sem conta (categoria também não tinha default)
INSERT INTO public.migration_conflicts_log (table_name, record_id, field_name, legacy_value, uuid_value, resolution)
SELECT
  'fixed_expenses',
  fe.id,
  'account_id',
  fe.nome,
  fe.transaction_category_id::text,
  'PENDENTE_REVISAO_MANUAL: categoria sem default_account_id'
FROM public.fixed_expenses fe
WHERE fe.account_id IS NULL
  AND fe.active = true
ON CONFLICT DO NOTHING;