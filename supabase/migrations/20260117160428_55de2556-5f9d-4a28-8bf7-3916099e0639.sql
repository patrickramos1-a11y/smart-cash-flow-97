-- ============= TABELA DE CONFIGURAÇÃO DO SALÁRIO MÍNIMO =============
CREATE TABLE public.minimum_wage_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  value NUMERIC(10,2) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(year)
);

-- ============= TABELA DE PLANOS =============
CREATE TABLE public.contract_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  minimum_wage_factor NUMERIC(5,2) NOT NULL, -- 0.75, 1.5, 2, 3
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============= TABELA DE CLIENTES RECORRENTES =============
CREATE TABLE public.recurring_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT, -- CNPJ/CPF
  address TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============= TABELA DE CONTRATOS =============
CREATE TABLE public.recurring_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.recurring_clients(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.contract_plans(id),
  custom_minimum_wage_factor NUMERIC(5,2), -- Fator customizado (sobrescreve o plano)
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============= TABELA DE RECORRÊNCIAS MENSAIS (PARCELAS) =============
CREATE TABLE public.recurring_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.recurring_contracts(id) ON DELETE CASCADE,
  competence_month INTEGER NOT NULL CHECK (competence_month >= 1 AND competence_month <= 12),
  competence_year INTEGER NOT NULL,
  minimum_wage_value NUMERIC(10,2) NOT NULL, -- Valor do SM no momento da geração
  minimum_wage_factor NUMERIC(5,2) NOT NULL, -- Fator aplicado
  expected_value NUMERIC(10,2) NOT NULL, -- Valor esperado
  paid_value NUMERIC(10,2), -- Valor pago
  payment_date DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'EM_ABERTO' CHECK (status IN ('PAGO', 'EM_ABERTO', 'ATRASADO', 'CANCELADO')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contract_id, competence_month, competence_year)
);

-- ============= ÍNDICES =============
CREATE INDEX idx_recurring_clients_active ON public.recurring_clients(active);
CREATE INDEX idx_recurring_contracts_client ON public.recurring_contracts(client_id);
CREATE INDEX idx_recurring_contracts_active ON public.recurring_contracts(active);
CREATE INDEX idx_recurring_installments_contract ON public.recurring_installments(contract_id);
CREATE INDEX idx_recurring_installments_competence ON public.recurring_installments(competence_year, competence_month);
CREATE INDEX idx_recurring_installments_status ON public.recurring_installments(status);

-- ============= TRIGGER PARA ATUALIZAR updated_at =============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_minimum_wage_config_updated_at
BEFORE UPDATE ON public.minimum_wage_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contract_plans_updated_at
BEFORE UPDATE ON public.contract_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_clients_updated_at
BEFORE UPDATE ON public.recurring_clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_contracts_updated_at
BEFORE UPDATE ON public.recurring_contracts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_installments_updated_at
BEFORE UPDATE ON public.recurring_installments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= RLS POLICIES (Público para MVP, sem autenticação) =============
ALTER TABLE public.minimum_wage_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_installments ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para leitura (MVP sem autenticação)
CREATE POLICY "Public read access for minimum_wage_config"
ON public.minimum_wage_config FOR SELECT USING (true);

CREATE POLICY "Public insert access for minimum_wage_config"
ON public.minimum_wage_config FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for minimum_wage_config"
ON public.minimum_wage_config FOR UPDATE USING (true);

CREATE POLICY "Public read access for contract_plans"
ON public.contract_plans FOR SELECT USING (true);

CREATE POLICY "Public insert access for contract_plans"
ON public.contract_plans FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for contract_plans"
ON public.contract_plans FOR UPDATE USING (true);

CREATE POLICY "Public read access for recurring_clients"
ON public.recurring_clients FOR SELECT USING (true);

CREATE POLICY "Public insert access for recurring_clients"
ON public.recurring_clients FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for recurring_clients"
ON public.recurring_clients FOR UPDATE USING (true);

CREATE POLICY "Public delete access for recurring_clients"
ON public.recurring_clients FOR DELETE USING (true);

CREATE POLICY "Public read access for recurring_contracts"
ON public.recurring_contracts FOR SELECT USING (true);

CREATE POLICY "Public insert access for recurring_contracts"
ON public.recurring_contracts FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for recurring_contracts"
ON public.recurring_contracts FOR UPDATE USING (true);

CREATE POLICY "Public delete access for recurring_contracts"
ON public.recurring_contracts FOR DELETE USING (true);

CREATE POLICY "Public read access for recurring_installments"
ON public.recurring_installments FOR SELECT USING (true);

CREATE POLICY "Public insert access for recurring_installments"
ON public.recurring_installments FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for recurring_installments"
ON public.recurring_installments FOR UPDATE USING (true);

CREATE POLICY "Public delete access for recurring_installments"
ON public.recurring_installments FOR DELETE USING (true);