/*
  # Sistema SSO - Tabela de Sessões Compartilhadas

  1. Nova Tabela
    - `sso_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência ao usuário)
      - `email` (text, email do usuário)
      - `name` (text, nome do usuário)
      - `token` (text, token SSO único)
      - `expires_at` (timestamp, expiração do token)
      - `created_at` (timestamp)
      - `last_used_at` (timestamp)
      - `is_active` (boolean)
      - `user_agent` (text, informações do browser)
      - `ip_address` (text, IP do usuário)

  2. Segurança
    - Enable RLS na tabela `sso_sessions`
    - Políticas para leitura e escrita controladas
    - Índices para performance

  3. Funcionalidades
    - Criação automática de token SSO no login
    - Limpeza automática de tokens expirados
    - Validação de tokens para outros sistemas
*/

-- Criar tabela de sessões SSO
CREATE TABLE IF NOT EXISTS sso_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  user_agent text DEFAULT '',
  ip_address text DEFAULT '',
  system_permissions jsonb DEFAULT '{}',
  
  CONSTRAINT sso_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sso_sessions_token ON sso_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_user_id ON sso_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_email ON sso_sessions(email);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_expires_at ON sso_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_active ON sso_sessions(is_active);

-- Enable RLS
ALTER TABLE sso_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem gerenciar próprias sessões SSO"
  ON sso_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para sistemas externos lerem tokens válidos
CREATE POLICY "Sistemas podem ler tokens válidos"
  ON sso_sessions
  FOR SELECT
  TO public
  USING (is_active = true AND expires_at > now());

-- Função para limpar tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_sso_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sso_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
  
  DELETE FROM sso_sessions 
  WHERE expires_at < (now() - interval '7 days');
END;
$$;

-- Função para validar token SSO
CREATE OR REPLACE FUNCTION validate_sso_token(token_input text)
RETURNS TABLE(
  user_id uuid,
  email text,
  name text,
  permissions jsonb,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar last_used_at
  UPDATE sso_sessions 
  SET last_used_at = now() 
  WHERE token = token_input 
    AND is_active = true 
    AND expires_at > now();
  
  -- Retornar dados do usuário
  RETURN QUERY
  SELECT 
    s.user_id,
    s.email,
    s.name,
    s.system_permissions,
    s.expires_at
  FROM sso_sessions s
  WHERE s.token = token_input 
    AND s.is_active = true 
    AND s.expires_at > now();
END;
$$;

-- Função para criar token SSO
CREATE OR REPLACE FUNCTION create_sso_token(
  p_user_id uuid,
  p_email text,
  p_name text DEFAULT '',
  p_user_agent text DEFAULT '',
  p_ip_address text DEFAULT '',
  p_permissions jsonb DEFAULT '{}'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token text;
BEGIN
  -- Gerar token único
  new_token := encode(gen_random_bytes(32), 'base64');
  
  -- Desativar tokens antigos do usuário
  UPDATE sso_sessions 
  SET is_active = false 
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Criar novo token
  INSERT INTO sso_sessions (
    user_id,
    email,
    name,
    token,
    user_agent,
    ip_address,
    system_permissions
  ) VALUES (
    p_user_id,
    p_email,
    p_name,
    new_token,
    p_user_agent,
    p_ip_address,
    p_permissions
  );
  
  RETURN new_token;
END;
$$;

-- Trigger para limpeza automática (executar diariamente)
CREATE OR REPLACE FUNCTION trigger_cleanup_sso_tokens()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Executar limpeza ocasionalmente
  IF random() < 0.1 THEN -- 10% de chance
    PERFORM cleanup_expired_sso_tokens();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_sso_tokens_trigger
  AFTER INSERT ON sso_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_sso_tokens();