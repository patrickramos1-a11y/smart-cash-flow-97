
-- ============================================================
-- MÓDULO DE TRANSFERÊNCIAS PLANEJADAS
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE planned_transfer_frequency AS ENUM ('AVULSA','SEMANAL','QUINZENAL','MENSAL','TRIMESTRAL','ANUAL','CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE planned_transfer_status AS ENUM ('ATIVO','PAUSADO','ENCERRADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE planned_occurrence_status AS ENUM ('PLANEJADA','EXECUTADA','ATRASADA','CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABELA: planned_transfers (modelos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.planned_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account_id UUID NOT NULL,
  to_account_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  notes TEXT,
  frequency planned_transfer_frequency NOT NULL DEFAULT 'MENSAL',
  interval_days INTEGER,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  due_day INTEGER DEFAULT 10 CHECK (due_day BETWEEN 1 AND 31),
  status planned_transfer_status NOT NULL DEFAULT 'ATIVO',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_account_id <> to_account_id)
);

ALTER TABLE public.planned_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read planned_transfers" ON public.planned_transfers FOR SELECT USING (true);
CREATE POLICY "Public insert planned_transfers" ON public.planned_transfers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update planned_transfers" ON public.planned_transfers FOR UPDATE USING (true);
CREATE POLICY "Public delete planned_transfers" ON public.planned_transfers FOR DELETE USING (true);

CREATE TRIGGER trg_planned_transfers_updated
BEFORE UPDATE ON public.planned_transfers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABELA: planned_transfer_occurrences
-- ============================================================
CREATE TABLE IF NOT EXISTS public.planned_transfer_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planned_transfer_id UUID NOT NULL REFERENCES public.planned_transfers(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  expected_amount NUMERIC NOT NULL,
  status planned_occurrence_status NOT NULL DEFAULT 'PLANEJADA',
  executed_transfer_id UUID,
  executed_at TIMESTAMPTZ,
  executed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (executed_transfer_id)
);

CREATE INDEX IF NOT EXISTS idx_planned_occ_planned ON public.planned_transfer_occurrences(planned_transfer_id);
CREATE INDEX IF NOT EXISTS idx_planned_occ_date ON public.planned_transfer_occurrences(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_planned_occ_status ON public.planned_transfer_occurrences(status);

ALTER TABLE public.planned_transfer_occurrences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read planned_occurrences" ON public.planned_transfer_occurrences FOR SELECT USING (true);
CREATE POLICY "Public insert planned_occurrences" ON public.planned_transfer_occurrences FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update planned_occurrences" ON public.planned_transfer_occurrences FOR UPDATE USING (true);
CREATE POLICY "Public delete planned_occurrences" ON public.planned_transfer_occurrences FOR DELETE USING (true);

CREATE TRIGGER trg_planned_occ_updated
BEFORE UPDATE ON public.planned_transfer_occurrences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- LIGAÇÃO em account_transfers e transactions
-- ============================================================
ALTER TABLE public.account_transfers
  ADD COLUMN IF NOT EXISTS planned_occurrence_id UUID REFERENCES public.planned_transfer_occurrences(id) ON DELETE SET NULL;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS planned_transfer_occurrence_id UUID REFERENCES public.planned_transfer_occurrences(id) ON DELETE SET NULL;

-- ============================================================
-- FUNÇÃO: gerar ocorrências
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_planned_transfer_occurrences(p_planned_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_pt RECORD;
  v_date DATE;
  v_end DATE;
  v_step INTERVAL;
  v_count INTEGER := 0;
  v_max_iter INTEGER := 200;
BEGIN
  SELECT * INTO v_pt FROM public.planned_transfers WHERE id = p_planned_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Apaga ocorrências futuras NÃO executadas
  DELETE FROM public.planned_transfer_occurrences
   WHERE planned_transfer_id = p_planned_id
     AND status IN ('PLANEJADA','ATRASADA','CANCELADA')
     AND executed_transfer_id IS NULL;

  IF v_pt.status <> 'ATIVO' THEN RETURN 0; END IF;

  v_end := COALESCE(v_pt.end_date, (v_pt.start_date + INTERVAL '12 months')::DATE);

  IF v_pt.frequency = 'AVULSA' THEN
    INSERT INTO public.planned_transfer_occurrences (planned_transfer_id, scheduled_date, expected_amount)
    VALUES (p_planned_id, v_pt.start_date, v_pt.amount);
    RETURN 1;
  END IF;

  v_step := CASE v_pt.frequency
    WHEN 'SEMANAL' THEN INTERVAL '7 days'
    WHEN 'QUINZENAL' THEN INTERVAL '14 days'
    WHEN 'MENSAL' THEN INTERVAL '1 month'
    WHEN 'TRIMESTRAL' THEN INTERVAL '3 months'
    WHEN 'ANUAL' THEN INTERVAL '1 year'
    WHEN 'CUSTOM' THEN make_interval(days => COALESCE(v_pt.interval_days, 30))
  END;

  v_date := v_pt.start_date;

  WHILE v_date <= v_end AND v_count < v_max_iter LOOP
    -- pula se já existe ocorrência (executada) nesta data
    IF NOT EXISTS (
      SELECT 1 FROM public.planned_transfer_occurrences
      WHERE planned_transfer_id = p_planned_id AND scheduled_date = v_date
    ) THEN
      INSERT INTO public.planned_transfer_occurrences (planned_transfer_id, scheduled_date, expected_amount)
      VALUES (p_planned_id, v_date, v_pt.amount);
      v_count := v_count + 1;
    END IF;
    v_date := (v_date::TIMESTAMP + v_step)::DATE;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Trigger: regenera ocorrências quando o modelo muda
CREATE OR REPLACE FUNCTION public.trg_planned_transfers_regenerate()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.generate_planned_transfer_occurrences(NEW.id);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF (OLD.amount IS DISTINCT FROM NEW.amount)
       OR (OLD.frequency IS DISTINCT FROM NEW.frequency)
       OR (OLD.interval_days IS DISTINCT FROM NEW.interval_days)
       OR (OLD.start_date IS DISTINCT FROM NEW.start_date)
       OR (OLD.end_date IS DISTINCT FROM NEW.end_date)
       OR (OLD.status IS DISTINCT FROM NEW.status) THEN
      PERFORM public.generate_planned_transfer_occurrences(NEW.id);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_planned_transfers_regen
AFTER INSERT OR UPDATE ON public.planned_transfers
FOR EACH ROW EXECUTE FUNCTION public.trg_planned_transfers_regenerate();

-- ============================================================
-- FUNÇÃO: executar ocorrência
-- ============================================================
CREATE OR REPLACE FUNCTION public.execute_planned_occurrence(
  p_occurrence_id UUID,
  p_real_date DATE DEFAULT NULL,
  p_amount NUMERIC DEFAULT NULL,
  p_user UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_occ RECORD;
  v_pt RECORD;
  v_amt NUMERIC;
  v_date DATE;
  v_transfer_id UUID;
BEGIN
  SELECT * INTO v_occ FROM public.planned_transfer_occurrences WHERE id = p_occurrence_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ocorrência não encontrada'; END IF;
  IF v_occ.status = 'EXECUTADA' THEN RAISE EXCEPTION 'Ocorrência já executada'; END IF;

  SELECT * INTO v_pt FROM public.planned_transfers WHERE id = v_occ.planned_transfer_id;

  v_amt := COALESCE(p_amount, v_occ.expected_amount);
  v_date := COALESCE(p_real_date, v_occ.scheduled_date);

  INSERT INTO public.account_transfers (from_account_id, to_account_id, amount, transfer_date, notes, planned_occurrence_id)
  VALUES (v_pt.from_account_id, v_pt.to_account_id, v_amt, v_date,
          COALESCE(v_pt.description, 'Transferência planejada'), p_occurrence_id)
  RETURNING id INTO v_transfer_id;

  UPDATE public.planned_transfer_occurrences
     SET status = 'EXECUTADA',
         executed_transfer_id = v_transfer_id,
         executed_at = now(),
         executed_by = p_user,
         updated_at = now()
   WHERE id = p_occurrence_id;

  RETURN v_transfer_id;
END;
$$;
