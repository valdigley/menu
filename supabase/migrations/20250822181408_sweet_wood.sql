/*
  # Função para sincronizar usuários do Authentication

  1. Função RPC
    - `get_all_users()` - Retorna todos os usuários do auth.users
  
  2. Trigger
    - Sincroniza automaticamente novos usuários do auth para a tabela users
*/

-- Função para buscar todos os usuários (requer privilégios de admin)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é master
  IF NOT (SELECT email FROM auth.users WHERE auth.users.id = auth.uid()) = 'valdigley2007@gmail.com' THEN
    RAISE EXCEPTION 'Acesso negado: apenas o master pode executar esta função';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name',
      'Usuário'
    )::text as name,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;

-- Função para sincronizar usuário automaticamente
CREATE OR REPLACE FUNCTION sync_user_to_users_table()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir ou atualizar na tabela users
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'Usuário'
    ),
    CASE 
      WHEN NEW.email = 'valdigley2007@gmail.com' THEN 'admin'
      ELSE 'photographer'
    END,
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

  -- Criar assinatura trial automática para novos usuários (exceto master)
  IF NEW.email != 'valdigley2007@gmail.com' THEN
    INSERT INTO public.subscriptions (
      user_id,
      plan_type,
      status,
      trial_start_date,
      trial_end_date,
      expires_at
    )
    VALUES (
      NEW.id,
      'trial',
      'active',
      NOW(),
      NOW() + INTERVAL '7 days',
      NOW() + INTERVAL '7 days'
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    -- Master recebe assinatura master
    INSERT INTO public.subscriptions (
      user_id,
      plan_type,
      status
    )
    VALUES (
      NEW.id,
      'master',
      'active'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para sincronizar automaticamente novos usuários
DROP TRIGGER IF EXISTS sync_user_on_signup ON auth.users;
CREATE TRIGGER sync_user_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_to_users_table();

-- Sincronizar usuários existentes que não estão na tabela users
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN 
    SELECT 
      au.id,
      au.email,
      au.created_at,
      COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        'Usuário'
      ) as name
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    -- Inserir usuário na tabela users
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      created_at,
      updated_at
    )
    VALUES (
      auth_user.id,
      auth_user.email,
      auth_user.name,
      CASE 
        WHEN auth_user.email = 'valdigley2007@gmail.com' THEN 'admin'
        ELSE 'photographer'
      END,
      auth_user.created_at,
      NOW()
    );

    -- Criar assinatura apropriada
    IF auth_user.email != 'valdigley2007@gmail.com' THEN
      INSERT INTO public.subscriptions (
        user_id,
        plan_type,
        status,
        trial_start_date,
        trial_end_date,
        expires_at
      )
      VALUES (
        auth_user.id,
        'trial',
        'active',
        NOW(),
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '7 days'
      )
      ON CONFLICT (user_id) DO NOTHING;
    ELSE
      INSERT INTO public.subscriptions (
        user_id,
        plan_type,
        status
      )
      VALUES (
        auth_user.id,
        'master',
        'active'
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;