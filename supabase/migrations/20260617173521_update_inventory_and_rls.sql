-- Ensure estoque_itens has quantidade_reservada
CREATE TABLE IF NOT EXISTS public.estoque_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
    local TEXT NOT NULL,
    quantidade NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.estoque_itens
ADD COLUMN IF NOT EXISTS quantidade_reservada NUMERIC DEFAULT 0;

-- Ensure solicitacoes_compra exists
CREATE TABLE IF NOT EXISTS public.solicitacoes_compra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and add policies
ALTER TABLE public.estoque_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_compra ENABLE ROW LEVEL SECURITY;

-- Policies for estoque_itens
DROP POLICY IF EXISTS "authenticated_select_estoque_itens" ON public.estoque_itens;
CREATE POLICY "authenticated_select_estoque_itens" ON public.estoque_itens FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_estoque_itens" ON public.estoque_itens;
CREATE POLICY "authenticated_insert_estoque_itens" ON public.estoque_itens FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_estoque_itens" ON public.estoque_itens;
CREATE POLICY "authenticated_update_estoque_itens" ON public.estoque_itens FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_estoque_itens" ON public.estoque_itens;
CREATE POLICY "authenticated_delete_estoque_itens" ON public.estoque_itens FOR DELETE TO authenticated USING (true);

-- Policies for solicitacoes_compra
DROP POLICY IF EXISTS "authenticated_select_solicitacoes_compra" ON public.solicitacoes_compra;
CREATE POLICY "authenticated_select_solicitacoes_compra" ON public.solicitacoes_compra FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_solicitacoes_compra" ON public.solicitacoes_compra;
CREATE POLICY "authenticated_insert_solicitacoes_compra" ON public.solicitacoes_compra FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_solicitacoes_compra" ON public.solicitacoes_compra;
CREATE POLICY "authenticated_update_solicitacoes_compra" ON public.solicitacoes_compra FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_solicitacoes_compra" ON public.solicitacoes_compra;
CREATE POLICY "authenticated_delete_solicitacoes_compra" ON public.solicitacoes_compra FOR DELETE TO authenticated USING (true);

-- Seed User pedro@lucenera.com.br
DO $do$
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
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Pedro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    -- Try to insert to usuarios if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios') THEN
      INSERT INTO public.usuarios (id, email, nome, onboarding_completado, role, ativo)
      VALUES (new_user_id, 'pedro@lucenera.com.br', 'Pedro', true, 'admin', true)
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
END $do$;
