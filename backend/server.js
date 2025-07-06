const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Importar utilitários
const { initializeDatabase } = require('./utils/dbInit');

// Configurações do servidor
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Criar aplicação Express
const app = express();

// Configurar rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requisições por IP por janela
    message: {
        success: false,
        message: 'Muitas requisições deste IP, tente novamente mais tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middlewares de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Middleware de rate limiting
app.use(limiter);

// Middleware CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://seu-dominio.com'] // Substitua pelo seu domínio em produção
        : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Middleware para tratamento de erros de parsing JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'JSON inválido'
        });
    }
    next();
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'KChat API está funcionando',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        version: '1.0.0'
    });
});

// Rota raiz
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Bem-vindo à API do KChat',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            chat: '/api/chat',
            health: '/api/health'
        },
        documentation: 'Consulte a documentação para mais informações'
    });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada',
        path: req.originalUrl
    });
});

// Middleware global de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    
    // Se o erro já foi respondido, não fazer nada
    if (res.headersSent) {
        return next(err);
    }

    // Determinar status code
    const statusCode = err.statusCode || 500;
    
    // Determinar mensagem de erro
    const message = err.message || 'Erro interno do servidor';
    
    // Log do erro em desenvolvimento
    if (NODE_ENV === 'development') {
        console.error('Stack trace:', err.stack);
    }

    res.status(statusCode).json({
        success: false,
        message: NODE_ENV === 'production' ? 'Erro interno do servidor' : message,
        ...(NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Função para inicializar o servidor
async function startServer() {
    try {
        // Inicializar banco de dados
        console.log('Inicializando banco de dados...');
        await initializeDatabase();
        console.log('✓ Banco de dados inicializado');

        // Iniciar servidor
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
            console.log('   🔐 Auth: /api/auth');
            console.log('   💬 Chat: /api/chat');
            console.log('   ❤️  Health: /api/health');
            console.log('='.repeat(50));
        });

    } catch (error) {
        console.error('❌ Erro ao inicializar servidor:', error);
        process.exit(1);
    }
}

// Tratamento de sinais para graceful shutdown
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

// Iniciar servidor se o arquivo for executado diretamente
if (require.main === module) {
    startServer();
}

module.exports = app;
