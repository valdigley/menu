# 🌐 DEPLOY COM DOMÍNIO - fotografo.site

## 🚀 INSTALAÇÃO COMPLETA

### **1. 📦 Instalar aplicação:**
```bash
curl -fsSL https://raw.githubusercontent.com/valdigley/menu/main/vps-install.sh | sudo bash
```

### **2. 🌐 Configurar domínio:**
```bash
cd /var/www/menu
curl -fsSL https://raw.githubusercontent.com/valdigley/menu/main/setup-domain.sh | sudo bash
```

## ✅ RESULTADO

- **🌐 URL:** https://fotografo.site
- **🔑 Login:** valdigley2007@gmail.com
- **🔒 SSL:** Certificado automático
- **📱 Responsivo:** Funciona em todos os dispositivos

## 🛠️ COMANDOS ÚTEIS

```bash
# Ver logs da aplicação
docker-compose logs -f

# Ver logs do Nginx
sudo tail -f /var/log/nginx/access.log

# Renovar SSL manualmente
sudo certbot renew

# Reiniciar Nginx
sudo systemctl restart nginx

# Status dos serviços
sudo systemctl status nginx
docker-compose ps
```

## 🔄 ATUALIZAR

```bash
cd /var/www/menu
git pull
docker-compose up -d --build
```

---

**🎉 Seu site estará disponível em https://fotografo.site**