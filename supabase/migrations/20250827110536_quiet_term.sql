/*
  # Sistema de Gerenciamento de Usuários e Assinaturas

  1. Tabelas Existentes (verificar se existem)
    - `subscriptions` - Assinaturas dos usuários
    - `user_system_access` - Controle de acesso aos sistemas
    - `payment_transactions` - Transações de pagamento

  2. Novas Funcionalidades
    - Políticas de segurança para master user
    - Índices para performance
    - Triggers para auditoria

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas específicas para usuário master
    - Controle de acesso granular
*/

-- Verificar e criar tabela de assinaturas se não existir
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type subscription_plan_type DEFAULT 'trial',
  status subscription_status DEFAULT 'active',
  trial_start_date timestamptz DEFAULT now(),
  trial_end_date timestamptz DEFAULT (now() + interval '7 days'),
  payment_date timestamptz,
  payment_amount numeric(10,2),
  payment_intent_id text,
  expires_at timestamptz,
  manual_access boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Verificar e criar tabela de acesso aos sistemas se não existir
CREATE TABLE IF NOT EXISTS user_system_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  system_id text NOT NULL,
  has_access boolean DEFAULT false,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, system_id)
);

-- Verificar e criar tabela de transações de pagamento se não existir
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_method text DEFAULT 'mercadopago',
  payment_intent_id text,
  status text DEFAULT 'pending',
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Criar tipos enum se não existirem
DO $$ BEGIN
  CREATE TYPE subscription_plan_type AS ENUM ('trial', 'paid', 'master');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending_payment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_manual_access ON subscriptions(manual_access);

CREATE INDEX IF NOT EXISTS idx_user_system_access_user_id ON user_system_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_system_access_system_id ON user_system_access(system_id);
CREATE INDEX IF NOT EXISTS idx_user_system_access_has_access ON user_system_access(has_access);
CREATE INDEX IF NOT EXISTS idx_user_system_access_expires_at ON user_system_access(expires_at);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);

-- Habilitar RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_system_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Função para verificar se é usuário master
CREATE OR REPLACE FUNCTION is_master_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'valdigley2007@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para subscriptions
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions;
CREATE POLICY "subscriptions_insert_own" ON subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_update_own" ON subscriptions;
CREATE POLICY "subscriptions_update_own" ON subscriptions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_master_access" ON subscriptions;
CREATE POLICY "subscriptions_master_access" ON subscriptions
  FOR ALL TO authenticated
  USING (is_master_user())
  WITH CHECK (is_master_user());

-- Políticas para user_system_access
DROP POLICY IF EXISTS "Users can view own system access" ON user_system_access;
CREATE POLICY "Users can view own system access" ON user_system_access
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Masters can manage all system access" ON user_system_access;
CREATE POLICY "Masters can manage all system access" ON user_system_access
  FOR ALL TO authenticated
  USING (is_master_user())
  WITH CHECK (is_master_user());

-- Políticas para payment_transactions
DROP POLICY IF EXISTS "payment_transactions_select_own" ON payment_transactions;
CREATE POLICY "payment_transactions_select_own" ON payment_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_transactions_insert_own" ON payment_transactions;
CREATE POLICY "payment_transactions_insert_own" ON payment_transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_transactions_master_access" ON payment_transactions;
CREATE POLICY "payment_transactions_master_access" ON payment_transactions
  FOR ALL TO authenticated
  USING (is_master_user())
  WITH CHECK (is_master_user());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_system_access_updated_at ON user_system_access;
CREATE TRIGGER update_user_system_access_updated_at
  BEFORE UPDATE ON user_system_access
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados iniciais para o usuário master (se não existir)
DO $$
DECLARE
  master_user_id uuid;
BEGIN
  -- Buscar ID do usuário master
  SELECT id INTO master_user_id 
  FROM auth.users 
  WHERE email = 'valdigley2007@gmail.com' 
  LIMIT 1;
  
  -- Se encontrou o usuário master, criar assinatura master
  IF master_user_id IS NOT NULL THEN
    INSERT INTO subscriptions (
      user_id, 
      plan_type, 
      status, 
      manual_access,
      expires_at
    ) VALUES (
      master_user_id, 
      'master', 
      'active', 
      true,
      now() + interval '10 years'
    ) ON CONFLICT (user_id) DO UPDATE SET
      plan_type = 'master',
      status = 'active',
      manual_access = true,
      expires_at = now() + interval '10 years',
      updated_at = now();
    
    -- Dar acesso a todos os sistemas
    INSERT INTO user_system_access (user_id, system_id, has_access, granted_by)
    VALUES 
      (master_user_id, 'photography_tasks', true, master_user_id),
      (master_user_id, 'contracts', true, master_user_id),
      (master_user_id, 'clients', true, master_user_id)
    ON CONFLICT (user_id, system_id) DO UPDATE SET
      has_access = true,
      updated_at = now();
  END IF;
END $$;