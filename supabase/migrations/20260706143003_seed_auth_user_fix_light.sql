DO $$
DECLARE
  v_user_id uuid;
BEGIN
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
      crypt('Skip@Pass', gen_salt('bf', 4)),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Pedro"}',
      false, 'authenticated', 'authenticated',
      '',
      '',
      '',
      '',
      '',
      NULL,
      '',
      '',
      ''
    );

    INSERT INTO public.usuarios (id, email, nome, onboarding_completado, role, ativo)
    VALUES (v_user_id, 'pedro@lucenera.com.br', 'Pedro', true, 'admin', true)
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt('Skip@Pass', gen_salt('bf', 4)),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmation_token = '',
      recovery_token = '',
      email_change_token_new = '',
      email_change = '',
      email_change_token_current = '',
      phone_change = '',
      phone_change_token = '',
      reauthentication_token = ''
    WHERE email = 'pedro@lucenera.com.br';
  END IF;
END $$;
