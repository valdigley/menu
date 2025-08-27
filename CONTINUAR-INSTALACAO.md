# 🚀 CONTINUAR INSTALAÇÃO

O instalador parou porque o diretório já existe. Execute estes comandos para continuar:

## 📋 COMANDOS PARA EXECUTAR NA VPS:

```bash
# Limpar diretório existente
cd /var/www
rm -rf menu
mkdir -p menu
cd menu

# Clonar repositório
git clone https://github.com/valdigley/menu.git .

# Criar configuração
cat > .env.production << 'EOF'
VITE_SUPABASE_URL=https://iisejjtimakkwjrbmzvj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc2VqanRpbWFra3dqcmJtenZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjg1MzEsImV4cCI6MjA2Mjg0NDUzMX0.f14s_dLEep9oq6JNVtpMltQkz_O8MsLXO0K2M1G1qIU
VITE_APP_NAME=Ferramentas para Fotógrafos
NODE_ENV=production
EOF

# Instalar dependências
npm ci --silent

# Build da aplicação
npm run build

# Parar containers antigos
docker-compose down --remove-orphans 2>/dev/null || true

# Subir aplicação
docker-compose up -d --build

# Aguardar containers
sleep 15

# Testar
curl http://localhost:3000
```

## ✅ RESULTADO ESPERADO:

- **URL:** http://fotografo.site:3000
- **Login:** valdigley2007@gmail.com

## 🛠️ COMANDOS ÚTEIS:

```bash
# Ver logs
docker-compose logs -f

# Status
docker-compose ps

# Reiniciar
docker-compose restart
```