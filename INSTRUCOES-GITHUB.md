# 🚀 INSTRUÇÕES GITHUB - VALDIGLEY

## 📋 DEPLOY VIA GITHUB

### **🎯 SEU IP:** 147.93.182.205
### **🎯 SEU DOMÍNIO:** fotografo.site

---

## 🚀 COMANDO ÚNICO

**Execute na sua VPS:**

```bash
curl -fsSL https://raw.githubusercontent.com/valdigley/menu/main/vps-install.sh | sudo bash
```

---

## ✅ RESULTADO

- **URL:** http://147.93.182.205:3000
- **Login:** valdigley2007@gmail.com
- **Configuração:** Só você vê o botão

---

## 🔄 ATUALIZAR

```bash
cd /var/www/menu
git pull
docker-compose up -d --build
```

---

## 🛠️ COMANDOS ÚTEIS

```bash
# Ver logs
docker-compose logs -f

# Status
docker-compose ps

# Reiniciar
docker-compose restart
```

**🎉 Simples assim!**