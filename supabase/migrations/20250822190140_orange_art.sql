/*
  # Sistema de Gerenciamento de Tarefas Fotográficas

  1. Nova Tabela - photography_tasks
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key para auth.users)
    - `client_name` (text, nome do cliente)
    - `client_email` (text, email do cliente)
    - `client_phone` (text, telefone do cliente)
    - `event_type` (text, tipo de evento: wedding, birthday, corporate, etc.)
    - `event_date` (date, data do evento)
    - `task_type` (text, tipo de tarefa: photo_editing, album_creation, production_delivery, link_sharing)
    - `title` (text, título da tarefa)
    - `description` (text, descrição detalhada)
    - `status` (text, status: pending, in_progress, review, completed, delivered)
    - `priority` (integer, 1-5 para drag and drop)
    - `photos_count` (integer, quantidade de fotos)
    - `delivery_date` (timestamptz, data prevista de entrega)
    - `actual_delivery_date` (timestamptz, data real de entrega)
    - `payment_status` (text, status do pagamento: pending, partial, paid)
    - `payment_amount` (decimal, valor total)
    - `payment_received` (decimal, valor recebido)
    - `gallery_link` (text, link da galeria de fotos)
    - `link_sent_at` (timestamptz, quando o link foi enviado)
    - `client_viewed_at` (timestamptz, quando o cliente visualizou)
    - `notes` (text, observações internas)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. Nova Tabela - task_files
    - `id` (uuid, primary key)
    - `task_id` (uuid, foreign key para photography_tasks)
    - `file_name` (text, nome do arquivo)
    - `file_url` (text, URL do arquivo)
    - `file_type` (text, tipo: raw, edited, album, contract)
    - `uploaded_at` (timestamptz)

  3. Nova Tabela - task_payments
    - `id` (uuid, primary key)
    - `task_id` (uuid, foreign key para photography_tasks)
    - `amount` (decimal, valor do pagamento)
    - `payment_date` (timestamptz, data do pagamento)
    - `payment_method` (text, método de pagamento)
    - `notes` (text, observações do pagamento)
    - `created_at` (timestamptz)

  4. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários verem apenas suas próprias tarefas
*/

-- Criar tabela principal de tarefas fotográficas
CREATE TABLE IF NOT EXISTS photography_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  event_type text NOT NULL DEFAULT 'other',
  event_date date,
  task_type text NOT NULL DEFAULT 'photo_editing' CHECK (task_type IN ('photo_editing', 'album_creation', 'production_delivery', 'link_sharing', 'other')),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'delivered')),
  priority integer NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  photos_count integer DEFAULT 0,
  delivery_date timestamptz,
  actual_delivery_date timestamptz,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  payment_amount decimal(10,2) DEFAULT 0,
  payment_received decimal(10,2) DEFAULT 0,
  gallery_link text,
  link_sent_at timestamptz,
  client_viewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de arquivos
CREATE TABLE IF NOT EXISTS task_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES photography_tasks(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'other' CHECK (file_type IN ('raw', 'edited', 'album', 'contract', 'other')),
  uploaded_at timestamptz DEFAULT now()
);

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS task_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES photography_tasks(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_date timestamptz DEFAULT now(),
  payment_method text DEFAULT 'cash',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_photography_tasks_user_id ON photography_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_photography_tasks_status ON photography_tasks(status);
CREATE INDEX IF NOT EXISTS idx_photography_tasks_priority ON photography_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_photography_tasks_delivery_date ON photography_tasks(delivery_date);
CREATE INDEX IF NOT EXISTS idx_photography_tasks_event_date ON photography_tasks(event_date);
CREATE INDEX IF NOT EXISTS idx_photography_tasks_task_type ON photography_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_payments_task_id ON task_payments(task_id);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_photography_tasks_updated_at
  BEFORE UPDATE ON photography_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE photography_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_payments ENABLE ROW LEVEL SECURITY;

-- Políticas para photography_tasks
CREATE POLICY "Users can view own photography tasks"
  ON photography_tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photography tasks"
  ON photography_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photography tasks"
  ON photography_tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own photography tasks"
  ON photography_tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para task_files
CREATE POLICY "Users can view files of own tasks"
  ON task_files
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM photography_tasks pt 
    WHERE pt.id = task_files.task_id AND pt.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert files to own tasks"
  ON task_files
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM photography_tasks pt 
    WHERE pt.id = task_files.task_id AND pt.user_id = auth.uid()
  ));

CREATE POLICY "Users can update files of own tasks"
  ON task_files
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM photography_tasks pt 
    WHERE pt.id = task_files.task_id AND pt.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete files of own tasks"
  ON task_files
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM photography_tasks pt 
    WHERE pt.id = task_files.task_id AND pt.user_id = auth.uid()
  ));

-- Políticas para task_payments
CREATE POLICY "Users can view payments of own tasks"
  ON task_payments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM photography_tasks pt 
    WHERE pt.id = task_payments.task_id AND pt.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert payments to own tasks"
  ON task_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM photography_tasks pt 
    WHERE pt.id = task_payments.task_id AND pt.user_id = auth.uid()
  ));

CREATE POLICY "Users can update payments of own tasks"
  ON task_payments
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM photography_tasks pt 
    WHERE pt.id = task_payments.task_id AND pt.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete payments of own tasks"
  ON task_payments
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM photography_tasks pt 
    WHERE pt.id = task_payments.task_id AND pt.user_id = auth.uid()
  ));

-- Função para atualizar status de pagamento automaticamente
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o status de pagamento da tarefa
  UPDATE photography_tasks 
  SET 
    payment_received = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM task_payments 
      WHERE task_id = NEW.task_id
    ),
    payment_status = CASE 
      WHEN (
        SELECT COALESCE(SUM(amount), 0) 
        FROM task_payments 
        WHERE task_id = NEW.task_id
      ) >= payment_amount THEN 'paid'
      WHEN (
        SELECT COALESCE(SUM(amount), 0) 
        FROM task_payments 
        WHERE task_id = NEW.task_id
      ) > 0 THEN 'partial'
      ELSE 'pending'
    END
  WHERE id = NEW.task_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar status de pagamento
CREATE TRIGGER update_task_payment_status
  AFTER INSERT OR UPDATE OR DELETE ON task_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_status();