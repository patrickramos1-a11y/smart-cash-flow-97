
-- Create ENUM types for transactions
CREATE TYPE transaction_tipo_movimento AS ENUM ('ENTRADA', 'SAIDA');
CREATE TYPE transaction_natureza AS ENUM ('RECORRENTE', 'AVULSA');
CREATE TYPE transaction_origem AS ENUM ('CONTRATO_RECORRENTE', 'DESPESA_FIXA', 'LANCAMENTO_MANUAL', 'IMPORTACAO');
CREATE TYPE transaction_status AS ENUM ('EM_ABERTO', 'PAGO', 'ATRASADO');
CREATE TYPE documento_tipo AS ENUM ('NF', 'RECIBO', 'NOTA_DEBITO', 'SEM_DOCUMENTO');
CREATE TYPE history_evento AS ENUM ('CRIADO', 'MARCADO_PAGO', 'ESTORNADO', 'ALTERADO');

-- Create transactions table (central table for all financial movements)
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_movimento transaction_tipo_movimento NOT NULL,
  natureza transaction_natureza NOT NULL,
  origem transaction_origem NOT NULL,
  
  -- References
  cliente_id UUID REFERENCES public.recurring_clients(id) ON DELETE SET NULL,
  contrato_id UUID REFERENCES public.recurring_contracts(id) ON DELETE SET NULL,
  installment_id UUID REFERENCES public.recurring_installments(id) ON DELETE SET NULL,
  fixed_expense_id UUID,
  
  -- Competence
  competencia_mes INTEGER NOT NULL CHECK (competencia_mes >= 1 AND competencia_mes <= 12),
  competencia_ano INTEGER NOT NULL CHECK (competencia_ano >= 2020 AND competencia_ano <= 2100),
  
  -- Values
  valor NUMERIC NOT NULL DEFAULT 0,
  valor_pago NUMERIC,
  
  -- Dates
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  
  -- Status
  status transaction_status NOT NULL DEFAULT 'EM_ABERTO',
  
  -- Description and categorization
  descricao TEXT,
  categoria_id TEXT,
  centro_custo_id TEXT,
  conta_id TEXT,
  forma_pagamento_id TEXT,
  
  -- Document
  documento_tipo documento_tipo DEFAULT 'SEM_DOCUMENTO',
  documento_numero TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fixed_expenses table (recurring monthly expenses)
CREATE TABLE public.fixed_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  
  -- Categorization
  categoria_id TEXT,
  centro_custo_id TEXT,
  conta_id TEXT,
  forma_pagamento_id TEXT,
  
  -- Period
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  
  -- Status
  active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key from transactions to fixed_expenses
ALTER TABLE public.transactions 
ADD CONSTRAINT fk_transactions_fixed_expense 
FOREIGN KEY (fixed_expense_id) REFERENCES public.fixed_expenses(id) ON DELETE SET NULL;

-- Create transaction_history table (audit log)
CREATE TABLE public.transaction_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  evento history_evento NOT NULL,
  user_id TEXT,
  modulo_origem TEXT NOT NULL,
  dados_anteriores JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Public read access for transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Public insert access for transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Public delete access for transactions" ON public.transactions FOR DELETE USING (true);

-- RLS policies for fixed_expenses
CREATE POLICY "Public read access for fixed_expenses" ON public.fixed_expenses FOR SELECT USING (true);
CREATE POLICY "Public insert access for fixed_expenses" ON public.fixed_expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for fixed_expenses" ON public.fixed_expenses FOR UPDATE USING (true);
CREATE POLICY "Public delete access for fixed_expenses" ON public.fixed_expenses FOR DELETE USING (true);

-- RLS policies for transaction_history
CREATE POLICY "Public read access for transaction_history" ON public.transaction_history FOR SELECT USING (true);
CREATE POLICY "Public insert access for transaction_history" ON public.transaction_history FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_transactions_tipo ON public.transactions(tipo_movimento);
CREATE INDEX idx_transactions_natureza ON public.transactions(natureza);
CREATE INDEX idx_transactions_origem ON public.transactions(origem);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_competencia ON public.transactions(competencia_ano, competencia_mes);
CREATE INDEX idx_transactions_cliente ON public.transactions(cliente_id);
CREATE INDEX idx_transactions_contrato ON public.transactions(contrato_id);
CREATE INDEX idx_transactions_installment ON public.transactions(installment_id);
CREATE INDEX idx_transaction_history_transaction ON public.transaction_history(transaction_id);

-- Triggers for updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fixed_expenses_updated_at
  BEFORE UPDATE ON public.fixed_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to sync recurring_installments -> transactions
CREATE OR REPLACE FUNCTION public.sync_installment_to_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Get client_id from contract
  SELECT rc.client_id INTO v_client_id
  FROM public.recurring_contracts rc
  WHERE rc.id = NEW.contract_id;

  -- Check if transaction already exists for this installment
  SELECT id INTO v_transaction_id
  FROM public.transactions
  WHERE installment_id = NEW.id;

  IF v_transaction_id IS NULL THEN
    -- Create new transaction
    INSERT INTO public.transactions (
      tipo_movimento,
      natureza,
      origem,
      cliente_id,
      contrato_id,
      installment_id,
      competencia_mes,
      competencia_ano,
      valor,
      valor_pago,
      data_vencimento,
      data_pagamento,
      status,
      descricao
    ) VALUES (
      'ENTRADA',
      'RECORRENTE',
      'CONTRATO_RECORRENTE',
      v_client_id,
      NEW.contract_id,
      NEW.id,
      NEW.competence_month,
      NEW.competence_year,
      NEW.expected_value,
      NEW.paid_value,
      NEW.due_date,
      NEW.payment_date,
      CASE 
        WHEN NEW.status = 'PAGO' THEN 'PAGO'::transaction_status
        WHEN NEW.status = 'ATRASADO' THEN 'ATRASADO'::transaction_status
        ELSE 'EM_ABERTO'::transaction_status
      END,
      'Contrato Recorrente - ' || to_char(to_date(NEW.competence_month::text, 'MM'), 'TMMonth') || '/' || NEW.competence_year
    )
    RETURNING id INTO v_transaction_id;

    -- Log creation
    INSERT INTO public.transaction_history (transaction_id, evento, modulo_origem, user_id)
    VALUES (v_transaction_id, 'CRIADO', 'CONTRATOS_RECORRENTES', 'system');
  ELSE
    -- Update existing transaction
    UPDATE public.transactions SET
      valor = NEW.expected_value,
      valor_pago = NEW.paid_value,
      data_vencimento = NEW.due_date,
      data_pagamento = NEW.payment_date,
      status = CASE 
        WHEN NEW.status = 'PAGO' THEN 'PAGO'::transaction_status
        WHEN NEW.status = 'ATRASADO' THEN 'ATRASADO'::transaction_status
        ELSE 'EM_ABERTO'::transaction_status
      END,
      updated_at = now()
    WHERE id = v_transaction_id;

    -- Log update if status changed to paid
    IF NEW.status = 'PAGO' AND OLD.status != 'PAGO' THEN
      INSERT INTO public.transaction_history (transaction_id, evento, modulo_origem, user_id, dados_anteriores)
      VALUES (v_transaction_id, 'MARCADO_PAGO', 'CONTRATOS_RECORRENTES', 'system', 
        jsonb_build_object('status_anterior', OLD.status, 'valor_anterior', OLD.paid_value));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to sync transactions -> recurring_installments
CREATE OR REPLACE FUNCTION public.sync_transaction_to_installment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if this transaction is linked to an installment
  IF NEW.installment_id IS NOT NULL AND NEW.origem = 'CONTRATO_RECORRENTE' THEN
    UPDATE public.recurring_installments SET
      paid_value = NEW.valor_pago,
      payment_date = NEW.data_pagamento,
      status = CASE 
        WHEN NEW.status = 'PAGO' THEN 'PAGO'
        WHEN NEW.status = 'ATRASADO' THEN 'ATRASADO'
        ELSE 'EM_ABERTO'
      END,
      updated_at = now()
    WHERE id = NEW.installment_id;

    -- Log the sync if marked as paid from transactions module
    IF NEW.status = 'PAGO' AND (OLD.status IS NULL OR OLD.status != 'PAGO') THEN
      INSERT INTO public.transaction_history (transaction_id, evento, modulo_origem, user_id, dados_anteriores)
      VALUES (NEW.id, 'MARCADO_PAGO', 'TRANSACOES', 'system',
        jsonb_build_object('status_anterior', OLD.status, 'valor_anterior', OLD.valor_pago));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for bidirectional sync
CREATE TRIGGER sync_installment_changes
  AFTER INSERT OR UPDATE ON public.recurring_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_installment_to_transaction();

CREATE TRIGGER sync_transaction_changes
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.sync_transaction_to_installment();

-- Migrate existing recurring_installments to transactions
INSERT INTO public.transactions (
  tipo_movimento,
  natureza,
  origem,
  cliente_id,
  contrato_id,
  installment_id,
  competencia_mes,
  competencia_ano,
  valor,
  valor_pago,
  data_vencimento,
  data_pagamento,
  status,
  descricao,
  created_at
)
SELECT 
  'ENTRADA'::transaction_tipo_movimento,
  'RECORRENTE'::transaction_natureza,
  'CONTRATO_RECORRENTE'::transaction_origem,
  rc.client_id,
  ri.contract_id,
  ri.id,
  ri.competence_month,
  ri.competence_year,
  ri.expected_value,
  ri.paid_value,
  ri.due_date,
  ri.payment_date,
  CASE 
    WHEN ri.status = 'PAGO' THEN 'PAGO'::transaction_status
    WHEN ri.status = 'ATRASADO' THEN 'ATRASADO'::transaction_status
    ELSE 'EM_ABERTO'::transaction_status
  END,
  'Contrato Recorrente - ' || to_char(to_date(ri.competence_month::text, 'MM'), 'TMMonth') || '/' || ri.competence_year,
  ri.created_at
FROM public.recurring_installments ri
JOIN public.recurring_contracts rc ON rc.id = ri.contract_id;

-- Log migration in history
INSERT INTO public.transaction_history (transaction_id, evento, modulo_origem, user_id)
SELECT id, 'CRIADO', 'MIGRACAO_INICIAL', 'system'
FROM public.transactions
WHERE origem = 'CONTRATO_RECORRENTE';
