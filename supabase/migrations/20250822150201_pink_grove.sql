/*
  # Criar tabela para aplicativos customizados

  1. Nova Tabela
    - `custom_apps`
      - `id` (text, primary key) - ID único do aplicativo
      - `name` (text) - Nome do aplicativo
      - `color` (text) - Classe de cor do gradiente
      - `image` (text) - URL da imagem
      - `url` (text) - URL de destino
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `custom_apps`
    - Adicionar política para permitir todas as operações (público)

  3. Função
    - Criar função para criar tabela se não existir
*/

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS custom_apps (
  id text PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL,
  image text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE custom_apps ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (público)
CREATE POLICY "Permitir todas as operações em custom_apps"
  ON custom_apps
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Função para criar tabela se não existir (para ser chamada via RPC)
CREATE OR REPLACE FUNCTION create_apps_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- A tabela já foi criada acima, esta função é apenas para compatibilidade
  -- com o código que chama via RPC
  NULL;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_apps_updated_at
  BEFORE UPDATE ON custom_apps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();