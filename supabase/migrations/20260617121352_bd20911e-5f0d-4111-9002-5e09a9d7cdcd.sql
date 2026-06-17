
create extension if not exists pgcrypto;

-- ============================================================
-- CARTÃO: faturas e itens
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_card_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competence_month INTEGER NOT NULL CHECK (competence_month BETWEEN 1 AND 12),
  competence_year INTEGER NOT NULL CHECK (competence_year BETWEEN 2000 AND 2100),
  file_name TEXT,
  holder TEXT,
  invoice_label TEXT,
  source_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  selected_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'CONFERENCIA' CHECK (status IN ('CONFERENCIA','PRONTA','CONVERTIDA','ARQUIVADA')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoices_competence ON public.credit_card_invoices(competence_year, competence_month);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_card_invoices TO anon, authenticated;
GRANT ALL ON public.credit_card_invoices TO service_role;
ALTER TABLE public.credit_card_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read credit_card_invoices" ON public.credit_card_invoices;
DROP POLICY IF EXISTS "Public insert credit_card_invoices" ON public.credit_card_invoices;
DROP POLICY IF EXISTS "Public update credit_card_invoices" ON public.credit_card_invoices;
DROP POLICY IF EXISTS "Public delete credit_card_invoices" ON public.credit_card_invoices;
CREATE POLICY "Public read credit_card_invoices" ON public.credit_card_invoices FOR SELECT USING (true);
CREATE POLICY "Public insert credit_card_invoices" ON public.credit_card_invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update credit_card_invoices" ON public.credit_card_invoices FOR UPDATE USING (true);
CREATE POLICY "Public delete credit_card_invoices" ON public.credit_card_invoices FOR DELETE USING (true);

DROP TRIGGER IF EXISTS trg_credit_card_invoices_updated ON public.credit_card_invoices;
CREATE TRIGGER trg_credit_card_invoices_updated BEFORE UPDATE ON public.credit_card_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.credit_card_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.credit_card_invoices(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  card_final_digits TEXT,
  card_type TEXT,
  transaction_date DATE,
  description TEXT NOT NULL,
  normalized_description TEXT,
  installment TEXT,
  scope TEXT NOT NULL DEFAULT 'nacional' CHECK (scope IN ('nacional','internacional')),
  country TEXT,
  usd_value NUMERIC,
  fx_rate NUMERIC,
  amount NUMERIC NOT NULL,
  category_hint TEXT,
  transaction_category_id UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  entity_id UUID REFERENCES public.financial_entities(id) ON DELETE SET NULL,
  notes TEXT,
  review_status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (review_status IN ('PENDENTE','REVISADO','IGNORADO','CONVERTIDO')),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoice_items_invoice ON public.credit_card_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoice_items_description ON public.credit_card_invoice_items(normalized_description);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoice_items_status ON public.credit_card_invoice_items(review_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_card_invoice_items TO anon, authenticated;
GRANT ALL ON public.credit_card_invoice_items TO service_role;
ALTER TABLE public.credit_card_invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read credit_card_invoice_items" ON public.credit_card_invoice_items;
DROP POLICY IF EXISTS "Public insert credit_card_invoice_items" ON public.credit_card_invoice_items;
DROP POLICY IF EXISTS "Public update credit_card_invoice_items" ON public.credit_card_invoice_items;
DROP POLICY IF EXISTS "Public delete credit_card_invoice_items" ON public.credit_card_invoice_items;
CREATE POLICY "Public read credit_card_invoice_items" ON public.credit_card_invoice_items FOR SELECT USING (true);
CREATE POLICY "Public insert credit_card_invoice_items" ON public.credit_card_invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update credit_card_invoice_items" ON public.credit_card_invoice_items FOR UPDATE USING (true);
CREATE POLICY "Public delete credit_card_invoice_items" ON public.credit_card_invoice_items FOR DELETE USING (true);

DROP TRIGGER IF EXISTS trg_credit_card_invoice_items_updated ON public.credit_card_invoice_items;
CREATE TRIGGER trg_credit_card_invoice_items_updated BEFORE UPDATE ON public.credit_card_invoice_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Classificação / conversão / reembolso
ALTER TABLE public.credit_card_invoice_items
  ADD COLUMN IF NOT EXISTS usage_scope TEXT NOT NULL DEFAULT 'DUVIDA'
    CHECK (usage_scope IN ('EMPRESA','PESSOAL','DUVIDA')),
  ADD COLUMN IF NOT EXISTS conversion_status TEXT NOT NULL DEFAULT 'NAO_SELECIONADO'
    CHECK (conversion_status IN ('NAO_SELECIONADO','PRONTO','CONVERTIDO','IGNORADO')),
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.recurring_clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reimbursement_status TEXT NOT NULL DEFAULT 'NAO_APLICA'
    CHECK (reimbursement_status IN ('NAO_APLICA','PENDENTE','REEMBOLSADO')),
  ADD COLUMN IF NOT EXISTS reimbursement_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_credit_card_invoice_items_scope ON public.credit_card_invoice_items(usage_scope);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoice_items_conversion ON public.credit_card_invoice_items(conversion_status);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoice_items_card ON public.credit_card_invoice_items(invoice_id, card_name, card_final_digits);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoice_items_reimbursement ON public.credit_card_invoice_items(reimbursement_status);

-- Regras por estabelecimento
CREATE TABLE IF NOT EXISTS public.credit_card_merchant_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_key TEXT NOT NULL UNIQUE,
  merchant_label TEXT NOT NULL,
  transaction_category_id UUID NOT NULL REFERENCES public.transaction_categories(id) ON DELETE CASCADE,
  usage_scope TEXT NOT NULL DEFAULT 'EMPRESA' CHECK (usage_scope IN ('EMPRESA','PESSOAL','DUVIDA')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_card_merchant_rules_key ON public.credit_card_merchant_rules(merchant_key);
CREATE INDEX IF NOT EXISTS idx_credit_card_merchant_rules_category ON public.credit_card_merchant_rules(transaction_category_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_card_merchant_rules TO anon, authenticated;
GRANT ALL ON public.credit_card_merchant_rules TO service_role;
ALTER TABLE public.credit_card_merchant_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read credit_card_merchant_rules" ON public.credit_card_merchant_rules;
DROP POLICY IF EXISTS "Public insert credit_card_merchant_rules" ON public.credit_card_merchant_rules;
DROP POLICY IF EXISTS "Public update credit_card_merchant_rules" ON public.credit_card_merchant_rules;
DROP POLICY IF EXISTS "Public delete credit_card_merchant_rules" ON public.credit_card_merchant_rules;
CREATE POLICY "Public read credit_card_merchant_rules" ON public.credit_card_merchant_rules FOR SELECT USING (true);
CREATE POLICY "Public insert credit_card_merchant_rules" ON public.credit_card_merchant_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update credit_card_merchant_rules" ON public.credit_card_merchant_rules FOR UPDATE USING (true);
CREATE POLICY "Public delete credit_card_merchant_rules" ON public.credit_card_merchant_rules FOR DELETE USING (true);

DROP TRIGGER IF EXISTS trg_credit_card_merchant_rules_updated ON public.credit_card_merchant_rules;
CREATE TRIGGER trg_credit_card_merchant_rules_updated BEFORE UPDATE ON public.credit_card_merchant_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Perfis de cartão
CREATE TABLE IF NOT EXISTS public.credit_card_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_key TEXT NOT NULL UNIQUE,
  card_name TEXT NOT NULL,
  card_final_digits TEXT,
  card_type TEXT,
  owner_name TEXT,
  usage_scope TEXT NOT NULL DEFAULT 'DUVIDA' CHECK (usage_scope IN ('EMPRESA','PESSOAL','DUVIDA')),
  color TEXT NOT NULL DEFAULT '#10b981',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_card_profiles_scope ON public.credit_card_profiles(usage_scope);
CREATE INDEX IF NOT EXISTS idx_credit_card_profiles_active ON public.credit_card_profiles(active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_card_profiles TO anon, authenticated;
GRANT ALL ON public.credit_card_profiles TO service_role;
ALTER TABLE public.credit_card_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read credit_card_profiles" ON public.credit_card_profiles;
DROP POLICY IF EXISTS "Public insert credit_card_profiles" ON public.credit_card_profiles;
DROP POLICY IF EXISTS "Public update credit_card_profiles" ON public.credit_card_profiles;
DROP POLICY IF EXISTS "Public delete credit_card_profiles" ON public.credit_card_profiles;
CREATE POLICY "Public read credit_card_profiles" ON public.credit_card_profiles FOR SELECT USING (true);
CREATE POLICY "Public insert credit_card_profiles" ON public.credit_card_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update credit_card_profiles" ON public.credit_card_profiles FOR UPDATE USING (true);
CREATE POLICY "Public delete credit_card_profiles" ON public.credit_card_profiles FOR DELETE USING (true);

DROP TRIGGER IF EXISTS trg_credit_card_profiles_updated ON public.credit_card_profiles;
CREATE TRIGGER trg_credit_card_profiles_updated BEFORE UPDATE ON public.credit_card_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CONTRATOS DIGITAIS
-- ============================================================
create table if not exists public.contract_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_type text,
  description text,
  cover_title text,
  cover_subtitle text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contract_clauses (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.contract_templates(id) on delete cascade,
  title text not null,
  body text not null,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contract_documents (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.contract_templates(id) on delete set null,
  title text not null,
  status text not null default 'rascunho' check (status in ('rascunho','em_revisao','aguardando_aceite','aceito','cancelado')),
  contractor_type text not null check (contractor_type in ('pessoa_fisica','pessoa_juridica')),
  contractor_name text not null,
  contractor_document text not null,
  contractor_email text,
  contractor_phone text,
  contractor_address text,
  contractor_responsible text,
  plan_name text,
  plan_value numeric(14,2),
  payment_terms text,
  start_date date,
  end_date date,
  digital_snapshot jsonb not null default '{}'::jsonb,
  accepted_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contract_document_clauses (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.contract_documents(id) on delete cascade,
  source_clause_id uuid references public.contract_clauses(id) on delete set null,
  title text not null,
  body text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_acceptance_links (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.contract_documents(id) on delete cascade,
  token text not null unique,
  status text not null default 'aguardando' check (status in ('aguardando','aceito','expirado','cancelado')),
  expires_at timestamptz,
  accepted_at timestamptz,
  accepted_name text,
  accepted_document text,
  accepted_email text,
  accepted_ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_acceptance_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.contract_documents(id) on delete cascade,
  acceptance_link_id uuid references public.contract_acceptance_links(id) on delete set null,
  event_type text not null,
  actor_name text,
  actor_document text,
  actor_email text,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_contract_clauses_template on public.contract_clauses(template_id, display_order);
create index if not exists idx_contract_documents_status on public.contract_documents(status, created_at);
create index if not exists idx_contract_acceptance_links_token on public.contract_acceptance_links(token);
create index if not exists idx_contract_acceptance_links_document on public.contract_acceptance_links(document_id);

alter table public.contract_templates enable row level security;
alter table public.contract_clauses enable row level security;
alter table public.contract_documents enable row level security;
alter table public.contract_document_clauses enable row level security;
alter table public.contract_acceptance_links enable row level security;
alter table public.contract_acceptance_events enable row level security;

drop policy if exists "Authenticated can manage contract templates" on public.contract_templates;
create policy "Authenticated can manage contract templates" on public.contract_templates for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated can manage contract clauses" on public.contract_clauses;
create policy "Authenticated can manage contract clauses" on public.contract_clauses for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated can manage contract documents" on public.contract_documents;
create policy "Authenticated can manage contract documents" on public.contract_documents for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated can manage document clauses" on public.contract_document_clauses;
create policy "Authenticated can manage document clauses" on public.contract_document_clauses for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated can manage acceptance links" on public.contract_acceptance_links;
create policy "Authenticated can manage acceptance links" on public.contract_acceptance_links for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated can manage acceptance events" on public.contract_acceptance_events;
create policy "Authenticated can manage acceptance events" on public.contract_acceptance_events for all to authenticated using (true) with check (true);

drop policy if exists "Public can read valid acceptance links" on public.contract_acceptance_links;
create policy "Public can read valid acceptance links" on public.contract_acceptance_links for select to anon
using (status = 'aguardando' and (expires_at is null or expires_at > now()));

drop policy if exists "Public can accept valid links" on public.contract_acceptance_links;
create policy "Public can accept valid links" on public.contract_acceptance_links for update to anon
using (status = 'aguardando' and (expires_at is null or expires_at > now()))
with check (status in ('aguardando','aceito'));

drop policy if exists "Public can read linked contract documents" on public.contract_documents;
create policy "Public can read linked contract documents" on public.contract_documents for select to anon
using (exists (select 1 from public.contract_acceptance_links l
  where l.document_id = contract_documents.id and l.status = 'aguardando' and (l.expires_at is null or l.expires_at > now())));

drop policy if exists "Public can read linked document clauses" on public.contract_document_clauses;
create policy "Public can read linked document clauses" on public.contract_document_clauses for select to anon
using (exists (select 1 from public.contract_acceptance_links l
  where l.document_id = contract_document_clauses.document_id and l.status = 'aguardando' and (l.expires_at is null or l.expires_at > now())));

drop policy if exists "Public can insert acceptance events" on public.contract_acceptance_events;
create policy "Public can insert acceptance events" on public.contract_acceptance_events for insert to anon with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.contract_templates to authenticated;
grant select, insert, update, delete on public.contract_clauses to authenticated;
grant select, insert, update, delete on public.contract_documents to authenticated;
grant select, insert, update, delete on public.contract_document_clauses to authenticated;
grant select, insert, update, delete on public.contract_acceptance_links to authenticated;
grant select, insert, update, delete on public.contract_acceptance_events to authenticated;
grant select on public.contract_acceptance_links to anon;
grant select on public.contract_documents to anon;
grant select on public.contract_document_clauses to anon;
grant update on public.contract_acceptance_links to anon;
grant insert on public.contract_acceptance_events to anon;
grant all on public.contract_templates, public.contract_clauses, public.contract_documents,
  public.contract_document_clauses, public.contract_acceptance_links, public.contract_acceptance_events to service_role;

-- Colunas extras nos templates/cláusulas
alter table public.contract_templates
  add column if not exists cover_image_url text,
  add column if not exists accent_color text default '#10b981',
  add column if not exists template_status text default 'ativo',
  add column if not exists version_label text default 'v1';

alter table public.contract_clauses
  add column if not exists clause_kind text default 'legal',
  add column if not exists is_required boolean default true,
  add column if not exists version_label text default 'v1',
  add column if not exists notes text;

-- Seed/atualização do template VIP (versão final v14)
do $seed$
declare
  v_template_id uuid;
begin
  select id into v_template_id from public.contract_templates
   where name = 'Contrato VIP - Ramos Engenharia' order by created_at limit 1;

  if v_template_id is null then
    insert into public.contract_templates (name, service_type, description, cover_title, cover_subtitle, accent_color, template_status, version_label, active)
    values ('Contrato VIP - Ramos Engenharia','Consultoria ambiental',
      'Contrato de prestação de serviços ambientais com plano VIP, Sisramos e termo de aceite digital.',
      'Contrato VIP de Prestação de Serviços','Construindo o presente para preservar o futuro',
      '#10b981','ativo','v2 referência APEU',true)
    returning id into v_template_id;
  else
    update public.contract_templates
       set service_type = 'Consultoria ambiental',
           description = 'Contrato de prestação de serviços ambientais com plano VIP, Sisramos e termo de aceite digital.',
           cover_title = 'Contrato VIP de Prestação de Serviços',
           cover_subtitle = 'Construindo o presente para preservar o futuro',
           accent_color = coalesce(accent_color,'#10b981'),
           template_status = 'ativo',
           version_label = 'v2 referência APEU',
           updated_at = now()
     where id = v_template_id;
  end if;

  delete from public.contract_clauses where template_id = v_template_id;

  insert into public.contract_clauses (template_id, display_order, title, body, active) values
  (v_template_id, 1, 'DAS PARTES',
'Este contrato é celebrado entre:

**CONTRATANTE:** {{contratante_nome}}, inscrita no {{contratante_tipo_documento}} sob o nº {{contratante_documento}}, doravante denominada simplesmente **CONTRATANTE**.

**CONTRATADO:** RAMOS ENGENHARIA, CONSULTORIA E SERVIÇOS LTDA, CNPJ 28.439.151/0001-60, com sede à TV. ARGENTINA, nº 2794, NOVO ESTRELA, CEP 68.742-235, CASTANHAL/PA, representada por Patrick de Oliveira Ramos, CPF 006.011.652-84, RG 9355281 PC/PA, doravante denominada simplesmente **CONTRATADO**.', true),
  (v_template_id, 2, 'DO OBJETO',
'Prestação de serviços profissionais de acompanhamento ambiental, conforme plano contratado, incluindo visitas técnicas, relatórios, monitoramento legal e suporte em licenciamento.', true),
  (v_template_id, 3, 'UTILIZAÇÃO DO SISRAMOS',
'Disponibilização do Sisramos para compartilhamento de informações, relatórios, documentos e comunicação entre as partes, mediante acesso restrito.', true),
  (v_template_id, 4, 'DESCRIÇÃO DO PLANO DE SERVIÇO',
'Planos disponíveis: Anual (0,75 SM), VIP (1,5 SM), Premium (2,25 SM) e Master (3,5 SM), cada um cumulativo em relação ao anterior, com escopo detalhado em proposta comercial.', true),
  (v_template_id, 5, 'PLANO CONTRATADO',
'O plano selecionado consta no resumo comercial e na capa digital deste contrato. Serviços extraordinários, taxas e despesas de terceiros não estão incluídos salvo previsão expressa.', true),
  (v_template_id, 6, 'OBRIGAÇÕES DA CONTRATANTE',
'Fornecer informações, efetuar pagamentos e arcar com taxas adicionais (ARTs, laudos, deslocamentos, taxas públicas) não inclusas no plano.', true),
  (v_template_id, 7, 'OBRIGAÇÕES DO CONTRATADO',
'Prestar os serviços com zelo técnico, manter sigilo, emitir documentos fiscais e responder por obrigações trabalhistas e tributárias da própria equipe.', true),
  (v_template_id, 8, 'INFORMAÇÕES CONFIDENCIAIS',
'Sigilo absoluto sobre informações técnicas, comerciais e financeiras durante a vigência e por 2 anos após o término, salvo exceções legais.', true),
  (v_template_id, 9, 'PRAZO E VALIDADE',
'Contrato contínuo e recorrente a partir do aceite, com pagamento mensal e vigência até manifestação de rescisão por qualquer das partes.', true),
  (v_template_id, 10, 'FORMA DE PAGAMENTO, COBRANÇA E VALOR',
'Pagamento mensal até o dia 10, via boleto, PIX ou transferência. Atrasos superiores a 30 dias poderão gerar protesto conforme Lei 9.492/97.', true),
  (v_template_id, 11, 'DESCUMPRIMENTO CONTRATUAL',
'O descumprimento de cláusulas autoriza rescisão imediata, sem prejuízo de obrigações vencidas e do dever de sigilo.', true),
  (v_template_id, 12, 'RESCISÃO IMEDIATA',
'Rescisão por solicitação via e-mail (patrick@ramosengenharia.info), com suspensão imediata dos serviços e eventual reembolso proporcional em até 7 dias úteis.', true),
  (v_template_id, 13, 'DISPOSIÇÕES GERAIS',
'Inexistência de vínculo trabalhista, alterações somente por escrito, comunicação por canais oficiais, foro da Comarca de Castanhal/PA.', true),
  (v_template_id, 14, 'TERMO DE ACEITE DO CONTRATO',
'Ao aceitar digitalmente, a CONTRATANTE declara ter lido, compreendido e concordado com todas as cláusulas, condições comerciais e foro deste contrato.', true);
end
$seed$;
