// Importa os módulos necessários
const express = require('express'); // Framework web para Node.js
const cors = require('cors'); // Middleware para habilitar CORS
const rateLimit = require('express-rate-limit'); // Middleware para limitar requisições
const path = require('path'); // Utilitário para lidar com caminhos de arquivos
const multer = require('multer'); // Middleware para upload de arquivos

// Importa as rotas
const conversationRoutes = require('./routes/conversationRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Importa utilitário para inicializar o banco de dados
const { initializeDatabase } = require('./utils/dbInit');

// Configurações do servidor
const PORT = process.env.PORT || 3008; // Porta padrão
const NODE_ENV = process.env.NODE_ENV || 'development'; // Ambiente

// Cria a aplicação Express
const app = express();

// Configura o rate limiting para evitar abuso da API
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP
    message: {
        success: false,
        message: 'Muitas requisições deste IP, tente novamente mais tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplica o rate limiting globalmente
app.use(limiter);

// Habilita CORS para origens específicas (frontend)
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

// Permite receber JSON e dados de formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging: mostra cada requisição no console
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Middleware para tratar erros de JSON inválido
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'JSON inválido'
        });
    }
    next();
});

// Servir arquivos estáticos da pasta uploads (anexos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Registra as rotas principais
app.use('/api', conversationRoutes); // Rotas de grupos
app.use('/api/chat', chatRoutes);    // Rotas de mensagens

// Rota de health check (verifica se a API está online)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'KChat API está funcionando!',
        timestamp: new Date().toISOString()
    });
});

// Rota para servir arquivos de upload por nome
app.get('/api/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    res.sendFile(filePath);
});

// Middleware para tratar erros gerais e de upload
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Arquivo muito grande. Tamanho máximo: 10MB'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    });
});

// Rota 404 para qualquer rota não encontrada
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

// Função principal para inicializar o servidor e o banco
async function startServer() {
    try {
        // Inicializa o banco de dados (cria tabelas se não existirem)
        console.log('Inicializando banco de dados...');
        await initializeDatabase();
        console.log('✓ Banco de dados inicializado');

        // Inicia o servidor Express
        app.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log('🚀 KChat Backend iniciado com sucesso!');
            console.log('='.repeat(50));
            console.log(`📡 Servidor rodando na porta: ${PORT}`);
            console.log(`🌍 Ambiente: ${NODE_ENV}`);
            console.log(`🔗 URL: http://localhost:${PORT}`);
            console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
            console.log('='.repeat(50));
            console.log('📚 Endpoints disponíveis:');
            console.log('   💬 Chat: /api/chat');
            console.log('   ❤️  Health: /api/health');
            console.log('='.repeat(50));
        });

    } catch (error) {
        console.error('❌ Erro ao inicializar servidor:', error);
        process.exit(1);
    }
}

// Tratamento de sinais para encerramento seguro
process.on('SIGINT', () => {
    console.log('\n🛑 Recebido SIGINT. Encerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Recebido SIGTERM. Encerrando servidor...');
    process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
    console.error('❌ Erro não capturado:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
    process.exit(1);
});

// Inicia o servidor se o arquivo for executado diretamente
if (require.main === module) {
    startServer();
}

// Exporta o app para testes ou uso externo
module.exports = app;
