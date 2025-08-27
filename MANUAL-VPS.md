# 🚀 INSTALAÇÃO MANUAL NA VPS - VALDIGLEY

**Execute estes comandos na sua VPS:**

## 📋 MÉTODO 1: Script Automático

### **1. Criar o instalador:**
```bash
# Criar arquivo
cat > install-vps.sh << 'EOF'
#!/bin/bash
set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Instalando Menu Valdigley...${NC}"

# Atualizar sistema
echo -e "${BLUE}📦 Atualizando sistema...${NC}"
apt update && apt upgrade -y

# Instalar Docker
echo -e "${BLUE}🐳 Instalando Docker...${NC}"
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
echo -e "${BLUE}🔧 Instalando Docker Compose...${NC}"
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Instalar Node.js
echo -e "${BLUE}📦 Instalando Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs git curl

# Configurar firewall
echo -e "${BLUE}🛡️ Configurando firewall...${NC}"
ufw allow 22/tcp
ufw allow 3000/tcp
ufw --force enable

# Clonar projeto
echo -e "${BLUE}📥 Clonando projeto...${NC}"
mkdir -p /var/www/menu
cd /var/www/menu
git clone https://github.com/valdigley/menu.git .

# Criar configuração
echo -e "${BLUE}⚙️ Criando configuração...${NC}"
cat > .env.production << 'ENVEOF'
VITE_SUPABASE_URL=https://iisejjtimakkwjrbmzvj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc2VqanRpbWFra3dqcmJtenZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjg1MzEsImV4cCI6MjA2Mjg0NDUzMX0.f14s_dLEep9oq6JNVtpMltQkz_O8MsLXO0K2M1G1qIU
VITE_APP_NAME=Ferramentas para Fotógrafos
ENVEOF

# Deploy
echo -e "${BLUE}🚀 Fazendo deploy...${NC}"
npm ci
npm run build
docker-compose up -d --build

# Aguardar
sleep 15

# Testar
if curl -f -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Sucesso! Acesse: http://$(curl -s ifconfig.me):3000${NC}"
    echo -e "${GREEN}👑 Login: valdigley2007@gmail.com${NC}"
else
    echo -e "${RED}❌ Erro no deploy${NC}"
fi
EOF

# Executar
chmod +x install-vps.sh
sudo ./install-vps.sh
```

## 📋 MÉTODO 2: Comandos Manuais

### **1. Instalar pré-requisitos:**
```bash
# Atualizar
apt update && apt upgrade -y

# Docker
curl -fsSL https://get.docker.com | sh

# Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs git

# Firewall
ufw allow 3000/tcp
ufw --force enable
```

### **2. Clonar projeto:**
```bash
mkdir -p /var/www/menu
cd /var/www/menu
git clone https://github.com/valdigley/menu.git .
```

### **3. Configurar:**
```bash
cat > .env.production << 'EOF'
VITE_SUPABASE_URL=https://iisejjtimakkwjrbmzvj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc2VqanRpbWFra3dqcmJtenZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjg1MzEsImV4cCI6MjA2Mjg0NDUzMX0.f14s_dLEep9oq6JNVtpMltQkz_O8MsLXO0K2M1G1qIU
EOF
```

### **4. Deploy:**
```bash
npm ci
npm run build
docker-compose up -d --build
```

### **5. Verificar:**
```bash
# Status
docker-compose ps

# Logs
docker-compose logs -f

# Testar
curl http://localhost:3000
```

## ✅ RESULTADO:

- **URL:** `http://SEU-IP:3000`
- **Login:** `valdigley2007@gmail.com`
- **Configuração:** Só você vê o botão

## 🛠️ COMANDOS ÚTEIS:

```bash
# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Parar
docker-compose down

# Atualizar
git pull && docker-compose up -d --build
```