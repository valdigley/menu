# 🚀 INSTRUÇÕES RÁPIDAS - VALDIGLEY

**Execute estes comandos na sua VPS:**

## 📋 PASSO 1: Baixar e executar instalador

```bash
# Baixar instalador
wget https://raw.githubusercontent.com/valdigley/menu/main/vps-install.sh

# Executar como root
sudo bash vps-install.sh
```

## 🚀 PASSO 2: Fazer deploy

```bash
# Ir para diretório
cd /var/www/menu

# Executar deploy
./deploy-now.sh
```

## ✅ PASSO 3: Acessar aplicação

- **URL:** `http://SEU-IP:3000`
- **Login:** `valdigley2007@gmail.com`

---

## 🛠️ Se der erro, execute manualmente:

### **1. Instalar pré-requisitos:**
```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs git
```

### **2. Configurar projeto:**
```bash
# Criar diretório
mkdir -p /var/www/menu
cd /var/www/menu

# Clonar projeto
git clone https://github.com/valdigley/menu.git .

# Criar configuração
cat > .env.production << 'EOF'
VITE_SUPABASE_URL=https://iisejjtimakkwjrbmzvj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc2VqanRpbWFra3dqcmJtenZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjg1MzEsImV4cCI6MjA2Mjg0NDUzMX0.f14s_dLEep9oq6JNVtpMltQkz_O8MsLXO0K2M1G1qIU
EOF
```

### **3. Deploy:**
```bash
# Instalar dependências
npm ci

# Build
npm run build

# Subir aplicação
docker-compose up -d --build
```

### **4. Verificar:**
```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f

# Testar
curl http://localhost:3000
```

---

## 🎯 RESULTADO ESPERADO:

✅ Aplicação rodando em `http://SEU-IP:3000`
✅ Login master: `valdigley2007@gmail.com`
✅ Botão "Configuração" visível apenas para você

## 📞 COMANDOS ÚTEIS:

```bash
# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Parar
docker-compose down

# Status
docker-compose ps
```