#!/bin/bash

# Script de deploy para VPS
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando deploy na VPS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado!"
    exit 1
fi

# Verificar se arquivo .env existe
if [ ! -f .env.production ]; then
    warn "Arquivo .env.production não encontrado!"
    warn "Criando arquivo de exemplo..."
    cp .env.production.example .env.production 2>/dev/null || true
    error "Configure o arquivo .env.production com suas credenciais do Supabase"
    exit 1
fi

# Build da aplicação
log "📦 Fazendo build da aplicação..."
npm run build

# Parar containers existentes
log "🛑 Parando containers existentes..."
docker-compose down --remove-orphans || true

# Remover imagens antigas
log "🧹 Limpando imagens antigas..."
docker image prune -f || true

# Build e start dos containers
log "🔨 Construindo e iniciando containers..."
docker-compose up -d --build

# Verificar se containers estão rodando
log "✅ Verificando status dos containers..."
docker-compose ps

# Aguardar alguns segundos
sleep 5

# Testar se aplicação está respondendo
log "🔍 Testando aplicação..."
if curl -f http://localhost:80 > /dev/null 2>&1; then
    log "✅ Aplicação está rodando em http://localhost"
else
    error "❌ Aplicação não está respondendo"
    log "📋 Logs do container:"
    docker-compose logs --tail=20
    exit 1
fi

log "🎉 Deploy concluído com sucesso!"
log "📱 Aplicação disponível em: http://seu-servidor"
log "📊 Para ver logs: docker-compose logs -f"
log "🛑 Para parar: docker-compose down"