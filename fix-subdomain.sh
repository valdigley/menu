#!/bin/bash

# 🔧 CORRIGIR SUBDOMÍNIO CONTRATO.FOTOGRAFO.SITE

echo "🔧 Corrigindo configuração do subdomínio..."

# 1. Criar configuração específica para contrato.fotografo.site
sudo tee /etc/nginx/sites-available/contrato.fotografo.site > /dev/null << 'EOF'
server {
    listen 80;
    server_name contrato.fotografo.site;
    
    location / {
        proxy_pass https://contratos-fotografo.vercel.app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host contratos-fotografo.vercel.app;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Headers para CORS se necessário
        proxy_set_header Origin https://contratos-fotografo.vercel.app;
    }
}
EOF

# 2. Atualizar configuração principal para NÃO capturar subdomínios
sudo tee /etc/nginx/sites-available/fotografo.site > /dev/null << 'EOF'
server {
    listen 80;
    server_name fotografo.site www.fotografo.site;
    # REMOVIDO: *.fotografo.site para não capturar subdomínios
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 3. Ativar configuração do subdomínio
sudo ln -sf /etc/nginx/sites-available/contrato.fotografo.site /etc/nginx/sites-enabled/

# 4. Testar configuração
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração válida"
    
    # 5. Recarregar Nginx
    sudo systemctl reload nginx
    
    # 6. Configurar SSL para o subdomínio
    echo "🔒 Configurando SSL para contrato.fotografo.site..."
    sudo certbot --nginx -d contrato.fotografo.site --non-interactive --agree-tos --email valdigley2007@gmail.com
    
    echo "✅ Configuração concluída!"
    echo ""
    echo "🎯 Agora você tem:"
    echo "   • https://fotografo.site → Menu principal"
    echo "   • https://contrato.fotografo.site → Sistema de contratos"
    echo ""
    echo "🧪 Teste:"
    echo "   curl -I https://contrato.fotografo.site"
    
else
    echo "❌ Erro na configuração do Nginx"
    echo "Execute: sudo nginx -t"
fi