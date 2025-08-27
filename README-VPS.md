# 🚀 Deploy na VPS - Ferramentas para Fotógrafos

Guia completo para fazer deploy da aplicação na sua VPS.

## 📋 Pré-requisitos na VPS

### 1. **Sistema Operacional**
- Ubuntu 20.04+ ou Debian 11+
- Acesso root ou sudo

### 2. **Instalar Docker**
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar sessão para aplicar mudanças
exit
# Faça login novamente
```

### 3. **Instalar Node.js**
```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

## 🔧 Configuração

### 1. **Enviar código para VPS**

**Opção A: Git (Recomendado)**
```bash
# Na VPS
cd /var/www
sudo mkdir ferramentas-fotografos
sudo chown $USER:$USER ferramentas-fotografos
cd ferramentas-fotografos

# Clone seu repositório
git clone https://github.com/seu-usuario/seu-repo.git .
```

**Opção B: SCP/SFTP**
```bash
# Do seu computador local
scp -r . usuario@sua-vps:/var/www/ferramentas-fotografos/
```

### 2. **Configurar variáveis de ambiente**
```bash
# Na VPS, editar arquivo de produção
nano .env.production
```

**Configure com suas credenciais reais:**
```env
VITE_SUPABASE_URL=https://seu-projeto-real.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-real
```

### 3. **Configurar firewall (opcional)**
```bash
# Permitir porta 3000
sudo ufw allow 3000/tcp
sudo ufw enable
```

## 🚀 Deploy

### **Deploy Automático (Recomendado)**
```bash
# Dar permissão e executar
chmod +x deploy.sh
./deploy.sh
```

### **Deploy Manual**
```bash
# 1. Instalar dependências
npm ci

# 2. Build da aplicação
npm run build

# 3. Subir containers
docker-compose up -d --build

# 4. Verificar status
docker-compose ps
```

## ✅ Verificação

### **Testar aplicação**
```bash
# Teste local
curl http://localhost:3000

# Teste de saúde
curl http://localhost:3000/health

# Ver logs
docker-compose logs -f
```

### **Acessar aplicação**
- **Local:** `http://localhost:3000`
- **Externa:** `http://SEU-IP-DA-VPS:3000`

## 🛡️ Configurar Nginx Reverso (Opcional)

Para usar porta 80 e SSL:

### 1. **Instalar Nginx**
```bash
sudo apt install nginx
```

### 2. **Configurar site**
```bash
sudo nano /etc/nginx/sites-available/fotografos
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. **Ativar site**
```bash
sudo ln -s /etc/nginx/sites-available/fotografos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoramento

### **Comandos úteis**
```bash
# Ver logs em tempo real
docker-compose logs -f

# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Reiniciar aplicação
docker-compose restart

# Parar aplicação
docker-compose down

# Rebuild completo
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### **Logs do sistema**
```bash
# Logs do Docker
sudo journalctl -u docker.service

# Logs do Nginx (se usando)
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
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
# Backup dos dados
docker-compose exec app tar -czf /tmp/backup-$(date +%Y%m%d).tar.gz /usr/share/nginx/html

# Backup da configuração
cp -r . ../backup-$(date +%Y%m%d)/
```

## 🚨 Troubleshooting

### **Aplicação não carrega**
```bash
# 1. Verificar containers
docker-compose ps

# 2. Ver logs
docker-compose logs

# 3. Verificar porta
sudo netstat -tlnp | grep :3000

# 4. Testar conectividade
curl -v http://localhost:3000
```

### **Erro de memória**
```bash
# Verificar recursos
free -h
df -h
docker stats

# Limpar recursos
docker system prune -f
```

### **Erro de permissão**
```bash
# Ajustar permissões
sudo chown -R $USER:$USER .
chmod +x deploy.sh
```

## 📞 Suporte

**Em caso de problemas:**

1. **Verificar logs:** `docker-compose logs -f`
2. **Verificar recursos:** `free -h && df -h`
3. **Reiniciar:** `docker-compose restart`
4. **Rebuild:** `./deploy.sh`

---

## 🎯 Checklist Final

- [ ] Docker e Docker Compose instalados
- [ ] Node.js 18+ instalado
- [ ] Código enviado para VPS
- [ ] `.env.production` configurado com credenciais reais
- [ ] `./deploy.sh` executado com sucesso
- [ ] Aplicação acessível via browser
- [ ] Firewall configurado (se necessário)
- [ ] Nginx reverso configurado (opcional)
- [ ] SSL configurado (opcional)

**🎉 Sua aplicação estará rodando em `http://SEU-IP:3000`**