# 🚀 DEPLOY VIA GITHUB - VALDIGLEY

**Instruções prontas para usar diretamente do GitHub**

## 📋 PASSO 1: Fazer Push dos Arquivos

**No seu computador local (onde está o código):**
```bash
# Fazer commit e push
git add .
git commit -m "Deploy ready"
git push origin main
```

## 🚀 PASSO 2: Deploy na VPS

**Na sua VPS, execute:**

### **Opção A: Instalador Automático**
```bash
curl -fsSL https://raw.githubusercontent.com/valdigley/menu/main/vps-install.sh | sudo bash
```

### **Opção B: Manual**
```bash
# 1. Instalar pré-requisitos
curl -fsSL https://get.docker.com | sudo sh
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs git

# 2. Clonar projeto
sudo mkdir -p /var/www/menu
cd /var/www/menu
sudo git clone https://github.com/valdigley/menu.git .

# 3. Deploy
sudo chmod +x deploy.sh
sudo ./deploy.sh
```

## ✅ RESULTADO

- **URL:** `http://SEU-IP-DA-VPS:3000`
- **Login:** `valdigley2007@gmail.com`
- **Configuração:** Só você vê o botão

## 🔄 ATUALIZAR

```bash
cd /var/www/menu
sudo git pull origin main
sudo ./deploy.sh
```

**🎉 Pronto para usar!**