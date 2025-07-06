// Importa os módulos necessários
const express = require('express'); // Framework web para Node.js
const cors = require('cors'); // Middleware para habilitar CORS
const rateLimit = require('express-rate-limit'); // Middleware para limitar requisições
const path = require('path'); // Utilitário para lidar com caminhos de arquivos
const multer = require('multer'); // Middleware para upload de arquivos

// Importa as rotas
const chatRoutes = require('./routes/chatRoutes');
const privateMessageRoutes = require('./routes/privateMessageRoutes');
const groupRoutes = require('./routes/groupRoutes');

// Importa utilitário para inicializar o banco de dados
const { initializeDatabase, logApi } = require('./utils/dbInit');

// Configurações do servidor
const PORT = process.env.PORT || 3000; // Porta padrão
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

// Habilita CORS para qualquer origem (apenas para testes)
app.use(cors());

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
app.use('/api', groupRoutes);
app.use('/api', chatRoutes);
app.use('/api/private-message', privateMessageRoutes);

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
    // Log manual do download
    logApi({
        empresa: null,
        rota: req.originalUrl,
        metodo: req.method,
        status_code: 200,
        mensagem: 'Download de arquivo',
        body_request: req.body,
        body_response: { file: filename },
        erro: null
    });
    res.sendFile(filePath);
});

// Middleware para logar todas as respostas da API
app.use((req, res, next) => {
    const oldJson = res.json;
    res.json = function (body) {
        // Tenta extrair empresa de body, query ou headers
        let empresa = null;
        if (req.body && req.body.empresa) empresa = req.body.empresa;
        else if (req.query && req.query.empresa) empresa = req.query.empresa;
        else if (req.headers && req.headers.empresa) empresa = req.headers.empresa;
        logApi({
            empresa,
            rota: req.originalUrl,
            metodo: req.method,
            status_code: res.statusCode,
            mensagem: body && body.message ? body.message : null,
            body_request: req.body,
            body_response: body,
            erro: null
        });
        return oldJson.call(this, body);
    };
    next();
});

// Middleware para tratar erros gerais e de upload
app.use((err, req, res, next) => {
    let empresa = null;
    if (req.body && req.body.empresa) empresa = req.body.empresa;
    else if (req.query && req.query.empresa) empresa = req.query.empresa;
    else if (req.headers && req.headers.empresa) empresa = req.headers.empresa;
    logApi({
        empresa,
        rota: req.originalUrl,
        metodo: req.method,
        status_code: 500,
        mensagem: 'Erro interno do servidor',
        body_request: req.body,
        body_response: null,
        erro: err && err.message ? err.message : String(err)
    });
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
