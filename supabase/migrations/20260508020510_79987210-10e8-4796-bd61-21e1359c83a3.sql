CREATE TABLE public.user_module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_key)
);

ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own permissions"
  ON public.user_module_permissions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert permissions"
  ON public.user_module_permissions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update permissions"
  ON public.user_module_permissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete permissions"
  ON public.user_module_permissions FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_module_permissions_updated_at
  BEFORE UPDATE ON public.user_module_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_module_permissions_user ON public.user_module_permissions(user_id);