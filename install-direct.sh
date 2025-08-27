#!/bin/bash

# 🚀 INSTALAÇÃO DIRETA NA VPS - VALDIGLEY
# Execute este script diretamente na VPS

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "🚀 =================================="
echo "   INSTALAÇÃO MENU VALDIGLEY"
echo "   Instalação direta na VPS"
echo "==================================${NC}"
echo

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"; }

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    error "Execute como root: sudo bash install-direct.sh"
    exit 1
fi

# 1. Atualizar sistema
info "Atualizando sistema..."
apt update && apt upgrade -y
log "Sistema atualizado"

# 2. Instalar Docker
info "Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    log "Docker instalado"
else
    log "Docker já instalado"
fi

# 3. Instalar Docker Compose
info "Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log "Docker Compose instalado"
else
    log "Docker Compose já instalado"
fi

# 4. Instalar Node.js
info "Instalando Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    log "Node.js instalado"
else
    log "Node.js já instalado"
fi

# 5. Instalar Git
info "Instalando Git..."
if ! command -v git &> /dev/null; then
    apt install -y git curl wget
    log "Git instalado"
else
    log "Git já instalado"
fi

# 6. Configurar firewall
info "Configurando firewall..."
ufw allow 22/tcp
ufw allow 3000/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log "Firewall configurado"

# 7. Criar diretório e clonar projeto
info "Clonando projeto..."
mkdir -p /var/www/menu
cd /var/www/menu

if [ -d ".git" ]; then
    git pull origin main
    log "Projeto atualizado"
else
    git clone https://github.com/valdigley/menu.git .
    log "Projeto clonado"
fi

# 8. Criar arquivo .env.production
info "Criando configuração..."
cat > .env.production << 'EOF'
VITE_SUPABASE_URL=https://iisejjtimakkwjrbmzvj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc2VqanRpbWFra3dqcmJtenZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjg1MzEsImV4cCI6MjA2Mjg0NDUzMX0.f14s_dLEep9oq6JNVtpMltQkz_O8MsLXO0K2M1G1qIU
VITE_APP_NAME=Ferramentas para Fotógrafos
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
EOF
log "Configuração criada"

# 9. Criar docker-compose.yml
info "Criando Docker Compose..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
EOF
log "Docker Compose criado"

# 10. Criar Dockerfile
info "Criando Dockerfile..."
cat > Dockerfile << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production --silent

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção com Nginx
FROM nginx:alpine

# Remover configuração padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expor porta 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
EOF
log "Dockerfile criado"

# 11. Criar nginx.conf
info "Criando configuração Nginx..."
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    sendfile        on;
    keepalive_timeout  65;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF
log "Nginx configurado"

# 12. Criar script de deploy
info "Criando script de deploy..."
cat > deploy-now.sh << 'EOF'
#!/bin/bash

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Fazendo deploy...${NC}"

# Instalar dependências
echo -e "${BLUE}📦 Instalando dependências...${NC}"
npm ci --silent

# Build
echo -e "${BLUE}🔨 Fazendo build...${NC}"
npm run build

# Parar containers antigos
echo -e "${BLUE}🛑 Parando containers antigos...${NC}"
docker-compose down 2>/dev/null || true

# Subir aplicação
echo -e "${BLUE}🚀 Subindo aplicação...${NC}"
docker-compose up -d --build

# Aguardar
echo -e "${BLUE}⏳ Aguardando aplicação...${NC}"
sleep 15

# Testar
echo -e "${BLUE}🧪 Testando aplicação...${NC}"
for i in {1..10}; do
    if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Aplicação funcionando!${NC}"
        break
    elif [ $i -eq 10 ]; then
        echo -e "${RED}❌ Aplicação não responde!${NC}"
        docker-compose logs --tail=20
        exit 1
    else
        echo -e "${BLUE}⏳ Tentativa $i/10...${NC}"
        sleep 3
    fi
done

echo -e "${GREEN}🎉 Deploy concluído!${NC}"
echo -e "${BLUE}📱 Acesse: http://$(curl -s ifconfig.me):3000${NC}"
echo -e "${BLUE}👑 Login: valdigley2007@gmail.com${NC}"
EOF

chmod +x deploy-now.sh
log "Script de deploy criado"

# 13. Ajustar permissões
info "Ajustando permissões..."
chown -R $SUDO_USER:$SUDO_USER /var/www/menu 2>/dev/null || true

# Verificar instalações
echo
echo -e "${BLUE}📋 Verificação:${NC}"
echo "  • Docker: $(docker --version)"
echo "  • Docker Compose: $(docker-compose --version)"
echo "  • Node.js: $(node --version)"
echo "  • Git: $(git --version)"
echo

# Sucesso
echo -e "${GREEN}🎉 =================================="
echo "      INSTALAÇÃO CONCLUÍDA!"
echo "====================================${NC}"
echo
echo -e "${BLUE}🚀 Para fazer deploy agora:${NC}"
echo "   cd /var/www/menu"
echo "   ./deploy-now.sh"
echo
echo -e "${BLUE}📱 Depois acesse:${NC}"
echo "   http://$(curl -s ifconfig.me):3000"
echo
echo -e "${BLUE}👑 Login Master:${NC}"
echo "   valdigley2007@gmail.com"
echo

log "Tudo pronto! Execute o deploy agora."