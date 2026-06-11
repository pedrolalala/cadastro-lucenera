-- Fix RLS Policies for Projetos
DROP POLICY IF EXISTS "authenticated_select_projetos" ON public.projetos;
CREATE POLICY "authenticated_select_projetos" ON public.projetos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_projetos" ON public.projetos;
CREATE POLICY "authenticated_insert_projetos" ON public.projetos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_projetos" ON public.projetos;
CREATE POLICY "authenticated_update_projetos" ON public.projetos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_projetos" ON public.projetos;
CREATE POLICY "authenticated_delete_projetos" ON public.projetos
  FOR DELETE TO authenticated USING (true);

-- Fix RLS Policies for Contatos and Usuarios to allow listing in dropdowns
DROP POLICY IF EXISTS "authenticated_select_contatos" ON public.contatos;
CREATE POLICY "authenticated_select_contatos" ON public.contatos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_usuarios" ON public.usuarios;
CREATE POLICY "authenticated_select_usuarios" ON public.usuarios
  FOR SELECT TO authenticated USING (true);

-- Seed Auth User, Responsavel, Cliente, and initial Projeto
DO $$
DECLARE
  v_user_id uuid;
  v_cliente_id uuid;
BEGIN
  -- Seed Auth User
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pedro@lucenera.com.br') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'pedro@lucenera.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Pedro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL,
      '', '', ''
    );
    
    -- Sync to public.usuarios
    INSERT INTO public.usuarios (id, email, nome, ativo, onboarding_completado)
    VALUES (v_user_id, 'pedro@lucenera.com.br', 'Pedro', true, true)
    ON CONFLICT (id) DO NOTHING;
  ELSE
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'pedro@lucenera.com.br' LIMIT 1;
  END IF;

  -- Seed Client
  v_cliente_id := gen_random_uuid();
  INSERT INTO public.contatos (id, nome, tipo, email, ativo, nao_residente)
  VALUES (v_cliente_id, 'Cliente Residencial S.A.', 'cliente', 'cliente@lucenera.com.br', true, false)
  ON CONFLICT DO NOTHING;

  -- Seed Projeto
  IF NOT EXISTS (SELECT 1 FROM public.projetos WHERE codigo = 'PRJ-TEST-001') THEN
    INSERT INTO public.projetos (
      id, codigo, nome, cliente_id, responsavel_id, nivel_estrategico, 
      status, data_entrada, cidade, estado, area_do_projeto, arquivado, historico
    ) VALUES (
      gen_random_uuid(), 
      'PRJ-TEST-001', 
      'Projeto Semente', 
      v_cliente_id, 
      v_user_id, 
      '1', 
      'Estudo Inicial', 
      CURRENT_DATE::text, 
      'São Paulo', 
      'SP', 
      '{"tipo": "Residential"}', 
      false, 
      '[]'::jsonb
    );
  END IF;
END $$;
