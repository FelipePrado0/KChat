# Guia Completo de Desenvolvimento — KChat (Backend + Frontend)

> **Este guia foi feito para ser didático, visual e fácil de entender até para estagiários e iniciantes!**

---

## Visão Geral
O **KChat** é um sistema de chat interno para empresas, composto por:
- **Backend**: Node.js + Express + SQLite (API REST, microserviço, sem autenticação própria)
- **Frontend**: HTML, CSS, JavaScript (puro + Bootstrap), fácil de integrar em qualquer sistema web

O objetivo é permitir conversas em grupo, envio de mensagens, links e arquivos, tudo de forma simples e personalizável.

---

## Estrutura de Pastas
```
Krolink/
  backend/
    controllers/      # Lógica dos endpoints (mensagens, grupos)
    db/               # Banco SQLite e schema
    models/           # Acesso ao banco
    routes/           # Rotas Express
    utils/            # Inicialização do banco
    server.js         # Inicialização do servidor
    ...
  frontend/
    index.html        # Página principal
    css/              # Estilos (style.css)
    js/               # Scripts (main.js, utils.js)
    ...
```

---

## Como Funciona o Fluxo do Sistema
1. **Usuário clica no botão "Chat" na sidebar**
2. Abre um modal com o chat
3. Usuário escolhe ou cria um grupo
4. Usuário envia mensagem, link ou arquivo
5. O frontend faz uma requisição para o backend
6. O backend salva/retorna os dados no banco SQLite
7. O frontend atualiza a tela em tempo real

---

## Backend (Node.js/Express/SQLite)

### server.js
Responsável por:
- Inicializar o Express
- Carregar middlewares (CORS, rate limit, JSON, logging)
- Inicializar o banco
- Registrar rotas
- Servir arquivos de upload

**Exemplo real:**
```js
app.use('/api', conversationRoutes);
app.use('/api/chat', chatRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta: ${PORT}`);
});
```

### controllers/
- **chatController.js**: Toda a lógica de mensagens (enviar, listar, editar, deletar)
- **conversationController.js**: Lógica de grupos (criar, listar, buscar, checar existência)

**Exemplo de função para enviar mensagem:**
```js
async sendMessage(req, res) {
    const { conversation_id, empresa, usuario, mensagem, anexo_link } = req.body;
    // ... validações ...
    const conversationExists = await ConversationModel.exists(conversation_id, empresa);
    if (!conversationExists) return res.status(404).json({ ... });
    const message = await MessageModel.create(
        conversation_id, empresa, usuario, mensagem.trim(), anexo_link || null, anexoArquivo
    );
    res.status(201).json({ success: true, data: message });
}
```

### models/
- **messageModel.js**: Métodos estáticos para manipular mensagens (create, findByConversation, update, delete, etc)
- **conversationModel.js**: Métodos estáticos para grupos (create, findByEmpresa, exists, etc)

**Exemplo de busca de mensagens de um grupo:**
```js
static async findByConversation(conversationId, empresa) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM messages WHERE conversation_id = ? AND empresa = ? AND deletada = 0 ORDER BY hora ASC`;
        db.all(query, [conversationId, empresa], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}
```

### routes/
- **chatRoutes.js**: Endpoints de mensagens
- **conversationRoutes.js**: Endpoints de grupos

**Exemplo de rota:**
```js
router.post('/messages', chatController.uploadMiddleware(), chatController.sendMessage.bind(chatController));
```

### utils/dbInit.js
- Inicializa o banco SQLite a partir do schema
- Garante que o arquivo existe

**Exemplo:**
```js
const dbPath = path.join(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);
```

### db/schema.sql
Define as tabelas:
```sql
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa TEXT NOT NULL,
    nome_grupo TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    empresa TEXT NOT NULL,
    usuario TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    editada BOOLEAN DEFAULT 0,
    deletada BOOLEAN DEFAULT 0,
    anexo_link TEXT,
    anexo_arquivo TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

---

## Frontend (HTML/CSS/JS/Bootstrap)

### index.html
- Estrutura da página principal
- Sidebar com botão de chat
- Modal do chat (abre ao clicar no botão)
- Integração com Bootstrap e FontAwesome

**Trecho real:**
```html
<!-- Botão do Chat -->
<div class="chat-button-container">
    <button class="btn btn-primary chat-button" onclick="openChatModal()">
        <i class="fas fa-comments"></i> Chat
    </button>
</div>
```

### js/main.js
- Gerencia o estado global do chat
- Carrega grupos e mensagens
- Envia mensagens para o backend
- Atualiza a interface

**Exemplo de carregar grupos:**
```js
async function loadGroups() {
    const response = await fetch(`${CONFIG.API_BASE_URL}/conversations/empresa/${CONFIG.EMPRESA}`);
    const data = await response.json();
    if (data.success) {
        appState.groups = data.data;
        populateGroupSelect(data.data);
    }
}
```

### js/utils.js
- Funções auxiliares para requisições, notificações, validação, formatação, etc
- Exemplo: ApiClient, NotificationManager, Validator, Formatter

**Exemplo de requisição GET:**
```js
async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
}
```

### css/style.css
- Estilização moderna e responsiva
- Cores, espaçamentos, botões, modal, mensagens, etc

**Exemplo de customização do botão do chat:**
```css
.chat-button {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(45deg, #ff6b6b, #ee5a24);
    border: none;
    border-radius: 10px;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(255,107,107,0.3);
}
```

---

## Fluxo Completo: Do Clique ao Backend
1. **Usuário clica no botão "Chat"**
2. Função `openChatModal()` abre o modal
3. Função `loadGroups()` busca grupos via API
4. Usuário seleciona grupo → `loadMessages()` busca mensagens
5. Usuário envia mensagem → `handleMessageSubmit()` faz POST para `/api/chat/messages`
6. Backend valida, salva e retorna a mensagem
7. Frontend atualiza a lista de mensagens

---

## Dicas de Customização e Boas Práticas
- **Troque as cores no CSS** para adaptar à identidade visual da sua empresa
- **Altere o nome da empresa/usuário** em `main.js` para testes
- **Adicione validações extras** no frontend para uploads, links, etc
- **Comente o código** sempre que fizer alterações!
- **Use o console do navegador** para debugar JS
- **Leia os exemplos reais deste guia** para entender como cada parte se conecta

---

## Glossário e Dicas para Iniciantes
- **API**: Interface para comunicação entre sistemas (aqui, entre frontend e backend)
- **Endpoint**: URL específica da API para uma ação (ex: `/api/chat/messages`)
- **Modal**: Janela que aparece sobre a tela principal
- **Fetch**: Função JS para fazer requisições HTTP
- **Promise**: Objeto JS para operações assíncronas (ex: requisições)
- **Callback**: Função chamada após outra terminar
- **JSON**: Formato de dados leve, usado para trocar informações entre sistemas
- **SQL**: Linguagem para manipular bancos de dados relacionais

**Dica:**
> Se algo não funcionar, abra o console do navegador (F12) e veja os erros. Leia as mensagens do backend. Teste as rotas com ferramentas como Postman ou Insomnia.

---

## Observações Finais
- O sistema é modular e fácil de adaptar
- Não há autenticação própria (a empresa/usuário vem do frontend)
- Uploads são salvos em `/backend/uploads`
- O código está cheio de exemplos e comentários para facilitar o aprendizado

---

**Se ficou com dúvida, leia novamente este guia, explore os exemplos e não tenha medo de testar!** 