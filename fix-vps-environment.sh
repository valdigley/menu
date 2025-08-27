#!/bin/bash

# Script para corrigir ambiente VPS com comandos ausentes
# Execute como root: bash fix-vps-environment.sh

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

echo -e "${BLUE}🔧 Corrigindo ambiente VPS...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Execute como root: sudo bash fix-vps-environment.sh"
    exit 1
fi

# Install basic utilities first
info "Instalando utilitários básicos essenciais..."
apt update
apt install -y sudo curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release net-tools
log "Utilitários básicos instalados"

# Fix PATH if needed
info "Verificando PATH..."
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
echo 'export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"' >> ~/.bashrc
log "PATH configurado"

# Install Docker if missing
info "Verificando Docker..."
if ! which docker > /dev/null 2>&1; then
    info "Instalando Docker..."
    
    # Remove old versions
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Add Docker's official GPG key
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Add repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start Docker
    systemctl enable docker
    systemctl start docker
    
    log "Docker instalado"
else
    log "Docker já instalado"
fi

# Install Docker Compose if missing
info "Verificando Docker Compose..."
if ! which docker-compose > /dev/null 2>&1; then
    info "Instalando Docker Compose..."
    
    # Try plugin first (newer method)
    if which docker > /dev/null 2>&1 && docker compose version > /dev/null 2>&1; then
        # Create alias for docker-compose
        echo '#!/bin/bash' > /usr/local/bin/docker-compose
        echo 'docker compose "$@"' >> /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        log "Docker Compose (plugin) configurado"
    else
        # Install standalone version
        DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
        curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        log "Docker Compose standalone instalado"
    fi
else
    log "Docker Compose já instalado"
fi

# Install Node.js if missing
info "Verificando Node.js..."
if ! which node > /dev/null 2>&1; then
    info "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    log "Node.js instalado"
else
    log "Node.js já instalado"
fi

# Go to project directory and deploy
info "Navegando para diretório do projeto..."
cd /var/www/menu

# Pull latest changes
info "Baixando atualizações..."
git pull origin main

# Install dependencies
info "Instalando dependências..."
npm ci --silent

# Build application
info "Fazendo build..."
npm run build

# Stop existing containers
info "Parando containers existentes..."
docker-compose down --remove-orphans 2>/dev/null || true

# Start containers
info "Iniciando containers..."
docker-compose up -d --build

# Wait for containers
info "Aguardando containers iniciarem..."
for i in {1..30}; do
    sleep 2
    if docker-compose ps | grep -q "Up"; then
        log "Containers iniciados"
        break
    elif [ $i -eq 30 ]; then
        error "Containers não iniciaram"
        docker-compose logs --tail=20
        exit 1
    fi
done

# Test application
info "Testando aplicação..."
for i in {1..10}; do
    sleep 3
    if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
        log "Aplicação respondendo"
        break
    elif [ $i -eq 10 ]; then
        error "Aplicação não responde"
        docker-compose logs --tail=20
        exit 1
    else
        warn "Tentativa $i/10..."
    fi
done

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")

echo
echo -e "${GREEN}🎉 Ambiente VPS corrigido com sucesso!${NC}"
echo
echo -e "${BLUE}📱 Acesse a aplicação:${NC}"
echo "   • http://$PUBLIC_IP:3000"
echo "   • http://localhost:3000"
echo
echo -e "${BLUE}🛠️  Comandos úteis:${NC}"
echo "   • Ver logs: docker-compose logs -f"
echo "   • Status: docker-compose ps"
echo "   • Reiniciar: docker-compose restart"
echo

log "Correção finalizada!"