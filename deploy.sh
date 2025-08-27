#!/bin/bash

# Script de deploy otimizado para VPS - Fixed for minimal systems
# Uso: ./deploy.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
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
echo "   DEPLOY FERRAMENTAS FOTÓGRAFOS"
echo "==================================${NC}"
echo

# Verificar pré-requisitos
info "Verificando pré-requisitos..."

if ! which docker > /dev/null 2>&1; then
    error "Docker não está instalado!"
    echo "Instale com: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! which docker-compose > /dev/null 2>&1; then
    error "Docker Compose não está instalado!"
    echo "Tentando usar docker compose plugin..."
    if which docker > /dev/null 2>&1 && docker compose version > /dev/null 2>&1; then
        # Create alias for docker-compose
        echo '#!/bin/bash' > /usr/local/bin/docker-compose
        echo 'docker compose "$@"' >> /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        log "Docker Compose plugin configurado"
    else
        exit 1
    fi
    exit 1
fi

if ! which npm > /dev/null 2>&1; then
    error "Node.js/NPM não está instalado!"
    exit 1
fi

log "Pré-requisitos OK"

# Verificar arquivo .env
if [ ! -f .env.production ]; then
    warn "Arquivo .env.production não encontrado!"
    error "Configure suas credenciais do Supabase no arquivo .env.production"
    exit 1
fi

# Verificar se as variáveis estão configuradas
if grep -q "seu-projeto.supabase.co" .env.production; then
    warn "Configure suas credenciais reais do Supabase no .env.production"
    exit 1
fi

log "Configurações OK"

# Instalar dependências
info "Instalando dependências..."
npm ci --silent

# Build da aplicação
info "Fazendo build da aplicação..."
npm run build

if [ ! -d "dist" ]; then
    error "Build falhou - diretório dist não encontrado"
    exit 1
fi

log "Build concluído"

# Parar containers existentes
info "Parando containers existentes..."
docker-compose down --remove-orphans 2>/dev/null || true

# Limpar recursos antigos
info "Limpando recursos antigos..."
docker system prune -f --volumes 2>/dev/null || true

# Build e start dos containers
info "Construindo e iniciando containers..."
docker-compose up -d --build

# Aguardar containers iniciarem
info "Aguardando containers iniciarem..."
for i in {1..10}; do
    sleep 1
    if docker-compose ps | grep -q "Up"; then
        break
    fi
done

# Verificar se containers estão rodando
info "Verificando status dos containers..."
if ! docker-compose ps | grep -q "Up"; then
    error "Containers não estão rodando!"
    echo "Logs dos containers:"
    docker-compose logs --tail=20
    exit 1
fi

log "Containers rodando"

# Testar aplicação
info "Testando aplicação..."
for i in {1..5}; do
    sleep 5
    if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
        log "Aplicação respondendo"
        break
    elif curl -f -s http://localhost:3000 > /dev/null 2>&1; then
        log "Aplicação respondendo"
        break
    elif [ $i -eq 5 ]; then
        error "Aplicação não está respondendo após 5 tentativas"
        echo "Logs da aplicação:"
        docker-compose logs --tail=30
        exit 1
    else
        warn "Tentativa $i/5 - Aguardando aplicação..."
    fi
done

# Informações finais
echo
echo -e "${GREEN}🎉 =================================="
echo "      DEPLOY CONCLUÍDO COM SUCESSO!"
echo "====================================${NC}"
echo
echo -e "${BLUE}📱 Aplicação disponível em:${NC}"
echo "   • Local: http://localhost:3000"
echo "   • Rede: http://$(hostname -I | awk '{print $1}'):3000"
echo
echo -e "${BLUE}🛠️  Comandos úteis:${NC}"
echo "   • Ver logs: docker-compose logs -f"
echo "   • Parar: docker-compose down"
echo "   • Reiniciar: docker-compose restart"
echo "   • Status: docker-compose ps"
echo
echo -e "${BLUE}📊 Status dos containers:${NC}"
docker-compose ps
echo

log "Deploy finalizado!"