#!/bin/bash

# 🚀 INSTALAÇÃO AUTOMÁTICA - MENU VALDIGLEY
# Execute: curl -fsSL https://raw.githubusercontent.com/valdigley/menu/main/vps-install.sh | sudo bash

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
echo "   Domínio: fotografo.site"
echo "==================================${NC}"
echo

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"; }

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    error "Execute como root: sudo bash vps-install.sh"
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
    apt-get install -y nodejs git curl wget
    log "Node.js instalado"
else
    log "Node.js já instalado"
fi

# 5. Configurar firewall
info "Configurando firewall..."
ufw allow 22/tcp
ufw allow 3000/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log "Firewall configurado"

# 6. Clonar projeto
info "Clonando projeto do GitHub..."
mkdir -p /var/www/menu
cd /var/www/menu

if [ -d ".git" ]; then
    git pull origin main
    log "Projeto atualizado"
else
    git clone https://github.com/valdigley/menu.git .
    log "Projeto clonado"
fi

# 7. Criar configuração
info "Criando configuração..."
cat > .env.production << 'EOF'
VITE_SUPABASE_URL=https://iisejjtimakkwjrbmzvj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc2VqanRpbWFra3dqcmJtenZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjg1MzEsImV4cCI6MjA2Mjg0NDUzMX0.f14s_dLEep9oq6JNVtpMltQkz_O8MsLXO0K2M1G1qIU
VITE_APP_NAME=Ferramentas para Fotógrafos
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
EOF
log "Configuração criada"

# 8. Ajustar permissões
info "Ajustando permissões..."
chown -R $SUDO_USER:$SUDO_USER /var/www/menu 2>/dev/null || true
chmod +x deploy.sh 2>/dev/null || true

# 9. Instalar dependências
info "Instalando dependências..."
npm ci --silent

# 10. Build da aplicação
info "Fazendo build..."
npm run build

if [ ! -d "dist" ]; then
    error "Build falhou!"
    exit 1
fi

log "Build concluído"

# 11. Parar containers antigos
info "Parando containers antigos..."
docker-compose down --remove-orphans 2>/dev/null || true

# 12. Limpar recursos
info "Limpando recursos..."
docker system prune -f 2>/dev/null || true

# 13. Subir aplicação
info "Subindo aplicação..."
docker-compose up -d --build

# 14. Aguardar containers
info "Aguardando containers iniciarem..."
sleep 15

# 15. Verificar aplicação
info "Verificando aplicação..."
for i in {1..10}; do
    if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
        log "Aplicação funcionando!"
        break
    elif [ $i -eq 10 ]; then
        error "Aplicação não responde!"
        echo "Logs dos containers:"
        docker-compose logs --tail=20
        exit 1
    else
        warn "Tentativa $i/10..."
        sleep 3
    fi
done

# Verificar instalações
echo
echo -e "${BLUE}📋 Verificação das instalações:${NC}"
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
echo -e "${BLUE}📱 Acesse sua aplicação:${NC}"
echo "   • URL: http://147.93.182.205:3000"
echo "   • Login: valdigley2007@gmail.com"
echo
echo -e "${BLUE}🛠️  Comandos úteis:${NC}"
echo "   • Ver logs: docker-compose logs -f"
echo "   • Status: docker-compose ps"
echo "   • Reiniciar: docker-compose restart"
echo "   • Parar: docker-compose down"
echo
echo -e "${BLUE}📊 Status atual:${NC}"
docker-compose ps
echo

log "Deploy finalizado com sucesso!"
echo -e "${GREEN}🎯 Acesse: http://147.93.182.205:3000${NC}"