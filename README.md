# KChat - Sistema de Comunicação Interna

O KChat é um sistema web desenvolvido para permitir a comunicação interna entre colaboradores de uma mesma empresa, de forma segura, simples e escalável. O projeto foi desenvolvido especificamente para a empresa Krolik, garantindo isolamento completo entre empresas.

## 🚀 Características

- **Autenticação Segura**: Sistema de login/registro com JWT
- **Isolamento por Empresa**: Usuários só veem mensagens da própria empresa
- **Interface Moderna**: Design responsivo com Bootstrap
- **Chat em Tempo Real**: Atualização automática de mensagens via polling
- **Validações Robustas**: Validação de dados no frontend e backend
- **Estrutura Escalável**: Código organizado para fácil manutenção

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite** - Banco de dados (com suporte para migração futura)
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Helmet** - Segurança
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilos (com Bootstrap 5)
- **JavaScript Vanilla** - Funcionalidades
- **Bootstrap Icons** - Ícones

## 📁 Estrutura do Projeto

```
Krolink/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── chatController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── userModel.js
│   │   └── messageModel.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── chatRoutes.js
│   ├── utils/
│   │   └── dbInit.js
│   ├── db/
│   │   └── database.sqlite
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── utils.js
│   │   ├── auth.js
│   │   └── chat.js
│   ├── index.html
│   └── chat.html
└── README.md
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd Krolink
```

### 2. Instalar dependências do backend
```bash
cd backend
npm install
```

### 3. Inicializar banco de dados
```bash
npm run init-db
```

### 4. Configurar variáveis de ambiente (opcional)
Crie um arquivo `.env` na pasta `backend` com as seguintes variáveis:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRES_IN=24h
DB_PATH=./db/database.sqlite
BCRYPT_ROUNDS=12
```

### 5. Iniciar o servidor
```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

O servidor estará rodando em `http://localhost:3000`

### 6. Acessar o frontend
Abra o arquivo `frontend/index.html` em um servidor web local ou use uma extensão como Live Server no VS Code.

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/profile` - Obter perfil do usuário
- `PUT /api/auth/profile` - Atualizar perfil
- `POST /api/auth/logout` - Fazer logout
- `GET /api/auth/verify` - Verificar token

### Chat
- `POST /api/chat/messages` - Enviar mensagem
- `GET /api/chat/messages` - Buscar mensagens (com paginação)
- `GET /api/chat/messages/recent` - Buscar mensagens recentes
- `GET /api/chat/messages/:id` - Buscar mensagem específica
- `PUT /api/chat/messages/:id` - Atualizar mensagem
- `DELETE /api/chat/messages/:id` - Deletar mensagem
- `GET /api/chat/stats` - Estatísticas do chat

## 🔐 Segurança

- **Isolamento por Empresa**: Todas as consultas são filtradas por `company_id`
- **Autenticação JWT**: Tokens com expiração configurável
- **Hash de Senhas**: Senhas criptografadas com bcrypt
- **Validação de Dados**: Validação tanto no frontend quanto no backend
- **Rate Limiting**: Proteção contra spam
- **CORS**: Configurado para desenvolvimento e produção
- **Helmet**: Headers de segurança

## 🎨 Interface

### Página de Login/Registro (`index.html`)
- Formulários de login e registro
- Validação em tempo real
- Toggle de visibilidade de senha
- Design responsivo

### Página de Chat (`chat.html`)
- Dashboard com estatísticas
- Modal de chat responsivo
- Sistema de notificações
- Gerenciamento de perfil
- Atualização automática de mensagens

## 🔧 Funcionalidades

### Usuários
- ✅ Registro com validação
- ✅ Login com JWT
- ✅ Atualização de perfil
- ✅ Alteração de senha
- ✅ Logout seguro

### Chat
- ✅ Envio de mensagens
- ✅ Visualização em tempo real
- ✅ Histórico de mensagens
- ✅ Estatísticas
- ✅ Isolamento por empresa

### Interface
- ✅ Design responsivo
- ✅ Animações suaves
- ✅ Notificações
- ✅ Loading states
- ✅ Validação de formulários

## 🚀 Como Usar

### 1. Primeiro Acesso
1. Acesse `http://localhost:3000` (ou o servidor local)
2. Clique em "Cadastrar" na página inicial
3. Preencha os dados:
   - Nome completo
   - Email válido
   - Senha (mínimo 6 caracteres)
   - Empresa (Krolik - ID: 1)
4. Clique em "Cadastrar"

### 2. Login
1. Use o email e senha cadastrados
2. Clique em "Entrar"
3. Você será redirecionado para o dashboard

### 3. Usar o Chat
1. No dashboard, clique em "Abrir Chat"
2. Digite sua mensagem no campo de texto
3. Pressione Enter ou clique no botão de enviar
4. As mensagens aparecerão em tempo real

### 4. Gerenciar Perfil
1. Clique no seu nome no canto superior direito
2. Selecione "Perfil"
3. Faça as alterações desejadas
4. Clique em "Salvar"

## 🔄 Desenvolvimento

### Scripts Disponíveis
```bash
# Backend
npm run dev          # Iniciar em modo desenvolvimento
npm start           # Iniciar em modo produção
npm run init-db     # Inicializar banco de dados

# Frontend
# Use um servidor local como Live Server
```

### Estrutura de Código
- **MVC Pattern**: Separação clara entre Model, View e Controller
- **Middleware**: Autenticação e validação
- **Classes ES6**: Código organizado e reutilizável
- **Promises/Async**: Operações assíncronas modernas

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de CORS**
   - Verifique se o frontend está rodando na porta correta
   - Confirme as configurações de CORS no `server.js`

2. **Banco de dados não inicializado**
   - Execute `npm run init-db` na pasta backend

3. **Token expirado**
   - Faça logout e login novamente
   - Verifique a configuração `JWT_EXPIRES_IN`

4. **Mensagens não aparecem**
   - Verifique se está logado
   - Confirme se pertence à empresa correta
   - Verifique o console do navegador para erros

## 🔮 Próximas Funcionalidades

- [ ] WebSocket para mensagens em tempo real
- [ ] Upload de arquivos
- [ ] Emojis e formatação de texto
- [ ] Notificações push
- [ ] Grupos de chat
- [ ] Histórico de mensagens por data
- [ ] Exportação de conversas
- [ ] Modo escuro
- [ ] PWA (Progressive Web App)

## 📝 Licença

Este projeto foi desenvolvido para uso interno da empresa Krolik.

## 👨‍💻 Desenvolvedor

Desenvolvido com foco em simplicidade, segurança e escalabilidade para facilitar a manutenção e futuras expansões.

---

**KChat** - Comunicação interna simples e segura para sua empresa.