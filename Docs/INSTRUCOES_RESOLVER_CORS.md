# Como Resolver Problemas de CORS no KChat

Este guia rápido ensina como identificar e corrigir erros de CORS (Cross-Origin Resource Sharing) no seu projeto KChat.

---

## 1. Entenda o Erro de CORS
- O erro de CORS geralmente aparece no console do navegador como:
  - `No 'Access-Control-Allow-Origin' header is present on the requested resource.`
  - `Access to XMLHttpRequest at ... has been blocked by CORS policy`
  - `net::ERR_FAILED 404 (Not Found)`

---

## 2. Verifique a Porta e o Endereço do Backend
- **O erro de CORS pode ser causado por o frontend tentar acessar a porta errada!**
- Descubra em qual porta o backend está rodando (exemplo: 3008, 3333, etc).
- O endereço do backend deve ser igual no frontend e backend (use sempre `localhost` ou sempre `127.0.0.1`).

---

## 3. Ajuste o Endereço do Socket.io no Frontend
- No arquivo `frontend/index.html` e/ou `frontend/js/main.js`, procure por:
  ```js
  const socket = io('http://localhost:3008'); // Ajuste a porta conforme seu backend
  ```
- **A porta deve ser a mesma do backend!**
- Se mudar a porta do backend, ajuste aqui também.

---

## 4. Garanta a Configuração de CORS no Backend
- No topo do seu backend (`backend/server.js` e `backend/whatsapp_test/wa_api.js`):
  ```js
  const cors = require('cors');
  app.use(cors({
    origin: '*', // Em produção, troque para o domínio do frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }));
  ```
- No Socket.io:
  ```js
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  ```

---

## 5. Dicas Extras
- Use sempre o mesmo endereço base (`localhost` ou `127.0.0.1`) em ambos frontend e backend.
- Se mudar a porta do backend, ajuste no frontend.
- Limpe o cache do navegador ou teste em aba anônima.
- Se o erro persistir, confira se o backend está realmente rodando na porta esperada.

---

## 6. Checklist Rápido
- [ ] Backend rodando na porta correta?
- [ ] Frontend aponta para a mesma porta?
- [ ] Endereço base igual nos dois lados?
- [ ] CORS configurado no backend e no Socket.io?
- [ ] Cache do navegador limpo?

---

Se seguir esses passos, você resolve 99% dos problemas de CORS no KChat! 