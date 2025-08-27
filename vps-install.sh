#!/bin/bash

# VPS Installer for Menu Valdigley
# Usage: curl -fsSL https://raw.githubusercontent.com/valdigley/menu/main/vps-install.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

# Banner
echo -e "${BLUE}"
echo "🚀 =================================="
echo "   INSTALADOR MENU VALDIGLEY VPS"
echo "==================================${NC}"
echo

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Execute como root: sudo bash"
    exit 1
fi

# Update system
info "Atualizando sistema..."
apt update && apt upgrade -y
log "Sistema atualizado"

# Install Docker
info "Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    log "Docker instalado"
else
    log "Docker já instalado"
fi

# Install Docker Compose
info "Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log "Docker Compose instalado"
else
    log "Docker Compose já instalado"
fi

# Install Node.js
info "Instalando Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    log "Node.js instalado"
else
    log "Node.js já instalado"
fi

# Install Git
info "Instalando Git..."
if ! command -v git &> /dev/null; then
    apt-get install -y git
    log "Git instalado"
else
    log "Git já instalado"
fi

# Configure firewall
info "Configurando firewall..."
ufw allow 22/tcp
ufw allow 3000/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
log "Firewall configurado"

# Create project directory
info "Criando diretório do projeto..."
mkdir -p /var/www/menu
cd /var/www/menu

# Clone or update repository
if [ -d ".git" ]; then
    info "Atualizando repositório..."
    git pull origin main
else
    info "Clonando repositório..."
    git clone https://github.com/valdigley/menu.git .
fi
log "Código baixado"

# Create production environment
info "Criando configuração de produção..."
cat > .env.production << 'EOF'
VITE_SUPABASE_URL=https://iisejjtimakkwjrbmzvj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc2VqanRpbWFra3dqcmJtenZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjg1MzEsImV4cCI6MjA2Mjg0NDUzMX0.f14s_dLEep9oq6JNVtpMltQkz_O8MsLXO0K2M1G1qIU
VITE_APP_NAME=Ferramentas para Fotógrafos
NODE_ENV=production
EOF
log "Configuração criada"

# Install dependencies and build
info "Instalando dependências..."
npm ci --silent
log "Dependências instaladas"

info "Fazendo build da aplicação..."
npm run build
log "Build concluído"

# Stop existing containers
info "Parando containers existentes..."
docker-compose down --remove-orphans 2>/dev/null || true

# Start containers
info "Iniciando containers..."
docker-compose up -d --build

# Wait for containers to start
info "Aguardando containers iniciarem..."
sleep 15

# Test application
info "Testando aplicação..."
for i in {1..10}; do
    if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
        log "Aplicação respondendo"
        break
    elif [ $i -eq 10 ]; then
        error "Aplicação não está respondendo"
        echo "Logs dos containers:"
        docker-compose logs --tail=20
        exit 1
    else
        warn "Tentativa $i/10 - Aguardando..."
        sleep 3
    fi
done

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")

# Success message
echo
echo -e "${GREEN}🎉 =================================="
echo "      INSTALAÇÃO CONCLUÍDA!"
echo "====================================${NC}"
echo
echo -e "${BLUE}📱 Acesse a aplicação:${NC}"
echo "   • http://$PUBLIC_IP:3000"
echo "   • http://localhost:3000"
echo
echo -e "${BLUE}🔑 Login:${NC}"
echo "   • Email: valdigley2007@gmail.com"
echo
echo -e "${BLUE}🛠️  Comandos úteis:${NC}"
echo "   • Ver logs: cd /var/www/menu && docker-compose logs -f"
echo "   • Reiniciar: cd /var/www/menu && docker-compose restart"
echo "   • Parar: cd /var/www/menu && docker-compose down"
echo "   • Atualizar: curl -fsSL https://raw.githubusercontent.com/valdigley/menu/main/vps-install.sh | bash"
echo
log "Instalação finalizada!"