/*
  # Sistema de Gerenciamento de Tarefas

  1. Nova Tabela - tasks
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key para auth.users)
    - `title` (text, título da tarefa)
    - `description` (text, descrição opcional)
    - `status` (text, status: pending, in_progress, completed, cancelled)
    - `priority` (text, prioridade: low, medium, high, urgent)
    - `category` (text, categoria da tarefa)
    - `due_date` (timestamptz, data de vencimento)
    - `completed_at` (timestamptz, data de conclusão)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. Nova Tabela - task_categories
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key para auth.users)
    - `name` (text, nome da categoria)
    - `color` (text, cor da categoria)
    - `created_at` (timestamptz)

  3. Segurança
    - Habilitar RLS em ambas as tabelas
    - Políticas para usuários verem apenas suas próprias tarefas
    - Masters podem ver todas as tarefas
*/

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS task_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de tarefas
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category_id uuid REFERENCES task_categories(id) ON DELETE SET NULL,
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_task_categories_user_id ON task_categories(user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;

-- Políticas para tasks
CREATE POLICY "Users can view own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR get_user_email() = 'valdigley2007@gmail.com');

CREATE POLICY "Users can insert own tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR get_user_email() = 'valdigley2007@gmail.com')
  WITH CHECK (auth.uid() = user_id OR get_user_email() = 'valdigley2007@gmail.com');

CREATE POLICY "Users can delete own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR get_user_email() = 'valdigley2007@gmail.com');

-- Políticas para task_categories
CREATE POLICY "Users can view own categories"
  ON task_categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR get_user_email() = 'valdigley2007@gmail.com');

CREATE POLICY "Users can insert own categories"
  ON task_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON task_categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR get_user_email() = 'valdigley2007@gmail.com')
  WITH CHECK (auth.uid() = user_id OR get_user_email() = 'valdigley2007@gmail.com');

CREATE POLICY "Users can delete own categories"
  ON task_categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR get_user_email() = 'valdigley2007@gmail.com');

-- Inserir categorias padrão para usuários existentes
INSERT INTO task_categories (user_id, name, color)
SELECT 
  u.id,
  category_name,
  category_color
FROM (
  SELECT id FROM auth.users
) u
CROSS JOIN (
  VALUES 
    ('Trabalho', '#3b82f6'),
    ('Pessoal', '#10b981'),
    ('Urgente', '#ef4444'),
    ('Projetos', '#8b5cf6')
) AS categories(category_name, category_color)
ON CONFLICT DO NOTHING;