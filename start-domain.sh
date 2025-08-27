#!/bin/bash

echo "🚀 Iniciando proxy para fotografo.site..."

# Matar processo anterior se existir
pkill -f "node domain-proxy.js" 2>/dev/null || true

# Iniciar proxy em background
nohup node domain-proxy.js > domain.log 2>&1 &

echo "✅ Proxy iniciado na porta 8080"
echo "📱 Acesse: http://fotografo.site:8080"
echo "📱 Ou: http://147.93.182.205:8080"
echo "📋 Logs: tail -f domain.log"