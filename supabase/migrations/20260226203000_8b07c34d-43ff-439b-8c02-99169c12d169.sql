
-- Junction table for multi-entity support on transactions
CREATE TABLE public.transaction_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  fixed_expense_id UUID REFERENCES public.fixed_expenses(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.financial_entities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT chk_one_parent CHECK (
    (transaction_id IS NOT NULL AND fixed_expense_id IS NULL) OR
    (transaction_id IS NULL AND fixed_expense_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_transaction_entities_transaction ON public.transaction_entities(transaction_id);
CREATE INDEX idx_transaction_entities_fixed_expense ON public.transaction_entities(fixed_expense_id);
CREATE INDEX idx_transaction_entities_entity ON public.transaction_entities(entity_id);

-- RLS
ALTER TABLE public.transaction_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for transaction_entities" ON public.transaction_entities FOR SELECT USING (true);
CREATE POLICY "Public insert access for transaction_entities" ON public.transaction_entities FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for transaction_entities" ON public.transaction_entities FOR UPDATE USING (true);
CREATE POLICY "Public delete access for transaction_entities" ON public.transaction_entities FOR DELETE USING (true);

-- Add client_id to fixed_expenses for expense-client linking
ALTER TABLE public.fixed_expenses ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.recurring_clients(id);
