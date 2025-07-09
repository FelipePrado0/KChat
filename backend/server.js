const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const http = require('http');
const { Server } = require('socket.io');
const { Boom } = require('@hapi/boom');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const fs = require('fs');

// Silencia logs do Baileys
process.env.BAILEYS_LOG_LEVEL = 'silent';

// Configura logger silencioso para o Baileys
const pino = require('pino');
const logger = pino({ level: 'silent' });

const config = require('./config');
const chatRoutes = require('./routes/chatRoutes');
const privateMessageRoutes = require('./routes/privateMessageRoutes');
const groupRoutes = require('./routes/groupRoutes');
const { initializeDatabase, logApi } = require('./utils/dbInit');
const { extractEmpresa } = require('./utils/helpers');

const app = express();

const limiter = rateLimit(config.rateLimit);

// CORS definitivo para API REST
app.use(cors({
    origin: '*', // Em produção, troque para o domínio do frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'JSON inválido'
        });
    }
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', groupRoutes);
app.use('/api', chatRoutes);
app.use('/api/private-message', privateMessageRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'KChat API está funcionando!',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
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



app.use((req, res, next) => {
    const oldJson = res.json;
    res.json = function (body) {
        logApi({
            empresa: extractEmpresa(req),
            rota: req.originalUrl,
            metodo: req.method,
            status_code: res.statusCode,
            mensagem: body?.message || null,
            body_request: req.body,
            body_response: body,
            erro: null
        });
        return oldJson.call(this, body);
    };
    next();
});

app.use((err, req, res, next) => {
    logApi({
        empresa: extractEmpresa(req),
        rota: req.originalUrl,
        metodo: req.method,
        status_code: 500,
        mensagem: 'Erro interno do servidor',
        body_request: req.body,
        body_response: null,
        erro: err?.message || String(err)
    });
    
    console.error('Erro:', err);
    
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'Arquivo muito grande. Tamanho máximo: 10MB'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    });
});

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

// CORS definitivo para Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Em produção, troque para o domínio do frontend
        methods: ['GET', 'POST'],
        credentials: true
    }
});

let sock;
let isReady = false;

(async () => {
    const { state, saveCreds } = await useMultiFileAuthState(config.whatsapp.authPath);
    const { version } = await fetchLatestBaileysVersion();
    
    sock = makeWASocket({
        version,
        printQRInTerminal: false,
        auth: state,
        syncFullHistory: false,
        getMessage: async () => undefined,
        logger: logger
    });
    
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        console.log('[WhatsApp] Evento connection.update:', { connection, lastDisconnect: !!lastDisconnect, qr: !!qr });
        
        if (qr) {
            console.log('[WhatsApp] QR Code recebido do Baileys. Emitindo para o frontend...');
            
            // Exibir QR Code no terminal
            console.log('\n' + '='.repeat(50));
            console.log('📱 QR CODE DO WHATSAPP - ESCANEIE COM SEU CELULAR');
            console.log('='.repeat(50));
            qrcodeTerminal.generate(qr, { small: true });
            console.log('='.repeat(50));
            console.log('💡 Dica: Abra o WhatsApp no celular > Configurações > Aparelhos conectados > Conectar um aparelho');
            console.log('='.repeat(50) + '\n');
            
            // Emitir para o frontend
            io.emit('qr', qr);
            
            // Salvar QR Code como arquivo
            qrcode.toFile(config.whatsapp.qrPath, qr, { width: config.whatsapp.qrWidth }, (err) => {
                if (err) {
                    console.error('[WhatsApp] Erro ao salvar QR Code como arquivo:', err);
                } else {
                    console.log('[WhatsApp] QR Code salvo em arquivo com sucesso:', config.whatsapp.qrPath);
                }
            });
        }
        
        if (connection === 'open') {
            isReady = true;
            console.log('✅ Conectado ao WhatsApp via Baileys!');
        } else if (connection === 'close') {
            isReady = false;
            const reason = lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output.statusCode : lastDisconnect?.error;
            console.log('🔌 Conexão WhatsApp fechada:', reason);
        }
    });
})();

io.on('connection', (socket) => {
    socket.on('nova_mensagem', (mensagem) => {
        io.emit('mensagem_recebida', mensagem);
    });
});

async function startServer() {
    try {
        console.log('Inicializando banco de dados...');
        await initializeDatabase();
        console.log('✓ Banco de dados inicializado');

        server.listen(config.server.port, () => {
            console.log('='.repeat(50));
            console.log('🚀 KChat Backend iniciado com sucesso!');
            console.log('='.repeat(50));
            console.log(`📡 Servidor rodando na porta: ${config.server.port}`);
            console.log(`🌍 Ambiente: ${config.server.environment}`);
            console.log(`🔗 URL: http://localhost:${config.server.port}`);
            console.log(`📊 Health Check: http://localhost:${config.server.port}/api/health`);
            console.log('='.repeat(50));
            console.log('📚 Endpoints disponíveis:');
            console.log('   💬 Chat: /api/chat');
            console.log('   ❤️  Health: /api/health');
            console.log('='.repeat(50));
            console.log('💡 Socket.io ativo para chat em tempo real!');
        });

    } catch (error) {
        console.error('❌ Erro ao inicializar servidor:', error);
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    console.log('\n🛑 Recebido SIGINT. Encerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Recebido SIGTERM. Encerrando servidor...');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Erro não capturado:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
    process.exit(1);
});

if (require.main === module) {
    startServer();
}

module.exports = app;
