# 🚀 Deploy Personalizado - Valdigley

**Instruções prontas para usar na sua VPS**

## 📋 PASSO 1: Preparar VPS

### **Conectar na VPS:**
```bash
ssh root@SEU-IP-DA-VPS
# ou
ssh usuario@SEU-IP-DA-VPS
```

### **Instalar pré-requisitos:**
```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verificar instalações
docker --version
docker-compose --version
node --version
```

## 📦 PASSO 2: Baixar Código

```bash
# Criar diretório
mkdir -p /var/www/menu
cd /var/www/menu

# Clonar repositório
git clone https://github.com/valdigley/menu.git .

# Verificar arquivos
ls -la
```

## 🔧 PASSO 3: Configurar Firewall

```bash
# Permitir porta da aplicação
ufw allow 3000/tcp

# Permitir SSH (se não estiver)
ufw allow 22/tcp

# Ativar firewall
ufw --force enable

# Verificar status
ufw status
```

## 🚀 PASSO 4: Deploy Automático

```bash
# Dar permissão ao script
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

**⏱️ Aguarde 2-3 minutos para o deploy completo**

## ✅ PASSO 5: Verificar

### **Testar aplicação:**
```bash
# Teste local
curl http://localhost:3000

# Ver status dos containers
docker-compose ps

# Ver logs
docker-compose logs -f
```

### **Acessar no browser:**
- **URL:** `http://SEU-IP-DA-VPS:3000`
- **Login Master:** `valdigley2007@gmail.com`

## 🛡️ PASSO 6: SSL (Opcional)

### **Se você tem domínio:**
```bash
# Instalar Certbot
apt install certbot nginx

# Configurar Nginx
nano /etc/nginx/sites-available/menu
```

**Conteúdo do arquivo:**
```nginx
server {
    listen 80;
    server_name SEU-DOMINIO.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar site
ln -s /etc/nginx/sites-available/menu /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Gerar SSL
certbot --nginx -d SEU-DOMINIO.com
```

## 🔄 COMANDOS ÚTEIS

### **Gerenciar aplicação:**
```bash
# Ver logs em tempo real
docker-compose logs -f

# Reiniciar aplicação
docker-compose restart

# Parar aplicação
docker-compose down

# Atualizar código
git pull origin main
./deploy.sh

# Limpar recursos
docker system prune -f
```

### **Monitoramento:**
```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Espaço em disco
df -h

# Memória
free -h
```

## 🚨 TROUBLESHOOTING

### **Se aplicação não carregar:**
```bash
# 1. Verificar containers
docker-compose ps

# 2. Ver logs de erro
docker-compose logs

# 3. Verificar porta
netstat -tlnp | grep :3000

# 4. Reiniciar tudo
docker-compose down
docker-compose up -d --build
```

### **Se der erro de memória:**
```bash
# Verificar recursos
free -h
df -h

# Limpar Docker
docker system prune -f

# Reiniciar Docker
systemctl restart docker
```

### **Se der erro de permissão:**
```bash
# Ajustar permissões
chown -R $USER:$USER /var/www/menu
chmod +x deploy.sh
```

## 📞 SUPORTE RÁPIDO

**Comandos de emergência:**
```bash
# Parar tudo
docker-compose down

# Rebuild completo
docker-compose build --no-cache
docker-compose up -d

# Ver logs detalhados
docker-compose logs --tail=100

# Reiniciar servidor
reboot
```

---

## 🎯 CHECKLIST FINAL

- [ ] VPS conectada via SSH
- [ ] Docker e Node.js instalados
- [ ] Código clonado do GitHub
- [ ] Firewall configurado (porta 3000)
- [ ] Deploy executado com sucesso
- [ ] Aplicação acessível no browser
- [ ] Login master funcionando

**🎉 SUCESSO: Aplicação rodando em `http://SEU-IP:3000`**

---

**📱 SEU IP ESPECÍFICO:**
- **URL:** http://147.93.182.205:3000
- **SSH:** ssh root@147.93.182.205

---

**📱 Dados da aplicação:**
- **Repositório:** https://github.com/valdigley/menu.git
- **Supabase:** https://iisejjtimakkwjrbmzvj.supabase.co
- **Master:** valdigley2007@gmail.com
- **Porta:** 3000