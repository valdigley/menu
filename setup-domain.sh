#!/bin/bash

# 🌐 CONFIGURAR DOMÍNIO - SCRIPT PERSONALIZADO
# Execute após a instalação básica

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🌐 Configurando domínio...${NC}"

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Execute como root: sudo bash setup-domain.sh${NC}"
    exit 1
fi

# Perguntar o domínio
echo -e "${YELLOW}📝 Digite seu domínio (ex: fotografo.site):${NC}"
read -p "Domínio: " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Domínio não pode estar vazio!${NC}"
    exit 1
fi

echo -e "${BLUE}🌐 Configurando domínio: $DOMAIN${NC}"

# 1. Instalar Nginx
echo -e "${BLUE}📦 Instalando Nginx...${NC}"
apt update
apt install -y nginx

# 2. Instalar Certbot
echo -e "${BLUE}🔒 Instalando Certbot...${NC}"
apt install -y certbot python3-certbot-nginx

# 3. Parar Nginx temporariamente
systemctl stop nginx

# 4. Gerar certificado SSL
echo -e "${BLUE}🔐 Gerando certificado SSL para $DOMAIN...${NC}"
certbot certonly --standalone -d $DOMAIN --agree-tos --no-eff-email --email admin@$DOMAIN --non-interactive

# 5. Configurar Nginx
echo -e "${BLUE}⚙️ Configurando Nginx...${NC}"
cat > /etc/nginx/sites-available/$DOMAIN << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://$DOMAIN\$request_uri;
}

# HTTPS Server
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
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to application
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# 6. Ativar site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 7. Testar configuração
nginx -t

# 8. Iniciar Nginx
systemctl start nginx
systemctl enable nginx

# 9. Configurar renovação automática
echo -e "${BLUE}🔄 Configurando renovação automática...${NC}"
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# 10. Configurar firewall
ufw allow 'Nginx Full'

echo -e "${GREEN}✅ Domínio configurado com sucesso!${NC}"
echo -e "${BLUE}🌐 Acesse: https://$DOMAIN${NC}"
echo -e "${BLUE}🔑 Login: valdigley2007@gmail.com${NC}"
echo
echo -e "${YELLOW}📝 Certifique-se de que o DNS do domínio aponta para este servidor:${NC}"
echo -e "${BLUE}   A record: $DOMAIN -> $(curl -s ifconfig.me)${NC}"