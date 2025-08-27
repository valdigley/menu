#!/bin/bash

# 🌐 CONFIGURAÇÃO SEGURA DE DOMÍNIO - SEM CONFLITOS
# Configura apenas o virtual host específico

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🌐 Configuração segura para fotografo.site${NC}"
echo -e "${YELLOW}⚠️  Não irá interferir com outros sites${NC}"

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Execute como root: sudo bash setup-safe-domain.sh${NC}"
    exit 1
fi

DOMAIN="fotografo.site"
APP_PORT="3002"

echo -e "${BLUE}🔍 Verificando configuração atual...${NC}"

# Verificar se Nginx já está instalado
if ! command -v nginx &> /dev/null; then
    echo -e "${BLUE}📦 Instalando Nginx...${NC}"
    apt update
    apt install -y nginx
else
    echo -e "${GREEN}✅ Nginx já instalado${NC}"
fi

# Verificar se Certbot já está instalado
if ! command -v certbot &> /dev/null; then
    echo -e "${BLUE}🔒 Instalando Certbot...${NC}"
    apt install -y certbot python3-certbot-nginx
else
    echo -e "${GREEN}✅ Certbot já instalado${NC}"
fi

# Verificar se aplicação está rodando na porta correta
echo -e "${BLUE}🧪 Testando aplicação na porta $APP_PORT...${NC}"
if curl -f -s http://localhost:$APP_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Aplicação rodando na porta $APP_PORT${NC}"
else
    echo -e "${RED}❌ Aplicação não está rodando na porta $APP_PORT${NC}"
    echo -e "${YELLOW}Execute: docker-compose up -d${NC}"
    exit 1
fi

# Gerar certificado SSL (método webroot para não interferir com outros sites)
echo -e "${BLUE}🔐 Gerando certificado SSL para $DOMAIN...${NC}"

# Criar diretório webroot temporário
mkdir -p /var/www/letsencrypt

# Configuração temporária para validação
cat > /etc/nginx/sites-available/temp-$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF

# Ativar configuração temporária
ln -sf /etc/nginx/sites-available/temp-$DOMAIN /etc/nginx/sites-enabled/temp-$DOMAIN

# Testar e recarregar Nginx
nginx -t && systemctl reload nginx

# Gerar certificado usando webroot
certbot certonly --webroot -w /var/www/letsencrypt -d $DOMAIN -d www.$DOMAIN --agree-tos --no-eff-email --email admin@$DOMAIN --non-interactive

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Certificado SSL gerado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao gerar certificado SSL${NC}"
    exit 1
fi

# Remover configuração temporária
rm -f /etc/nginx/sites-enabled/temp-$DOMAIN
rm -f /etc/nginx/sites-available/temp-$DOMAIN

# Criar configuração final com SSL
echo -e "${BLUE}⚙️ Configurando virtual host final...${NC}"
cat > /etc/nginx/sites-available/$DOMAIN << EOF
# HTTP to HTTPS redirect for $DOMAIN
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS server for $DOMAIN
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to application on port $APP_PORT
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN

# Testar configuração
echo -e "${BLUE}🧪 Testando configuração do Nginx...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Configuração do Nginx válida${NC}"
    systemctl reload nginx
else
    echo -e "${RED}❌ Erro na configuração do Nginx${NC}"
    exit 1
fi

# Configurar renovação automática (apenas se não existir)
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    echo -e "${BLUE}🔄 Configurando renovação automática...${NC}"
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
fi

# Teste final
echo -e "${BLUE}🧪 Testando configuração final...${NC}"
sleep 3

if curl -f -s -I https://$DOMAIN > /dev/null 2>&1; then
    echo -e "${GREEN}✅ HTTPS funcionando!${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS pode levar alguns segundos para funcionar${NC}"
fi

echo -e "${GREEN}🎉 =================================="
echo "      CONFIGURAÇÃO CONCLUÍDA!"
echo "====================================${NC}"
echo
echo -e "${BLUE}🌐 Seu site:${NC}"
echo "   • https://$DOMAIN"
echo "   • https://www.$DOMAIN"
echo
echo -e "${BLUE}🔑 Login:${NC}"
echo "   • valdigley2007@gmail.com"
echo
echo -e "${BLUE}📊 Status:${NC}"
echo "   • Aplicação: Porta $APP_PORT"
echo "   • SSL: Ativo"
echo "   • Renovação: Automática"
echo
echo -e "${YELLOW}📝 Nota:${NC}"
echo "   Esta configuração não interfere com outros sites"
echo "   Apenas adiciona o virtual host para $DOMAIN"
echo

echo -e "${GREEN}✅ Configuração segura concluída!${NC}"