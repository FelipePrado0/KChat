# KChat - Sistema de Comunicação Interna da Krolik

Sistema de chat interno para comunicação entre colaboradores da empresa Krolik, desenvolvido como microserviço independente.

## 🚀 Características

- **Chat em tempo real** com grupos de conversa
- **Upload de arquivos** (imagens, documentos, PDFs)
- **Links externos** como anexos
- **Interface moderna** com modal integrado
- **Isolamento por empresa** para segurança
- **Backend microserviço** independente
- **Sem autenticação** - integração com plataforma principal

## 📋 Pré-requisitos

- Node.js 14+ 
- npm ou yarn
- Navegador moderno

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd Krolink
```

### 2. Instale as dependências do backend
```bash
cd backend
npm install
```

### 3. Configure o ambiente (opcional)
Crie um arquivo `.env` na pasta `backend`:
```env
PORT=3008
NODE_ENV=development
```

### 4. Inicialize o banco de dados
```bash
npm run init-db
```

### 5. Inicie o servidor
```bash
npm start
```

O backend estará rodando em `http://localhost:3008`

## 🎯 Como Usar

### Frontend
1. Abra o arquivo `frontend/index.html` em um servidor web
2. Use um servidor local como Live Server (VS Code) ou Python:
   ```bash
   # Python 3
   python -m http.server 3000
   
   # Python 2
   python -m SimpleHTTPServer 3000
   ```

### Funcionalidades

#### Chat Modal
- Clique no botão **"Chat"** na sidebar
- Selecione um grupo existente ou crie um novo
- Envie mensagens de texto
- Adicione links externos
- Faça upload de arquivos (máx. 10MB)

#### Grupos
- Crie grupos para organizar conversas
- Cada grupo é isolado por empresa
- Nomes de grupos são únicos por empresa

#### Mensagens
- Suporte a texto simples
- Links externos como anexos
- Upload de arquivos (imagens, docs, PDFs)
- Indicador de mensagens editadas
- Timestamps em tempo real

## 📁 Estrutura do Projeto

```
Krolink/
├── backend/
│   ├── controllers/
│   │   ├── chatController.js      # Controlador de mensagens
│   │   └── conversationController.js # Controlador de grupos
│   ├── db/
│   │   ├── database.sqlite        # Banco SQLite
│   │   └── schema.sql            # Schema do banco
│   ├── models/
│   │   ├── messageModel.js        # Model de mensagens
│   │   └── conversationModel.js   # Model de grupos
│   ├── routes/
│   │   ├── chatRoutes.js          # Rotas de chat
│   │   └── conversationRoutes.js  # Rotas de grupos
│   ├── utils/
│   │   └── dbInit.js              # Inicialização do banco
│   ├── uploads/                   # Arquivos enviados
│   ├── package.json
│   └── server.js                  # Servidor principal
├── frontend/
│   ├── css/
│   │   └── style.css              # Estilos do sistema
│   ├── js/
│   │   ├── main.js                # Lógica principal
│   │   └── utils.js               # Funções utilitárias
│   └── index.html                 # Página principal
└── README.md
```

## 🗄️ Banco de Dados

### Tabelas

#### `conversations` (Grupos)
- `id` - ID único
- `empresa` - Nome da empresa
- `nome_grupo` - Nome do grupo
- `criado_em` - Data de criação

#### `messages` (Mensagens)
- `id` - ID único
- `conversation_id` - ID do grupo
- `empresa` - Nome da empresa
- `usuario` - Nome do usuário
- `mensagem` - Conteúdo da mensagem
- `hora` - Data/hora do envio
- `editada` - Se foi editada
- `deletada` - Se foi deletada
- `anexo_link` - Link externo (opcional)
- `anexo_arquivo` - Arquivo enviado (opcional)
- `criado_em` - Data de criação

## 🔌 API Endpoints

### Grupos (Conversations)
- `POST /api/conversations` - Criar grupo
- `GET /api/conversations/empresa/:empresa` - Listar grupos
- `GET /api/conversations/:id` - Buscar grupo
- `GET /api/conversations/:id/exists` - Verificar existência

### Mensagens (Chat)
- `POST /api/chat/messages` - Enviar mensagem
- `GET /api/chat/conversations/:id/messages` - Listar mensagens
- `PUT /api/chat/messages/:id` - Editar mensagem
- `DELETE /api/chat/messages/:id` - Deletar mensagem
- `GET /api/chat/messages/empresa/:empresa` - Mensagens por empresa
- `GET /api/chat/messages/:id` - Buscar mensagem

### Uploads
- `GET /api/uploads/:filename` - Baixar arquivo

## ⚙️ Configuração

### Backend
- **Porta**: 3008 (configurável via .env)
- **Banco**: SQLite (automático)
- **Uploads**: Pasta `backend/uploads/`
- **CORS**: Configurado para localhost

### Frontend
- **API URL**: `http://localhost:3008/api`
- **Empresa padrão**: "Krolik"
- **Usuário padrão**: "Usuário Teste"

## 🔧 Personalização

### Mudar Empresa/Usuário
No arquivo `frontend/js/main.js`:
```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:3008/api',
    EMPRESA: 'Sua Empresa',
    USUARIO: 'Nome do Usuário'
};
```

### Mudar Porta do Backend
No arquivo `backend/server.js` ou `.env`:
```javascript
const PORT = process.env.PORT || 3008;
```

### Configurar CORS
No arquivo `backend/server.js`:
```javascript
app.use(cors({
    origin: ['http://localhost:3000', 'http://seu-dominio.com'],
    credentials: true
}));
```

## 🚀 Deploy

### Backend
1. Configure as variáveis de ambiente
2. Execute `npm install --production`
3. Inicie com `npm start` ou PM2

### Frontend
1. Ajuste a URL da API no `main.js`
2. Faça upload para seu servidor web
3. Configure CORS no backend se necessário

## 📝 Logs

O sistema registra logs no console:
- Conexões com banco
- Requisições da API
- Erros de validação
- Uploads de arquivos

## 🔒 Segurança

- **Isolamento por empresa**: Todas as queries filtram por empresa
- **Validação de arquivos**: Tipos e tamanhos limitados
- **Sanitização**: Inputs validados e escapados
- **CORS**: Configurado para origens específicas

## 🐛 Troubleshooting

### Erro de CORS
- Verifique se a URL da API está correta
- Configure CORS no backend para sua origem

### Erro de banco
- Execute `npm run init-db` para recriar o banco
- Verifique permissões da pasta `backend/db/`

### Upload não funciona
- Verifique se a pasta `backend/uploads/` existe
- Confirme se o arquivo não excede 10MB
- Valide o tipo do arquivo

### Modal não abre
- Verifique se o Bootstrap está carregado
- Confirme se não há erros no console

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Confirme a configuração da API
3. Teste os endpoints individualmente
4. Verifique a conectividade do banco

## 📄 Licença

Este projeto é desenvolvido para uso interno da Krolik.

---

**Desenvolvido com ❤️ para a Krolik**
