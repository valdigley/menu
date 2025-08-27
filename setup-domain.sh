#!/bin/bash

# 🌐 CONFIGURAR DOMÍNIO fotografo.site
# Execute após a instalação básica

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🌐 Configurando domínio fotografo.site...${NC}"

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Execute como root: sudo bash setup-domain.sh${NC}"
    exit 1
fi

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
echo -e "${BLUE}🔐 Gerando certificado SSL...${NC}"
certbot certonly --standalone -d fotografo.site -d www.fotografo.site --agree-tos --no-eff-email --email valdigley2007@gmail.com

# 5. Configurar Nginx
echo -e "${BLUE}⚙️ Configurando Nginx...${NC}"
cp nginx-domain.conf /etc/nginx/nginx.conf

# 6. Testar configuração
nginx -t

# 7. Iniciar Nginx
systemctl start nginx
systemctl enable nginx

# 8. Configurar renovação automática
echo -e "${BLUE}🔄 Configurando renovação automática...${NC}"
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo -e "${GREEN}✅ Domínio configurado com sucesso!${NC}"
echo -e "${BLUE}🌐 Acesse: https://fotografo.site${NC}"
echo -e "${BLUE}🔑 Login: valdigley2007@gmail.com${NC}"