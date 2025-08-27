#!/bin/bash

# 🔧 SETUP AUTOMÁTICO VPS - VALDIGLEY
# Instala tudo que precisa na VPS

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "🔧 =================================="
echo "   SETUP VPS AUTOMÁTICO"
echo "   Para: Menu Valdigley"
echo "==================================${NC}"
echo

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"; }

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    warn "Execute como root: sudo $0"
    exit 1
fi

# Atualizar sistema
info "Atualizando sistema..."
apt update && apt upgrade -y
log "Sistema atualizado"

# Instalar Docker
info "Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    log "Docker instalado"
else
    log "Docker já instalado"
fi

# Instalar Docker Compose
info "Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log "Docker Compose instalado"
else
    log "Docker Compose já instalado"
fi

# Instalar Node.js
info "Instalando Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    log "Node.js instalado"
else
    log "Node.js já instalado"
fi

# Instalar Git
info "Instalando Git..."
if ! command -v git &> /dev/null; then
    apt install -y git
    log "Git instalado"
else
    log "Git já instalado"
fi

# Configurar firewall
info "Configurando firewall..."
ufw allow 22/tcp
ufw allow 3000/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log "Firewall configurado"

# Criar diretório do projeto
info "Criando diretório do projeto..."
mkdir -p /var/www/menu
cd /var/www/menu

# Clonar repositório
info "Clonando repositório..."
if [ -d ".git" ]; then
    git pull origin main
    log "Repositório atualizado"
else
    git clone https://github.com/valdigley/menu.git .
    log "Repositório clonado"
fi

# Ajustar permissões
info "Ajustando permissões..."
chown -R $SUDO_USER:$SUDO_USER /var/www/menu 2>/dev/null || true
chmod +x deploy.sh 2>/dev/null || true
chmod +x quick-deploy.sh 2>/dev/null || true

# Verificar instalações
echo
echo -e "${BLUE}📋 Verificação das instalações:${NC}"
echo "  • Docker: $(docker --version)"
echo "  • Docker Compose: $(docker-compose --version)"
echo "  • Node.js: $(node --version)"
echo "  • NPM: $(npm --version)"
echo "  • Git: $(git --version)"
echo

# Mostrar próximos passos
echo -e "${GREEN}🎉 =================================="
echo "      SETUP CONCLUÍDO!"
echo "====================================${NC}"
echo
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo "   1. cd /var/www/menu"
echo "   2. ./quick-deploy.sh"
echo "   3. Acessar: http://$(curl -s ifconfig.me):3000"
echo
echo -e "${BLUE}👑 Login Master:${NC}"
echo "   • Email: valdigley2007@gmail.com"
echo
echo -e "${BLUE}🔥 Deploy rápido:${NC}"
echo "   • ./quick-deploy.sh"
echo

log "Setup finalizado! Execute o deploy agora."