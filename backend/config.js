const path = require('path');

const config = {
    server: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development',
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE']
        }
    },
    
    database: {
        path: path.join(__dirname, 'db', 'database.sqlite'),
        timezone: 'America/Sao_Paulo'
    },
    
    upload: {
        directory: path.join(__dirname, 'uploads'),
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: /jpeg|jpg|png|gif|pdf|doc|docx|txt|webm|mp3|wav|ogg/,
        filename: (originalname) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return `anexo_arquivo-${uniqueSuffix}${path.extname(originalname)}`;
        }
    },
    
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100, // limite por IP
        message: {
            success: false,
            message: 'Muitas requisições deste IP, tente novamente mais tarde.'
        }
    },
    
    whatsapp: {
        authPath: path.join(__dirname, 'baileys_auth'),
        qrPath: path.join(__dirname, 'last_qr.png'),
        qrWidth: 256
    },
    
    logging: {
        enabled: true,
        level: process.env.LOG_LEVEL || 'info'
    }
};

module.exports = config; 