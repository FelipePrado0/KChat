# KChat - Sistema de Comunicação Interna Corporativa

KChat é uma solução web completa para comunicação interna entre colaboradores de uma mesma empresa, garantindo **segurança**, **isolamento de dados** e **facilidade de uso**. O sistema foi desenvolvido para a empresa Krolik, mas pode ser adaptado para qualquer organização que precise de um chat interno seguro e escalável.

---

## 🚀 Visão Geral

- **Isolamento por empresa:** Usuários só veem mensagens de sua própria empresa.
- **Autenticação JWT:** Segurança robusta com tokens.
- **Frontend moderno:** HTML5, CSS3 (Bootstrap 5) e JavaScript puro.
- **Backend escalável:** Node.js + Express + SQLite (pronto para migração para PostgreSQL/MySQL).
- **Código limpo:** Separação clara de camadas (rotas, controladores, modelos, middlewares, utilitários).
- **Fácil manutenção:** Comentários, validações e estrutura pensada para quem está começando.

---

## 📁 Estrutura do Projeto

```
Krolink/
├── backend/
│   ├── controllers/      # Lógica dos endpoints (auth, chat)
│   ├── db/              # Banco SQLite
│   ├── middleware/      # Middlewares (autenticação, validação)
│   ├── models/          # Modelos de dados (usuário, mensagem)
│   ├── routes/          # Rotas da API
│   ├── utils/           # Utilitários (inicialização do banco)
│   ├── package.json     # Dependências do backend
│   └── server.js        # Servidor principal
├── frontend/
│   ├── css/             # Estilos customizados
│   ├── js/              # Scripts JS (auth, chat, utils)
│   ├── index.html       # Tela de login/cadastro
│   └── chat.html        # Tela do chat
├── README.md            # Este arquivo
└── INSTRUCOES.md        # Guia rápido de uso
```

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** (v14+)
- **Express.js**
- **SQLite3** (pronto para PostgreSQL/MySQL)
- **JWT** (jsonwebtoken)
- **bcryptjs** (hash de senhas)
- **Helmet** (segurança HTTP)
- **CORS** (controle de origem)
- **express-rate-limit** (anti-spam)
- **dotenv** (variáveis de ambiente)

### Frontend
- **HTML5**
- **CSS3** (Bootstrap 5, custom)
- **JavaScript Vanilla**
- **Bootstrap Icons**

---

## ⚙️ Instalação e Execução

### 1. Clone o repositório
```bash
git clone https://github.com/FelipePrado0/Krolink.git
cd Krolink
```

### 2. Instale as dependências do backend
```bash
cd backend
npm install
```

### 3. Inicialize o banco de dados
```bash
npm run init-db
```

### 4. (Opcional) Configure variáveis de ambiente
Crie um arquivo `.env` em `backend/`:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=sua_chave_super_secreta
JWT_EXPIRES_IN=24h
DB_PATH=./db/database.sqlite
BCRYPT_ROUNDS=12
```

### 5. Inicie o servidor
```bash
npm start
```
O backend estará disponível em `http://localhost:3000`

### 6. Acesse o frontend
Abra `frontend/index.html` no navegador (recomendo usar uma extensão como Live Server no VSCode para evitar problemas de CORS).

---

## 🧑‍💻 Como Usar

### Cadastro e Login
1. Acesse a tela inicial (`index.html`).
2. Clique em "Cadastrar" e preencha os dados (nome, email, senha, empresa).
3. Faça login com seu email e senha.

### Chat
1. Após login, clique em "Abrir Chat".
2. Envie mensagens para todos os colaboradores da sua empresa.
3. Veja mensagens anteriores, envie novas, atualize manualmente ou aguarde atualização automática.

### Perfil
- Clique no seu nome no topo para editar nome, email ou senha.

---

## 🔒 Segurança
- **Isolamento por empresa:** Todas as queries de mensagens e usuários são filtradas por `company_id`.
- **Senhas:** Armazenadas com hash bcrypt.
- **JWT:** Todas as rotas privadas exigem token válido.
- **Rate limiting:** Limita requisições para evitar ataques de força bruta.
- **Helmet:** Protege contra ataques comuns de HTTP.
- **CORS:** Permite apenas origens confiáveis.

---

## 📚 Endpoints da API

### Autenticação
- `POST   /api/auth/register` — Cadastro de usuário
- `POST   /api/auth/login` — Login
- `GET    /api/auth/profile` — Perfil do usuário autenticado
- `PUT    /api/auth/profile` — Atualizar perfil
- `POST   /api/auth/logout` — Logout
- `GET    /api/auth/verify` — Verificar validade do token

### Chat
- `POST   /api/chat/messages` — Enviar mensagem
- `GET    /api/chat/messages` — Listar mensagens (com paginação)
- `GET    /api/chat/messages/recent` — Últimas mensagens
- `GET    /api/chat/messages/:id` — Mensagem específica
- `PUT    /api/chat/messages/:id` — Editar mensagem (autor)
- `DELETE /api/chat/messages/:id` — Deletar mensagem (autor)
- `GET    /api/chat/stats` — Estatísticas do chat

---

## 🏗️ Arquitetura e Explicação dos Arquivos

### Backend
- **controllers/**: Funções que recebem as requisições, validam dados e chamam os modelos.
- **models/**: Acesso ao banco de dados (CRUD de usuários e mensagens).
- **middleware/**: Funções intermediárias (ex: autenticação JWT, verificação de empresa).
- **routes/**: Define os endpoints e associa aos controladores.
- **utils/dbInit.js**: Script para criar as tabelas e índices do banco.
- **server.js**: Inicializa o Express, middlewares, rotas e tratamento global de erros.

### Frontend
- **index.html**: Tela de login/cadastro.
- **chat.html**: Tela principal do chat.
- **css/style.css**: Estilos customizados (cores, animações, responsividade).
- **js/utils.js**: Funções utilitárias (API, notificações, loading, validação, storage).
- **js/auth.js**: Lógica de login, cadastro, validação de formulários.
- **js/chat.js**: Lógica do chat, polling, envio/recebimento de mensagens, perfil.

---

## 🖥️ Exemplos de Uso

### Cadastro de Usuário
```json
POST /api/auth/register
{
  "name": "João Silva",
  "email": "joao@krolik.com",
  "password": "Senha123",
  "company_id": 1
}
```

### Envio de Mensagem
```json
POST /api/chat/messages
{
  "content": "Bom dia, equipe!"
}
```

### Resposta de Mensagem
```json
{
  "success": true,
  "data": {
    "message": {
      "id": 12,
      "content": "Bom dia, equipe!",
      "user_id": 3,
      "company_id": 1,
      "created_at": "2024-07-06T14:00:00.000Z",
      "user_name": "João Silva"
    }
  }
}
```

---

## 🐞 Troubleshooting

- **npm start dá erro de package.json:**
  - Certifique-se de estar na pasta `backend` para rodar `npm start`.
- **Erro de CORS:**
  - Use Live Server ou similar para abrir o frontend.
  - Verifique se o backend está rodando em `localhost:3000`.
- **Token expirado:**
  - Faça logout e login novamente.
- **Banco de dados não inicializa:**
  - Rode `npm run init-db` na pasta backend.
- **Conflito de git push:**
  - Faça `git pull origin main`, resolva conflitos, depois `git push`.

---

## 🏢 Dicas de Deploy

- **Variáveis de ambiente:** Nunca suba `.env` para o repositório.
- **Banco de dados:** Para produção, use PostgreSQL ou MySQL.
- **HTTPS:** Sempre use HTTPS em produção.
- **WebSocket:** Para mensagens em tempo real, implemente WebSocket futuramente.
- **Hospedagem:** Pode ser hospedado em Heroku, Vercel (frontend), DigitalOcean, etc.

---

## 🔮 Próximos Passos e Melhorias Futuras
- [ ] WebSocket para chat em tempo real
- [ ] Upload de arquivos e imagens
- [ ] Modo escuro
- [ ] Notificações push
- [ ] Grupos de chat
- [ ] Exportação de conversas
- [ ] PWA (Progressive Web App)
- [ ] Integração com LDAP/AD

---

## 👨‍💻 Para Desenvolvedores
- **Código comentado:** Ideal para quem está aprendendo.
- **Estrutura modular:** Fácil de expandir e manter.
- **Validações em todas as camadas:** Segurança e robustez.
- **Pronto para migração de banco:** Basta trocar o driver e ajustar queries.

---

## 📄 Licença

Projeto desenvolvido para uso interno da empresa Krolik. Adaptável para outras empresas mediante ajustes.

---

**KChat** — Comunicação interna simples, segura e escalável para sua empresa!
