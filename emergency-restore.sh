#!/bin/bash

# 🆘 RESTAURAÇÃO DE EMERGÊNCIA - VALDIGLEY
# Execute na VPS: bash emergency-restore.sh

set -e

echo "🆘 RESTAURAÇÃO DE EMERGÊNCIA..."

# Matar tudo relacionado à porta 3000
echo "🔪 Matando processos na porta 3000..."
sudo pkill -f :3000 2>/dev/null || true
sudo fuser -k 3000/tcp 2>/dev/null || true
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true

# Parar todos os containers Docker
echo "🛑 Parando todos os containers..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Limpar Docker completamente
echo "🧹 Limpando Docker..."
docker system prune -af --volumes 2>/dev/null || true

# Ir para diretório do projeto
echo "📂 Navegando para projeto..."
cd /var/www/menu

# Reinstalar tudo do zero
echo "🔄 Reinstalando do zero..."
rm -rf node_modules dist 2>/dev/null || true
npm ci --silent
npm run build

# Criar docker-compose.yml simples
echo "📝 Criando configuração Docker simples..."
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
EOF

# Subir aplicação
echo "🚀 Subindo aplicação..."
docker-compose up -d --build

# Aguardar
echo "⏳ Aguardando 30 segundos..."
sleep 30

# Testar
echo "🧪 Testando aplicação..."
if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ SUCESSO! Aplicação funcionando"
    echo "🌐 Acesse: http://fotografo.site"
    echo "🌐 Ou: http://$(curl -s ifconfig.me):3000"
else
    echo "❌ Ainda não funcionou. Tentando porta 8080..."
    
    # Tentar porta 8080
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
EOF
    
    docker-compose down
    docker-compose up -d --build
    sleep 15
    
    if curl -f -s http://localhost:8080 > /dev/null 2>&1; then
        echo "✅ FUNCIONOU na porta 8080!"
        echo "🌐 Acesse: http://$(curl -s ifconfig.me):8080"
    else
        echo "❌ Problema mais sério. Vamos verificar logs:"
        docker-compose logs --tail=20
    fi
fi

echo "🏁 Restauração finalizada!"