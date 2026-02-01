-- =====================================================
-- BACKLOG DE PRODUTO - MIGRAÇÃO COMPLETA
-- =====================================================

-- 1. CRIAR ENUMS
-- =====================================================

CREATE TYPE backlog_category AS ENUM (
  'NOVA_FUNCIONALIDADE',
  'MELHORIA_EXISTENTE',
  'CORRECAO_BUG',
  'AJUSTE_TECNICO',
  'UX_UI_VISUAL',
  'RELATORIOS_INDICADORES',
  'SEGURANCA_PERMISSOES',
  'INFRAESTRUTURA_CREDITOS'
);

CREATE TYPE backlog_status AS ENUM (
  'IDEIA',
  'EM_ANALISE',
  'REFINADO',
  'AGUARDANDO_RECURSOS',
  'EM_IMPLEMENTACAO',
  'EM_TESTES',
  'IMPLEMENTADO',
  'LANCADO',
  'VALIDADO',
  'ARQUIVADO'
);

CREATE TYPE backlog_priority AS ENUM ('ALTA', 'MEDIA', 'BAIXA');
CREATE TYPE backlog_impact AS ENUM ('ALTO', 'MEDIO', 'BAIXO');
CREATE TYPE backlog_effort AS ENUM ('PEQUENO', 'MEDIO', 'GRANDE');
CREATE TYPE backlog_validation_type AS ENUM ('TESTE_FUNCIONAL', 'VALIDACAO_VISUAL', 'VALIDACAO_TECNICA', 'VALIDACAO_REGRA_NEGOCIO');
CREATE TYPE backlog_implementation_status AS ENUM ('EXECUTADO', 'NAO_EXECUTADO');
CREATE TYPE backlog_event_type AS ENUM (
  'CRIADO', 'STATUS_ALTERADO', 'ANEXO_ADICIONADO', 'ANEXO_REMOVIDO',
  'PRIORIDADE_ALTERADA', 'DATA_ALTERADA', 'IMPLEMENTADO', 'LANCADO', 'VALIDADO', 'ARQUIVADO'
);

-- 2. CRIAR TABELAS
-- =====================================================

-- Projetos/Produtos
CREATE TABLE public.backlog_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Módulos por Projeto
CREATE TABLE public.backlog_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.backlog_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Itens do Backlog
CREATE TABLE public.backlog_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.backlog_projects(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  category backlog_category NOT NULL,
  description TEXT,
  status backlog_status NOT NULL DEFAULT 'IDEIA',
  priority backlog_priority NOT NULL DEFAULT 'MEDIA',
  expected_impact backlog_impact NOT NULL DEFAULT 'MEDIO',
  effort_estimate backlog_effort NOT NULL DEFAULT 'MEDIO',
  depends_on_credits BOOLEAN NOT NULL DEFAULT false,
  responsible_product TEXT,
  responsible_tech TEXT,
  start_date DATE,
  completion_date DATE,
  release_date DATE,
  validation_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Relação N:N - Módulos Impactados
CREATE TABLE public.backlog_item_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backlog_item_id UUID NOT NULL REFERENCES public.backlog_items(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.backlog_modules(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(backlog_item_id, module_id)
);

-- Anexos
CREATE TABLE public.backlog_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backlog_item_id UUID NOT NULL REFERENCES public.backlog_items(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Confirmação de Entrega/Validação
CREATE TABLE public.backlog_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backlog_item_id UUID NOT NULL REFERENCES public.backlog_items(id) ON DELETE CASCADE,
  validated BOOLEAN NOT NULL DEFAULT false,
  validation_date DATE,
  validated_by TEXT,
  validation_type backlog_validation_type,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Registros de Implementação
CREATE TABLE public.backlog_implementation_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backlog_item_id UUID NOT NULL REFERENCES public.backlog_items(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  responsible TEXT,
  status backlog_implementation_status NOT NULL DEFAULT 'EXECUTADO',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Histórico/Changelog (Imutável)
CREATE TABLE public.backlog_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backlog_item_id UUID NOT NULL REFERENCES public.backlog_items(id) ON DELETE CASCADE,
  event_type backlog_event_type NOT NULL,
  event_description TEXT,
  previous_value TEXT,
  new_value TEXT,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. ÍNDICES
-- =====================================================
CREATE INDEX idx_backlog_items_project ON public.backlog_items(project_id);
CREATE INDEX idx_backlog_items_status ON public.backlog_items(status);
CREATE INDEX idx_backlog_items_priority ON public.backlog_items(priority);
CREATE INDEX idx_backlog_items_category ON public.backlog_items(category);
CREATE INDEX idx_backlog_history_item ON public.backlog_history(backlog_item_id);
CREATE INDEX idx_backlog_modules_project ON public.backlog_modules(project_id);

-- 4. TRIGGERS PARA UPDATED_AT
-- =====================================================
CREATE TRIGGER update_backlog_projects_updated_at
  BEFORE UPDATE ON public.backlog_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_backlog_modules_updated_at
  BEFORE UPDATE ON public.backlog_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_backlog_items_updated_at
  BEFORE UPDATE ON public.backlog_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_backlog_validations_updated_at
  BEFORE UPDATE ON public.backlog_validations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. TRIGGERS PARA CHANGELOG AUTOMÁTICO
-- =====================================================

-- Função para registrar criação de item
CREATE OR REPLACE FUNCTION public.backlog_log_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.backlog_history (
    backlog_item_id, event_type, event_description, new_value, user_id
  ) VALUES (
    NEW.id, 'CRIADO', 'Item criado no backlog', NEW.title, 'system'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para registrar mudança de status
CREATE OR REPLACE FUNCTION public.backlog_log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.backlog_history (
      backlog_item_id, event_type, event_description, previous_value, new_value, user_id
    ) VALUES (
      NEW.id, 'STATUS_ALTERADO', 'Status alterado', OLD.status::text, NEW.status::text, 'system'
    );
    
    -- Registrar eventos específicos
    IF NEW.status = 'IMPLEMENTADO' THEN
      INSERT INTO public.backlog_history (
        backlog_item_id, event_type, event_description, user_id
      ) VALUES (
        NEW.id, 'IMPLEMENTADO', 'Item marcado como implementado', 'system'
      );
    ELSIF NEW.status = 'LANCADO' THEN
      INSERT INTO public.backlog_history (
        backlog_item_id, event_type, event_description, user_id
      ) VALUES (
        NEW.id, 'LANCADO', 'Item lançado em produção', 'system'
      );
    ELSIF NEW.status = 'VALIDADO' THEN
      INSERT INTO public.backlog_history (
        backlog_item_id, event_type, event_description, user_id
      ) VALUES (
        NEW.id, 'VALIDADO', 'Item validado e encerrado', 'system'
      );
    ELSIF NEW.status = 'ARQUIVADO' THEN
      INSERT INTO public.backlog_history (
        backlog_item_id, event_type, event_description, user_id
      ) VALUES (
        NEW.id, 'ARQUIVADO', 'Item arquivado', 'system'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para registrar mudança de prioridade
CREATE OR REPLACE FUNCTION public.backlog_log_priority_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.backlog_history (
      backlog_item_id, event_type, event_description, previous_value, new_value, user_id
    ) VALUES (
      NEW.id, 'PRIORIDADE_ALTERADA', 'Prioridade alterada', OLD.priority::text, NEW.priority::text, 'system'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para registrar mudança de datas
CREATE OR REPLACE FUNCTION public.backlog_log_date_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
    INSERT INTO public.backlog_history (
      backlog_item_id, event_type, event_description, previous_value, new_value, user_id
    ) VALUES (
      NEW.id, 'DATA_ALTERADA', 'Data de início alterada', OLD.start_date::text, NEW.start_date::text, 'system'
    );
  END IF;
  
  IF OLD.completion_date IS DISTINCT FROM NEW.completion_date THEN
    INSERT INTO public.backlog_history (
      backlog_item_id, event_type, event_description, previous_value, new_value, user_id
    ) VALUES (
      NEW.id, 'DATA_ALTERADA', 'Data de conclusão alterada', OLD.completion_date::text, NEW.completion_date::text, 'system'
    );
  END IF;
  
  IF OLD.release_date IS DISTINCT FROM NEW.release_date THEN
    INSERT INTO public.backlog_history (
      backlog_item_id, event_type, event_description, previous_value, new_value, user_id
    ) VALUES (
      NEW.id, 'DATA_ALTERADA', 'Data de lançamento alterada', OLD.release_date::text, NEW.release_date::text, 'system'
    );
  END IF;
  
  IF OLD.validation_date IS DISTINCT FROM NEW.validation_date THEN
    INSERT INTO public.backlog_history (
      backlog_item_id, event_type, event_description, previous_value, new_value, user_id
    ) VALUES (
      NEW.id, 'DATA_ALTERADA', 'Data de validação alterada', OLD.validation_date::text, NEW.validation_date::text, 'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para registrar anexos
CREATE OR REPLACE FUNCTION public.backlog_log_attachment_added()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.backlog_history (
    backlog_item_id, event_type, event_description, new_value, user_id
  ) VALUES (
    NEW.backlog_item_id, 'ANEXO_ADICIONADO', 'Anexo adicionado', NEW.file_name, 'system'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.backlog_log_attachment_removed()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.backlog_history (
    backlog_item_id, event_type, event_description, previous_value, user_id
  ) VALUES (
    OLD.backlog_item_id, 'ANEXO_REMOVIDO', 'Anexo removido', OLD.file_name, 'system'
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Aplicar triggers
CREATE TRIGGER backlog_item_created
  AFTER INSERT ON public.backlog_items
  FOR EACH ROW
  EXECUTE FUNCTION public.backlog_log_creation();

CREATE TRIGGER backlog_item_status_changed
  AFTER UPDATE ON public.backlog_items
  FOR EACH ROW
  EXECUTE FUNCTION public.backlog_log_status_change();

CREATE TRIGGER backlog_item_priority_changed
  AFTER UPDATE ON public.backlog_items
  FOR EACH ROW
  EXECUTE FUNCTION public.backlog_log_priority_change();

CREATE TRIGGER backlog_item_date_changed
  AFTER UPDATE ON public.backlog_items
  FOR EACH ROW
  EXECUTE FUNCTION public.backlog_log_date_change();

CREATE TRIGGER backlog_attachment_added
  AFTER INSERT ON public.backlog_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.backlog_log_attachment_added();

CREATE TRIGGER backlog_attachment_removed
  BEFORE DELETE ON public.backlog_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.backlog_log_attachment_removed();

-- 6. RLS POLICIES
-- =====================================================

ALTER TABLE public.backlog_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog_item_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog_implementation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog_history ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (sistema interno sem autenticação por enquanto)
CREATE POLICY "Public read access for backlog_projects" ON public.backlog_projects FOR SELECT USING (true);
CREATE POLICY "Public insert access for backlog_projects" ON public.backlog_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for backlog_projects" ON public.backlog_projects FOR UPDATE USING (true);
CREATE POLICY "Public delete access for backlog_projects" ON public.backlog_projects FOR DELETE USING (true);

CREATE POLICY "Public read access for backlog_modules" ON public.backlog_modules FOR SELECT USING (true);
CREATE POLICY "Public insert access for backlog_modules" ON public.backlog_modules FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for backlog_modules" ON public.backlog_modules FOR UPDATE USING (true);
CREATE POLICY "Public delete access for backlog_modules" ON public.backlog_modules FOR DELETE USING (true);

CREATE POLICY "Public read access for backlog_items" ON public.backlog_items FOR SELECT USING (true);
CREATE POLICY "Public insert access for backlog_items" ON public.backlog_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for backlog_items" ON public.backlog_items FOR UPDATE USING (true);
CREATE POLICY "Public delete access for backlog_items" ON public.backlog_items FOR DELETE USING (true);

CREATE POLICY "Public read access for backlog_item_modules" ON public.backlog_item_modules FOR SELECT USING (true);
CREATE POLICY "Public insert access for backlog_item_modules" ON public.backlog_item_modules FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for backlog_item_modules" ON public.backlog_item_modules FOR UPDATE USING (true);
CREATE POLICY "Public delete access for backlog_item_modules" ON public.backlog_item_modules FOR DELETE USING (true);

CREATE POLICY "Public read access for backlog_attachments" ON public.backlog_attachments FOR SELECT USING (true);
CREATE POLICY "Public insert access for backlog_attachments" ON public.backlog_attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for backlog_attachments" ON public.backlog_attachments FOR UPDATE USING (true);
CREATE POLICY "Public delete access for backlog_attachments" ON public.backlog_attachments FOR DELETE USING (true);

CREATE POLICY "Public read access for backlog_validations" ON public.backlog_validations FOR SELECT USING (true);
CREATE POLICY "Public insert access for backlog_validations" ON public.backlog_validations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for backlog_validations" ON public.backlog_validations FOR UPDATE USING (true);
CREATE POLICY "Public delete access for backlog_validations" ON public.backlog_validations FOR DELETE USING (true);

CREATE POLICY "Public read access for backlog_implementation_records" ON public.backlog_implementation_records FOR SELECT USING (true);
CREATE POLICY "Public insert access for backlog_implementation_records" ON public.backlog_implementation_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for backlog_implementation_records" ON public.backlog_implementation_records FOR UPDATE USING (true);
CREATE POLICY "Public delete access for backlog_implementation_records" ON public.backlog_implementation_records FOR DELETE USING (true);

-- Histórico é IMUTÁVEL - apenas leitura e inserção
CREATE POLICY "Public read access for backlog_history" ON public.backlog_history FOR SELECT USING (true);
CREATE POLICY "Public insert access for backlog_history" ON public.backlog_history FOR INSERT WITH CHECK (true);

-- 7. STORAGE BUCKET PARA ANEXOS
-- =====================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('backlog-attachments', 'backlog-attachments', true);

CREATE POLICY "Public read access for backlog attachments" ON storage.objects FOR SELECT USING (bucket_id = 'backlog-attachments');
CREATE POLICY "Public insert access for backlog attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'backlog-attachments');
CREATE POLICY "Public update access for backlog attachments" ON storage.objects FOR UPDATE USING (bucket_id = 'backlog-attachments');
CREATE POLICY "Public delete access for backlog attachments" ON storage.objects FOR DELETE USING (bucket_id = 'backlog-attachments');