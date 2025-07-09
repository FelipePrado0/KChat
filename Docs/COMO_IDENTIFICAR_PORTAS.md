# Como Identificar as Portas do Frontend e Backend

## Backend (Node.js)
1. Abra o terminal onde você inicia o backend.
2. Ao rodar o comando (`node backend/server.js` ou `npm start`), observe a mensagem:
   - Exemplo: `Servidor rodando na porta: 3000`
3. Se quiser conferir no código, abra `backend/config.js` e veja:
   ```js
   port: process.env.PORT || 3000
   ```
   - O valor padrão é 3000, a não ser que você defina a variável de ambiente `PORT`.

## Backend WhatsApp (separado)
1. Se usar o microserviço WhatsApp, veja em `backend/whatsapp_test/wa_api.js`:
   ```js
   const PORT = 3333;
   ```
   - O padrão é 3333.

## Frontend
1. Se for um projeto estático (HTML), normalmente você abre o arquivo direto no navegador ou usa um servidor local (ex: Live Server, http-server, etc).
2. Se usar React, Vue ou outro framework, normalmente roda em `localhost:3000` por padrão.
3. Para saber a porta, veja a barra de endereços do navegador:
   - Exemplo: `http://localhost:3000` (porta 3000)

## Dica
- Sempre use a mesma base (`localhost` ou `127.0.0.1`) e ajuste as portas conforme o backend.
- Se mudar a porta do backend, ajuste no frontend também! 