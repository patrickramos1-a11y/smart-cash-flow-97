-- ============================================
-- FASE 1: BACKUP PRÉ-REFATORAÇÃO
-- ============================================
-- Cria cópias completas das tabelas críticas para permitir rollback

CREATE TABLE IF NOT EXISTS public.transactions_backup_pre_refactor AS
SELECT * FROM public.transactions;

CREATE TABLE IF NOT EXISTS public.fixed_expenses_backup_pre_refactor AS
SELECT * FROM public.fixed_expenses;

CREATE TABLE IF NOT EXISTS public.accounts_backup_pre_refactor AS
SELECT * FROM public.accounts;

CREATE TABLE IF NOT EXISTS public.recurring_installments_backup_pre_refactor AS
SELECT * FROM public.recurring_installments;

CREATE TABLE IF NOT EXISTS public.recurring_contracts_backup_pre_refactor AS
SELECT * FROM public.recurring_contracts;

-- Adicionar metadata de quando o backup foi criado
COMMENT ON TABLE public.transactions_backup_pre_refactor IS 'Backup criado antes da refatoração de unificação de esquema dual-column';
COMMENT ON TABLE public.fixed_expenses_backup_pre_refactor IS 'Backup criado antes da refatoração de unificação de esquema dual-column';
COMMENT ON TABLE public.accounts_backup_pre_refactor IS 'Backup criado antes da refatoração de unificação de esquema dual-column';
COMMENT ON TABLE public.recurring_installments_backup_pre_refactor IS 'Backup criado antes da refatoração de unificação de esquema dual-column';
COMMENT ON TABLE public.recurring_contracts_backup_pre_refactor IS 'Backup criado antes da refatoração de unificação de esquema dual-column';

-- RLS: somente leitura, restrito a admins
ALTER TABLE public.transactions_backup_pre_refactor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_expenses_backup_pre_refactor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_backup_pre_refactor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_installments_backup_pre_refactor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_contracts_backup_pre_refactor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read transactions backup"
ON public.transactions_backup_pre_refactor FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read fixed_expenses backup"
ON public.fixed_expenses_backup_pre_refactor FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read accounts backup"
ON public.accounts_backup_pre_refactor FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read installments backup"
ON public.recurring_installments_backup_pre_refactor FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read contracts backup"
ON public.recurring_contracts_backup_pre_refactor FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));