-- =============================================
-- SPRINT 1: FUNDAÇÃO DO PAINEL FINANCEIRO
-- Novas tabelas para hierarquia completa
-- =============================================

-- 1. Empresas / Fontes Financeiras
CREATE TABLE public.financial_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Categorias de Conta (Agrupadores de Saldo)
CREATE TABLE public.account_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.financial_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Contas Financeiras
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.financial_companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.account_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  bank TEXT,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Centros de Custo (Estrutura DRE - 15 grupos)
CREATE TABLE public.cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.financial_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  dre_group TEXT NOT NULL,
  dre_label TEXT NOT NULL,
  dre_order INTEGER NOT NULL,
  is_expense BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Categorias de Transação (vinculadas a Centro de Custo)
CREATE TYPE expense_category_type AS ENUM ('FIXA', 'VARIAVEL', 'IMPOSTO');

CREATE TABLE public.transaction_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.financial_companies(id) ON DELETE CASCADE,
  cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  type transaction_tipo_movimento NOT NULL,
  expense_type expense_category_type,
  default_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  color TEXT DEFAULT '#6366f1',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Formas de Pagamento
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.financial_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Transferências entre Contas (não afeta DRE)
CREATE TABLE public.account_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.financial_companies(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  to_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Adicionar novos campos na tabela transactions
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.financial_companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transaction_category_id UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.financial_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_transfers ENABLE ROW LEVEL SECURITY;

-- Financial Companies
CREATE POLICY "Public read access for financial_companies" ON public.financial_companies FOR SELECT USING (true);
CREATE POLICY "Public insert access for financial_companies" ON public.financial_companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for financial_companies" ON public.financial_companies FOR UPDATE USING (true);
CREATE POLICY "Public delete access for financial_companies" ON public.financial_companies FOR DELETE USING (true);

-- Account Categories
CREATE POLICY "Public read access for account_categories" ON public.account_categories FOR SELECT USING (true);
CREATE POLICY "Public insert access for account_categories" ON public.account_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for account_categories" ON public.account_categories FOR UPDATE USING (true);
CREATE POLICY "Public delete access for account_categories" ON public.account_categories FOR DELETE USING (true);

-- Accounts
CREATE POLICY "Public read access for accounts" ON public.accounts FOR SELECT USING (true);
CREATE POLICY "Public insert access for accounts" ON public.accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for accounts" ON public.accounts FOR UPDATE USING (true);
CREATE POLICY "Public delete access for accounts" ON public.accounts FOR DELETE USING (true);

-- Cost Centers
CREATE POLICY "Public read access for cost_centers" ON public.cost_centers FOR SELECT USING (true);
CREATE POLICY "Public insert access for cost_centers" ON public.cost_centers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for cost_centers" ON public.cost_centers FOR UPDATE USING (true);
CREATE POLICY "Public delete access for cost_centers" ON public.cost_centers FOR DELETE USING (true);

-- Transaction Categories
CREATE POLICY "Public read access for transaction_categories" ON public.transaction_categories FOR SELECT USING (true);
CREATE POLICY "Public insert access for transaction_categories" ON public.transaction_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for transaction_categories" ON public.transaction_categories FOR UPDATE USING (true);
CREATE POLICY "Public delete access for transaction_categories" ON public.transaction_categories FOR DELETE USING (true);

-- Payment Methods
CREATE POLICY "Public read access for payment_methods" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Public insert access for payment_methods" ON public.payment_methods FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for payment_methods" ON public.payment_methods FOR UPDATE USING (true);
CREATE POLICY "Public delete access for payment_methods" ON public.payment_methods FOR DELETE USING (true);

-- Account Transfers
CREATE POLICY "Public read access for account_transfers" ON public.account_transfers FOR SELECT USING (true);
CREATE POLICY "Public insert access for account_transfers" ON public.account_transfers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for account_transfers" ON public.account_transfers FOR UPDATE USING (true);
CREATE POLICY "Public delete access for account_transfers" ON public.account_transfers FOR DELETE USING (true);

-- =============================================
-- TRIGGERS para updated_at
-- =============================================

CREATE TRIGGER update_financial_companies_updated_at BEFORE UPDATE ON public.financial_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_account_categories_updated_at BEFORE UPDATE ON public.account_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cost_centers_updated_at BEFORE UPDATE ON public.cost_centers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transaction_categories_updated_at BEFORE UPDATE ON public.transaction_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_account_transfers_updated_at BEFORE UPDATE ON public.account_transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();