// Importa o framework Express
const express = require('express');
const router = express.Router();
// Importa o controller de mensagens privadas
const PrivateMessageController = require('../controllers/privateMessageController');

// Rota para criar nova mensagem privada
// POST /api/private-messages
router.post('/private-messages', PrivateMessageController.createPrivateMessage);

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