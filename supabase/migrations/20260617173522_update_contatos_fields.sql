ALTER TABLE public.contatos
ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT,
ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT,
ADD COLUMN IF NOT EXISTS limite_credito NUMERIC,
ADD COLUMN IF NOT EXISTS regime_apuracao TEXT,
ADD COLUMN IF NOT EXISTS email_alternativo TEXT,
ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS cep_entrega TEXT,
ADD COLUMN IF NOT EXISTS endereco_entrega TEXT,
ADD COLUMN IF NOT EXISTS numero_entrega TEXT,
ADD COLUMN IF NOT EXISTS bairro_entrega TEXT,
ADD COLUMN IF NOT EXISTS cidade_entrega TEXT,
ADD COLUMN IF NOT EXISTS estado_entrega TEXT,
ADD COLUMN IF NOT EXISTS cep_cobranca TEXT,
ADD COLUMN IF NOT EXISTS endereco_cobranca TEXT,
ADD COLUMN IF NOT EXISTS numero_cobranca TEXT,
ADD COLUMN IF NOT EXISTS bairro_cobranca TEXT,
ADD COLUMN IF NOT EXISTS cidade_cobranca TEXT,
ADD COLUMN IF NOT EXISTS estado_cobranca TEXT;

CREATE OR REPLACE FUNCTION get_vendedores()
RETURNS TABLE (id UUID, email VARCHAR, name TEXT)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT u.id, u.email, (u.raw_user_meta_data->>'name')::TEXT as name FROM auth.users u;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.contato_tipos (
  contato_id UUID REFERENCES public.contatos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  PRIMARY KEY (contato_id, tipo)
);

ALTER TABLE public.contato_tipos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all" ON public.contato_tipos;
CREATE POLICY "authenticated_all" ON public.contato_tipos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_contato_tipo()
RETURNS trigger AS $$
BEGIN
  IF NEW.tipo IS NOT NULL THEN
    INSERT INTO public.contato_tipos (contato_id, tipo)
    VALUES (NEW.id, NEW.tipo)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_contato_created ON public.contatos;
CREATE TRIGGER on_contato_created
  AFTER INSERT OR UPDATE ON public.contatos
  FOR EACH ROW EXECUTE FUNCTION public.handle_contato_tipo();

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pedro@lucenera.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'pedro@lucenera.com.br',
      crypt('Skip@Pass123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Pedro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
  END IF;
END $$;
