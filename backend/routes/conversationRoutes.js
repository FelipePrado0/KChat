// Importa o framework Express
const express = require('express');
const router = express.Router();
// Importa o controller de conversas (grupos)
const ConversationController = require('../controllers/conversationController');

// Rota para criar novo grupo
// POST /api/conversations
router.post('/conversations', ConversationController.createConversation);

// Rota para listar grupos de uma empresa
// GET /api/conversations/empresa/:empresa
router.get('/conversations/empresa/:empresa', ConversationController.getConversationsByEmpresa);

// Rota para buscar grupo por ID
// GET /api/conversations/:id?empresa=XXX
router.get('/conversations/:id', ConversationController.getConversationById);

// Rota para verificar se grupo existe
// GET /api/conversations/:id/exists?empresa=XXX
router.get('/conversations/:id/exists', ConversationController.checkConversationExists);

// Exporta o router para uso no server.js
module.exports = router; 