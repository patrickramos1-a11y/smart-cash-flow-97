
-- 1. Delete transaction history for recurring 2026 transactions
DELETE FROM transaction_history
WHERE transaction_id IN (
  SELECT id FROM transactions 
  WHERE competencia_ano = 2026 AND origem = 'CONTRATO_RECORRENTE'
);

-- 2. Delete all recurring transactions for 2026
DELETE FROM transactions 
WHERE competencia_ano = 2026 AND origem = 'CONTRATO_RECORRENTE';

-- 3. Delete all recurring installments for 2026
DELETE FROM recurring_installments 
WHERE competence_year = 2026;

-- 4. Deactivate all recurring contracts (so user can recreate fresh)
UPDATE recurring_contracts SET active = false WHERE active = true;
