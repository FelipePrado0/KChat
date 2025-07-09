# 🚀 Deploy no Render - KChat

## 📋 Pré-requisitos

- Conta no GitHub/GitLab com o repositório do KChat
- Conta no Render (https://render.com)

## 🔧 Configuração Manual

### 1. Conectar Repositório

1. Acesse https://render.com
2. Faça login com GitHub/GitLab
3. Clique em "New +" → "Web Service"
4. Conecte seu repositório KChat

### 2. Configurações do Web Service

```
📁 Repository: Seu repositório KChat
🏷️ Name: kchat-backend
🌍 Environment: Node
🔄 Branch: main
📂 Root Directory: / (deixe vazio)
```

### 3. Build & Deploy Settings

```
🔨 Build Command: npm run build
🚀 Start Command: npm start
💻 Runtime: Node
📦 Instance Type: Free
```

### 4. Environment Variables

Adicione estas variáveis:

```
NODE_ENV=production
PORT=3000
```

### 5. Health Check

```
Path: /api/health
```

### 6. Auto-Deploy

✅ Enable auto-deploy from main branch

## 🔄 Deploy Automático (render.yaml)

Se você tem o arquivo `render.yaml` no repositório:

1. No Render, selecione "Blueprint"
2. Conecte o repositório
3. O Render vai detectar automaticamente as configurações

## 📊 Monitoramento

### Health Check
- URL: `https://seu-app.onrender.com/api/health`
- Deve retornar: `{"success": true, "message": "KChat API está funcionando!"}`

### Logs
- Acesse o dashboard do Render
- Vá em "Logs" para ver os logs em tempo real

## 🔧 Troubleshooting

### Erro: "invalid ELF header"
- **Causa:** `node_modules` compilado no Windows
- **Solução:** Remover `node_modules` do Git e deixar o Render compilar

### Erro: "Cannot find module"
- **Causa:** Dependências não instaladas
- **Solução:** Verificar se `package.json` está correto

### Erro: "Port already in use"
- **Causa:** Porta 3000 ocupada
- **Solução:** Usar `process.env.PORT` (já configurado)

## 🌐 URLs Importantes

- **API:** `https://seu-app.onrender.com`
- **Health Check:** `https://seu-app.onrender.com/api/health`
- **Frontend:** Configure para apontar para a URL da API

## 📝 Notas Importantes

1. **WhatsApp:** O QR Code será gerado no primeiro acesso
2. **Banco de Dados:** SQLite será criado automaticamente
3. **Uploads:** Arquivos são temporários (Free plan)
4. **SSL:** Automático no Render

## 🔄 Atualizações

Para atualizar:
1. Faça push para `main`
2. O Render vai fazer deploy automático
3. Aguarde 2-3 minutos para completar

## 💰 Custos

- **Free Plan:** $0/mês
- **Limitações:** 
  - 750 horas/mês
  - Sleep após 15 min inativo
  - 512MB RAM
  - Uploads temporários 