// Importa o framework Express
const express = require('express');
const router = express.Router();
// Importa o controller do chat
const ChatController = require('../controllers/chatController');

// Instancia o controller do chat
const chatController = new ChatController();

// Rota para enviar mensagem (suporta upload de arquivo)
// POST /api/chat/messages
// Usa o middleware de upload e depois chama o método de envio
router.post('/messages', chatController.uploadMiddleware(), chatController.sendMessage.bind(chatController));

// Rota para listar mensagens de um grupo
// GET /api/chat/conversations/:conversation_id/messages?empresa=XXX
router.get('/conversations/:conversation_id/messages', chatController.getMessagesByConversation.bind(chatController));

// Rota para editar uma mensagem
// PUT /api/chat/messages/:id
router.put('/messages/:id', chatController.editMessage.bind(chatController));

// Rota para deletar (marcar como deletada) uma mensagem
// DELETE /api/chat/messages/:id
router.delete('/messages/:id', chatController.deleteMessage.bind(chatController));

// Rota para listar todas as mensagens de uma empresa
// GET /api/chat/messages/empresa/:empresa
router.get('/messages/empresa/:empresa', chatController.getMessagesByEmpresa.bind(chatController));

// Rota para buscar uma mensagem por ID
// GET /api/chat/messages/:id
router.get('/messages/:id', chatController.getMessageById.bind(chatController));

// Exporta o router para uso no server.js
module.exports = router;
