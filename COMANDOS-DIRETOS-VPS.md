# 🚀 COMANDOS DIRETOS NA VPS - VALDIGLEY

**Você já está logado na VPS! Execute estes comandos:**

## 📋 COMANDO ÚNICO

```bash
curl -fsSL https://raw.githubusercontent.com/valdigley/menu/main/vps-install.sh | bash
```

## ✅ AGUARDE O PROCESSO

O instalador vai:
- ✅ Instalar Docker
- ✅ Instalar Node.js  
- ✅ Clonar o projeto
- ✅ Fazer build
- ✅ Subir a aplicação

**⏱️ Tempo estimado: 3-5 minutos**

## 📱 RESULTADO ESPERADO

```
🎉 ==================================
      INSTALAÇÃO CONCLUÍDA!
====================================

📱 Acesse sua aplicação:
   • URL: http://147.93.182.205:3000
   • Login: valdigley2007@gmail.com

🛠️  Comandos úteis:
   • Ver logs: docker-compose logs -f
   • Status: docker-compose ps
   • Reiniciar: docker-compose restart

🎯 Acesse: http://147.93.182.205:3000
```

## 🌐 PARA CONFIGURAR DOMÍNIO (OPCIONAL)

Depois que a aplicação estiver funcionando:

```bash
cd /var/www/menu
curl -fsSL https://raw.githubusercontent.com/valdigley/menu/main/setup-domain.sh | bash
```

**Resultado:** https://fotografo.site

## 🆘 SE DER ERRO

```bash
# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Status
docker-compose ps
```

---

**🚀 EXECUTE AGORA: `curl -fsSL https://raw.githubusercontent.com/valdigley/menu/main/vps-install.sh | bash`**