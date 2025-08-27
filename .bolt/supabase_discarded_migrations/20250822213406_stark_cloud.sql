/*
  # Sistema de Contratos - Estrutura Completa

  1. Tabelas Principais
    - `contratos` - Contratos principais
    - `event_types` - Tipos de eventos
    - `packages` - Pacotes disponíveis
    - `payment_methods` - Métodos de pagamento
    - `package_payment_methods` - Relação pacotes x métodos
    - `payments` - Pagamentos dos contratos

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para usuários autenticados

  3. Funcionalidades
    - CRUD completo de contratos
    - Gestão de pacotes e preços
    - Controle de pagamentos
    - Relatórios e dashboards
*/

-- Garantir que as tabelas existam com a estrutura correta
CREATE TABLE IF NOT EXISTS event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id uuid REFERENCES event_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  discount_percentage numeric(5,2) DEFAULT 0,
  installments integer DEFAULT 1,
  payment_schedule jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Garantir que a tabela contratos tenha todos os campos necessários
DO $$
BEGIN
  -- Adicionar campos que podem não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contratos' AND column_name = 'photographer_id') THEN
    ALTER TABLE contratos ADD COLUMN photographer_id uuid REFERENCES photographers(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contratos' AND column_name = 'event_type_id') THEN
    ALTER TABLE contratos ADD COLUMN event_type_id uuid REFERENCES event_types(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contratos' AND column_name = 'package_id') THEN
    ALTER TABLE contratos ADD COLUMN package_id uuid REFERENCES packages(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contratos' AND column_name = 'payment_method_id') THEN
    ALTER TABLE contratos ADD COLUMN payment_method_id uuid REFERENCES payment_methods(id);
  END IF;
END $$;

-- Tabela de pagamentos dos contratos
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid_date date,
  status payment_status DEFAULT 'pending',
  description text,
  payment_method text DEFAULT 'dinheiro',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir tipos de eventos padrão se não existirem
INSERT INTO event_types (name, is_active) 
SELECT * FROM (VALUES 
  ('Casamento', true),
  ('Aniversário', true),
  ('Formatura', true),
  ('Ensaio Fotográfico', true),
  ('Corporativo', true),
  ('Batizado', true),
  ('15 Anos', true),
  ('Evento Social', true)
) AS v(name, is_active)
WHERE NOT EXISTS (SELECT 1 FROM event_types WHERE name = v.name);

-- Inserir métodos de pagamento padrão
INSERT INTO payment_methods (name, description, discount_percentage, installments) 
SELECT * FROM (VALUES 
  ('À Vista', 'Pagamento à vista', 10.00, 1),
  ('Cartão de Crédito', 'Parcelado no cartão', 0.00, 12),
  ('PIX', 'Pagamento via PIX', 5.00, 1),
  ('Transferência', 'Transferência bancária', 5.00, 1),
  ('Dinheiro', 'Pagamento em dinheiro', 10.00, 1)
) AS v(name, description, discount_percentage, installments)
WHERE NOT EXISTS (SELECT 1 FROM payment_methods WHERE name = v.name);

-- Inserir pacotes padrão se não existirem
DO $$
DECLARE
  casamento_id uuid;
  aniversario_id uuid;
  ensaio_id uuid;
BEGIN
  -- Buscar IDs dos tipos de eventos
  SELECT id INTO casamento_id FROM event_types WHERE name = 'Casamento' LIMIT 1;
  SELECT id INTO aniversario_id FROM event_types WHERE name = 'Aniversário' LIMIT 1;
  SELECT id INTO ensaio_id FROM event_types WHERE name = 'Ensaio Fotográfico' LIMIT 1;
  
  -- Inserir pacotes para casamento
  IF casamento_id IS NOT NULL THEN
    INSERT INTO packages (event_type_id, name, description, price, features) 
    SELECT casamento_id, * FROM (VALUES 
      ('Básico', 'Pacote básico para casamento', 2500.00, '["Cobertura de 6 horas", "200 fotos editadas", "Galeria online"]'::jsonb),
      ('Premium', 'Pacote premium para casamento', 4000.00, '["Cobertura de 8 horas", "400 fotos editadas", "Álbum 30x30", "Galeria online", "Pré-wedding"]'::jsonb),
      ('Completo', 'Pacote completo para casamento', 6000.00, '["Cobertura completa", "600+ fotos editadas", "Álbum premium", "Galeria online", "Pré-wedding", "Making of", "Vídeo highlights"]'::jsonb)
    ) AS v(name, description, price, features)
    WHERE NOT EXISTS (SELECT 1 FROM packages WHERE event_type_id = casamento_id AND name = v.name);
  END IF;
  
  -- Inserir pacotes para aniversário
  IF aniversario_id IS NOT NULL THEN
    INSERT INTO packages (event_type_id, name, description, price, features) 
    SELECT aniversario_id, * FROM (VALUES 
      ('Básico', 'Pacote básico para aniversário', 800.00, '["Cobertura de 3 horas", "100 fotos editadas", "Galeria online"]'::jsonb),
      ('Premium', 'Pacote premium para aniversário', 1200.00, '["Cobertura de 4 horas", "200 fotos editadas", "Álbum 20x20", "Galeria online"]'::jsonb)
    ) AS v(name, description, price, features)
    WHERE NOT EXISTS (SELECT 1 FROM packages WHERE event_type_id = aniversario_id AND name = v.name);
  END IF;
  
  -- Inserir pacotes para ensaio
  IF ensaio_id IS NOT NULL THEN
    INSERT INTO packages (event_type_id, name, description, price, features) 
    SELECT ensaio_id, * FROM (VALUES 
      ('Básico', 'Ensaio fotográfico básico', 400.00, '["1 hora de sessão", "30 fotos editadas", "Galeria online"]'::jsonb),
      ('Premium', 'Ensaio fotográfico premium', 600.00, '["2 horas de sessão", "50 fotos editadas", "Galeria online", "10 fotos impressas"]'::jsonb)
    ) AS v(name, description, price, features)
    WHERE NOT EXISTS (SELECT 1 FROM packages WHERE event_type_id = ensaio_id AND name = v.name);
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas para event_types
CREATE POLICY "Public can read active event types"
  ON event_types FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage event types"
  ON event_types FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para packages
CREATE POLICY "Public can read active packages"
  ON packages FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage packages"
  ON packages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para payment_methods
CREATE POLICY "Public can read active payment methods"
  ON payment_methods FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para payments
CREATE POLICY "Authenticated users can manage payments"
  ON payments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_event_types_active ON event_types(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_event_type_id ON packages(event_type_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_date ON payments(paid_date);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_types_updated_at BEFORE UPDATE ON event_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();