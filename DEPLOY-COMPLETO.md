# 🚀 DEPLOY COMPLETO - VPS 147.93.182.205

## 📋 INSTRUÇÕES PERSONALIZADAS PARA VALDIGLEY

### **🎯 SEUS DADOS:**
- **VPS IP:** 147.93.182.205
- **GitHub:** https://github.com/valdigley/menu.git
- **Supabase:** https://iisejjtimakkwjrbmzvj.supabase.co
- **Login Master:** valdigley2007@gmail.com

---

## 🚀 MÉTODO 1: INSTALAÇÃO AUTOMÁTICA

### **1. Conectar na VPS:**
```bash
ssh root@147.93.182.205
```

### **2. Executar instalador:**
```bash
curl -fsSL https://raw.githubusercontent.com/valdigley/menu/main/vps-install.sh | bash
```

### **3. Acessar aplicação:**
- **URL:** http://147.93.182.205:3000
- **Login:** valdigley2007@gmail.com

---

## 🛠️ MÉTODO 2: INSTALAÇÃO MANUAL

### **1. Conectar na VPS:**
```bash
ssh root@147.93.182.205
```

### **2. Atualizar sistema:**
```bash
apt update && apt upgrade -y
```

### **3. Instalar Docker:**
```bash
curl -fsSL https://get.docker.com | sh
```

### **4. Instalar Docker Compose:**
```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### **5. Instalar Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs git
```

### **6. Configurar firewall:**
```bash
ufw allow 3000/tcp
ufw --force enable
```

### **7. Clonar projeto:**
```bash
mkdir -p /var/www/menu
cd /var/www/menu
git clone https://github.com/valdigley/menu.git .
```

### **8. Criar configuração:**
```bash
cat > .env.production << 'EOF'
VITE_SUPABASE_URL=https://iisejjtimakkwjrbmzvj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc2VqanRpbWFra3dqcmJtenZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjg1MzEsImV4cCI6MjA2Mjg0NDUzMX0.f14s_dLEep9oq6JNVtpMltQkz_O8MsLXO0K2M1G1qIU
VITE_APP_NAME=Ferramentas para Fotógrafos
EOF
```

### **9. Fazer deploy:**
```bash
npm ci
npm run build
docker-compose up -d --build
```

### **10. Verificar:**
```bash
docker-compose ps
curl http://localhost:3000
```

---

## ✅ RESULTADO ESPERADO:

- **✅ Aplicação:** http://147.93.182.205:3000
- **✅ Login:** valdigley2007@gmail.com
- **✅ Configuração:** Botão visível apenas para você

---

## 🔧 COMANDOS ÚTEIS:

### **Ver logs:**
```bash
cd /var/www/menu
docker-compose logs -f
```

### **Reiniciar:**
```bash
cd /var/www/menu
docker-compose restart
```

### **Atualizar:**
```bash
cd /var/www/menu
git pull
docker-compose up -d --build
```

### **Parar:**
```bash
cd /var/www/menu
docker-compose down
```

---

## 🎉 PRONTO!

Após executar, acesse: **http://147.93.182.205:3000**

Login: **valdigley2007@gmail.com**