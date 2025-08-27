# 🚀 Deploy na VPS

Este guia explica como fazer deploy da aplicação na sua VPS.

## 📋 Pré-requisitos

### 1. **VPS com Ubuntu/Debian**
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y
```

### 2. **Instalar Docker**
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. **Instalar Node.js (para build)**
```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 🔧 Configuração

### 1. **Clonar/Enviar código para VPS**
```bash
# Opção 1: Git (recomendado)
git clone seu-repositorio.git
cd seu-projeto

# Opção 2: SCP/SFTP
# Envie todos os arquivos para /var/www/seu-projeto
```

### 2. **Configurar variáveis de ambiente**
```bash
# Copiar e editar arquivo de produção
cp .env.production.example .env.production
nano .env.production
```

**Configure no .env.production:**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 3. **Instalar dependências**
```bash
npm install
```

## 🚀 Deploy

### **Deploy Automático (Recomendado)**
```bash
# Dar permissão de execução
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

### **Deploy Manual**
```bash
# 1. Build da aplicação
npm run build

# 2. Subir containers
docker-compose up -d --build

# 3. Verificar status
docker-compose ps
```

## 🔍 Verificação

### **Testar aplicação**
```bash
# Testar localmente
curl http://localhost

# Ver logs
docker-compose logs -f
```

### **Acessar aplicação**
- **HTTP:** `http://seu-ip-da-vps`
- **HTTPS:** Configure SSL primeiro

## 🛡️ SSL/HTTPS (Opcional)

### **1. Instalar Certbot**
```bash
sudo apt install certbot
```

### **2. Gerar certificado**
```bash
sudo certbot certonly --standalone -d seu-dominio.com
```

### **3. Configurar nginx**
```bash
# Editar nginx.conf e descomentar seção HTTPS
# Copiar certificados para ./ssl/
sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem ./ssl/key.pem
sudo chown $USER:$USER ./ssl/*
```

### **4. Reiniciar containers**
```bash
docker-compose restart nginx
```

## 📊 Monitoramento

### **Ver logs**
```bash
# Todos os logs
docker-compose logs -f

# Logs específicos
docker-compose logs -f nginx
docker-compose logs -f app
```

### **Status dos containers**
```bash
docker-compose ps
```

### **Recursos do sistema**
```bash
docker stats
```

## 🔄 Atualizações

### **Atualizar aplicação**
```bash
# 1. Baixar código atualizado
git pull origin main

# 2. Executar deploy
./deploy.sh
```

### **Backup antes de atualizar**
```bash
# Backup do banco (se usando PostgreSQL local)
docker-compose exec postgres pg_dump -U usuario banco > backup.sql

# Backup dos arquivos
tar -czf backup-$(date +%Y%m%d).tar.gz dist/ docker-compose.yml nginx.conf
```

## 🛠️ Comandos Úteis

```bash
# Parar aplicação
docker-compose down

# Reiniciar aplicação
docker-compose restart

# Ver uso de recursos
docker stats

# Limpar containers antigos
docker system prune -f

# Rebuild completo
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🚨 Troubleshooting

### **Aplicação não carrega**
```bash
# Verificar logs
docker-compose logs nginx
docker-compose logs app

# Verificar portas
sudo netstat -tlnp | grep :80
```

### **Erro de permissão**
```bash
# Ajustar permissões
sudo chown -R $USER:$USER .
chmod +x deploy.sh
```

### **Erro de memória**
```bash
# Verificar recursos
free -h
df -h
docker stats
```

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs:** `docker-compose logs -f`
2. **Verificar recursos:** `docker stats`
3. **Reiniciar:** `docker-compose restart`
4. **Rebuild:** `docker-compose up -d --build`

---

**🎉 Sua aplicação estará disponível em `http://seu-ip-da-vps`**