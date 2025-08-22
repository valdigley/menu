/*
  # Sistema de Controle de Acesso Individual por Sistema

  1. Nova Tabela
    - `user_system_access`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key para auth.users)
      - `system_id` (text, identificador do sistema)
      - `has_access` (boolean, se tem acesso)
      - `granted_by` (uuid, quem liberou o acesso)
      - `granted_at` (timestamp, quando foi liberado)
      - `expires_at` (timestamp, quando expira - opcional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sistemas Disponíveis
    - Triagem, Grana, Contratos, Automação, etc.

  3. Políticas RLS
    - Masters podem gerenciar todos os acessos
    - Usuários podem ver apenas seus próprios acessos
*/

-- Criar tabela de controle de acesso por sistema
CREATE TABLE IF NOT EXISTS user_system_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  system_id text NOT NULL,
  has_access boolean DEFAULT false,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_system_access_user_id ON user_system_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_system_access_system_id ON user_system_access(system_id);
CREATE INDEX IF NOT EXISTS idx_user_system_access_has_access ON user_system_access(has_access);
CREATE INDEX IF NOT EXISTS idx_user_system_access_expires_at ON user_system_access(expires_at);

-- Constraint única para evitar duplicatas
ALTER TABLE user_system_access 
ADD CONSTRAINT unique_user_system 
UNIQUE (user_id, system_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_system_access_updated_at
  BEFORE UPDATE ON user_system_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE user_system_access ENABLE ROW LEVEL SECURITY;

-- Política para masters (acesso total)
CREATE POLICY "Masters can manage all system access"
  ON user_system_access
  FOR ALL
  TO authenticated
  USING (get_user_email() = 'valdigley2007@gmail.com')
  WITH CHECK (get_user_email() = 'valdigley2007@gmail.com');

-- Política para usuários verem seus próprios acessos
CREATE POLICY "Users can view own system access"
  ON user_system_access
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Função para verificar acesso a sistema específico
CREATE OR REPLACE FUNCTION check_system_access(p_user_id uuid, p_system_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_general_access boolean := false;
  has_system_access boolean := false;
  is_master boolean := false;
BEGIN
  -- Verificar se é master
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = p_user_id 
    AND email = 'valdigley2007@gmail.com'
  ) INTO is_master;
  
  IF is_master THEN
    RETURN true;
  END IF;
  
  -- Verificar se tem assinatura ativa geral
  SELECT EXISTS(
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = p_user_id
    AND (
      s.manual_access = true
      OR (
        s.status = 'active' 
        AND (s.expires_at IS NULL OR s.expires_at > now())
      )
    )
  ) INTO has_general_access;
  
  -- Se não tem acesso geral, não pode acessar nenhum sistema
  IF NOT has_general_access THEN
    RETURN false;
  END IF;
  
  -- Verificar acesso específico ao sistema
  SELECT COALESCE(usa.has_access, true) -- Por padrão, se tem assinatura, tem acesso
  FROM user_system_access usa
  WHERE usa.user_id = p_user_id 
  AND usa.system_id = p_system_id
  AND (usa.expires_at IS NULL OR usa.expires_at > now())
  INTO has_system_access;
  
  -- Se não existe registro específico, usar acesso geral
  IF has_system_access IS NULL THEN
    has_system_access := has_general_access;
  END IF;
  
  RETURN has_system_access;
END;
$$;

-- Inserir sistemas padrão para usuários existentes com assinatura ativa
INSERT INTO user_system_access (user_id, system_id, has_access, granted_by, granted_at)
SELECT 
  s.user_id,
  system_id,
  true,
  (SELECT id FROM auth.users WHERE email = 'valdigley2007@gmail.com' LIMIT 1),
  now()
FROM subscriptions s
CROSS JOIN (
  VALUES 
    ('triagem'),
    ('grana'), 
    ('contrato'),
    ('automacao')
) AS systems(system_id)
WHERE s.status = 'active'
  AND (s.expires_at IS NULL OR s.expires_at > now())
ON CONFLICT (user_id, system_id) DO NOTHING;