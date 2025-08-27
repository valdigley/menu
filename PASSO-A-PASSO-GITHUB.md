# 📋 PASSO A PASSO - PUSH PARA GITHUB

## 🎯 INSTRUÇÕES PARA VALDIGLEY

### **📍 PASSO 1: Abrir Terminal**
- Abra o terminal/prompt de comando
- Navegue até a pasta do projeto

### **📍 PASSO 2: Verificar Git**
```bash
# Verificar se Git está instalado
git --version

# Se não estiver instalado:
# Windows: Baixar em https://git-scm.com/
# Mac: brew install git
# Linux: sudo apt install git
```

### **📍 PASSO 3: Configurar Git (se primeira vez)**
```bash
git config --global user.name "Valdigley"
git config --global user.email "valdigley2007@gmail.com"
```

### **📍 PASSO 4: Inicializar Repositório**
```bash
# Se ainda não é um repositório Git
git init

# Adicionar origem remota (substitua pelo seu repositório)
git remote add origin https://github.com/valdigley/menu.git
```

### **📍 PASSO 5: Adicionar Arquivos**
```bash
# Adicionar todos os arquivos
git add .

# Verificar o que será commitado
git status
```

### **📍 PASSO 6: Fazer Commit**
```bash
git commit -m "Deploy menu fotografo.site com dominio"
```

### **📍 PASSO 7: Fazer Push**
```bash
# Primeira vez (criar branch main)
git branch -M main
git push -u origin main

# Ou se já existe
git push origin main
```

### **📍 PASSO 8: Verificar no GitHub**
- Acesse: https://github.com/valdigley/menu
- Verifique se os arquivos estão lá
- Procure pelo arquivo `vps-install.sh`

---

## 🚀 DEPOIS DO PUSH, EXECUTE NA VPS:

### **🌐 Para domínio completo:**
```bash
ssh root@147.93.182.205

# Instalar aplicação
curl -fsSL https://raw.githubusercontent.com/valdigley/menu/main/vps-install.sh | sudo bash

# Configurar domínio
cd /var/www/menu
curl -fsSL https://raw.githubusercontent.com/valdigley/menu/main/setup-domain.sh | sudo bash
```

### **✅ RESULTADO:**
- **URL:** https://fotografo.site
- **Login:** valdigley2007@gmail.com

---

## 🆘 SE DER ERRO:

### **Erro de autenticação:**
```bash
# Usar token pessoal do GitHub
git remote set-url origin https://SEU-TOKEN@github.com/valdigley/menu.git
```

### **Repositório não existe:**
1. Criar repositório no GitHub: https://github.com/new
2. Nome: `menu`
3. Público
4. Não inicializar com README

### **Conflitos:**
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

---

**🎯 RESUMO DOS COMANDOS:**
```bash
git add .
git commit -m "Deploy menu fotografo.site"
git push origin main
```