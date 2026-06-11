DO $$
DECLARE
  admin_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pedro@lucenera.com.br') THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'pedro@lucenera.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Pedro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, onboarding_completado, role, ativo)
    VALUES (admin_id, 'pedro@lucenera.com.br', 'Pedro', true, 'admin', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Enable RLS on contatos
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform all operations
DROP POLICY IF EXISTS "authenticated_select_contatos" ON public.contatos;
CREATE POLICY "authenticated_select_contatos" ON public.contatos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_contatos" ON public.contatos;
CREATE POLICY "authenticated_insert_contatos" ON public.contatos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_contatos" ON public.contatos;
CREATE POLICY "authenticated_update_contatos" ON public.contatos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_contatos" ON public.contatos;
CREATE POLICY "authenticated_delete_contatos" ON public.contatos
  FOR DELETE TO authenticated USING (true);
