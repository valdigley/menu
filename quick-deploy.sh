#!/bin/bash

# 🚀 DEPLOY RÁPIDO - VALDIGLEY
# Script personalizado para deploy na VPS

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "🚀 =================================="
echo "   DEPLOY MENU VALDIGLEY"
echo "   Repositório: valdigley/menu"
echo "==================================${NC}"
echo

# Função para log
log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"; }

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório do projeto!"
    exit 1
fi

# Verificar pré-requisitos
info "Verificando pré-requisitos..."

if ! command -v docker &> /dev/null; then
    error "Docker não instalado! Execute:"
    echo "curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não instalado!"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    error "Node.js não instalado!"
    exit 1
fi

log "Pré-requisitos OK"

# Verificar configuração
if [ ! -f ".env.production" ]; then
    error "Arquivo .env.production não encontrado!"
    exit 1
fi

if grep -q "seu-projeto" .env.production; then
    error "Configure o .env.production com dados reais!"
    exit 1
fi

log "Configuração OK"

# Mostrar informações
info "Configuração detectada:"
echo "  • Supabase: https://iisejjtimakkwjrbmzvj.supabase.co"
echo "  • Master: valdigley2007@gmail.com"
echo "  • Porta: 3000"
echo

# Instalar dependências
info "Instalando dependências..."
npm ci --silent

# Build
info "Fazendo build..."
npm run build

if [ ! -d "dist" ]; then
    error "Build falhou!"
    exit 1
fi

log "Build concluído"

# Parar containers antigos
info "Parando containers antigos..."
docker-compose down --remove-orphans 2>/dev/null || true

# Limpar recursos
info "Limpando recursos..."
docker system prune -f 2>/dev/null || true

# Subir aplicação
info "Subindo aplicação..."
docker-compose up -d --build

# Aguardar
info "Aguardando containers..."
sleep 15

# Verificar
info "Verificando aplicação..."
for i in {1..10}; do
    if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
        log "Aplicação respondendo!"
        break
    elif [ $i -eq 10 ]; then
        error "Aplicação não responde!"
        echo "Logs:"
        docker-compose logs --tail=20
        exit 1
    else
        warn "Tentativa $i/10..."
        sleep 3
    fi
done

# Sucesso
echo
echo -e "${GREEN}🎉 =================================="
echo "      DEPLOY CONCLUÍDO!"
echo "====================================${NC}"
echo
echo -e "${BLUE}📱 Acesse sua aplicação:${NC}"
echo "   • Local: http://localhost:3000"
echo "   • Externa: http://$(curl -s ifconfig.me):3000"
echo
echo -e "${BLUE}👑 Login Master:${NC}"
echo "   • Email: valdigley2007@gmail.com"
echo "   • Senha: sua-senha"
echo
echo -e "${BLUE}🛠️  Comandos úteis:${NC}"
echo "   • Logs: docker-compose logs -f"
echo "   • Status: docker-compose ps"
echo "   • Parar: docker-compose down"
echo "   • Reiniciar: docker-compose restart"
echo
echo -e "${BLUE}📊 Status atual:${NC}"
docker-compose ps
echo

log "Deploy finalizado com sucesso!"