#!/bin/bash

# 🔄 ATUALIZAÇÃO SIMPLES DO GITHUB - SEM COMPLICAÇÃO
# Execute na sua VPS: bash update-simple.sh

set -e

echo "🔄 Atualizando do GitHub..."

# Ir para diretório do projeto (tentar vários locais possíveis)
if [ -d "/var/www/menu" ]; then
    cd /var/www/menu
elif [ -d "/root/menu" ]; then
    cd /root/menu
elif [ -d "menu" ]; then
    cd menu
else
    echo "❌ Diretório do projeto não encontrado!"
    echo "Execute: git clone https://github.com/valdigley/menu.git"
    exit 1
fi

echo "📂 Diretório atual: $(pwd)"

# Baixar atualizações
echo "📥 Baixando atualizações..."
git pull origin main

# Reinstalar dependências se necessário
if [ -f "package.json" ]; then
    echo "📦 Atualizando dependências..."
    npm ci --silent
fi

# Rebuild se necessário
if [ -f "package.json" ]; then
    echo "🔨 Fazendo build..."
    npm run build
fi

# Reiniciar containers se Docker estiver disponível
if command -v docker-compose >/dev/null 2>&1; then
    echo "🐳 Reiniciando containers..."
    docker-compose down 2>/dev/null || true
    docker-compose up -d --build
    echo "⏳ Aguardando containers..."
    sleep 10
    docker-compose ps
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    echo "🐳 Reiniciando containers (plugin)..."
    docker compose down 2>/dev/null || true
    docker compose up -d --build
    echo "⏳ Aguardando containers..."
    sleep 10
    docker compose ps
else
    echo "⚠️ Docker não encontrado, apenas código atualizado"
fi

echo "✅ Atualização concluída!"
echo "🌐 Teste: http://fotografo.site"