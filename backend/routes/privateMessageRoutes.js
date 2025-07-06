// Importa o framework Express
const express = require('express');
const router = express.Router();
// Importa o controller de mensagens privadas
const PrivateMessageController = require('../controllers/privateMessageController');
// Importa o multer para upload de arquivos
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do multer para upload de arquivos (mesma configuração do chatController)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite de 10MB por arquivo
    },
    fileFilter: function (req, file, cb) {
        // Permite apenas imagens, documentos, PDFs e áudios
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|webm|mp3|wav|ogg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido'));
        }
    }
});

// Rota para criar nova mensagem privada (com suporte a upload de arquivo)
// POST /api/private-messages
router.post('/private-messages', upload.single('anexo_arquivo'), PrivateMessageController.createPrivateMessage);

// Rota para listar mensagens privadas de um usuário
// GET /api/private-messages?empresa=XXX&usuario=XXX
router.get('/private-messages', PrivateMessageController.getPrivateMessages);

// Rota para buscar conversa entre dois usuários
// GET /api/private-messages/conversation?empresa=XXX&usuario1=XXX&usuario2=XXX
router.get('/private-messages/conversation', PrivateMessageController.getGroup);

// Rota para listar usuários únicos de uma empresa
// GET /api/private-messages/usuarios?empresa=XXX
router.get('/private-messages/usuarios', PrivateMessageController.getUsuariosByEmpresa);

// Rota para buscar última mensagem de uma conversa
// GET /api/private-messages/last?empresa=XXX&usuario1=XXX&usuario2=XXX
router.get('/private-messages/last', PrivateMessageController.getLastMessage);

// Exporta o router para uso no server.js
module.exports = router; 