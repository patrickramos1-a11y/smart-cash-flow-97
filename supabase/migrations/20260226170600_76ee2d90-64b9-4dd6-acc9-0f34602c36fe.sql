
-- Add subtype column to transaction_categories
ALTER TABLE public.transaction_categories 
ADD COLUMN subtype TEXT DEFAULT NULL;

-- Populate subtype based on existing data
UPDATE public.transaction_categories 
SET subtype = CASE
  WHEN type = 'SAIDA' AND expense_type = 'FIXA' THEN 'FIXA'
  WHEN type = 'SAIDA' AND expense_type = 'VARIAVEL' THEN 'VARIAVEL'
  WHEN type = 'SAIDA' AND expense_type = 'IMPOSTO' THEN 'VARIAVEL'
  WHEN type = 'SAIDA' THEN 'VARIAVEL'
  WHEN type = 'ENTRADA' THEN 'AVULSA'
  ELSE 'AVULSA'
END;
