const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');
const { authenticateToken, verifyMessageOwnership } = require('../middleware/authMiddleware');

// Instanciar controlador
const chatController = new ChatController();

// Middleware de autenticação para todas as rotas de chat
router.use(authenticateToken);

/**
 * @route   POST /api/chat/messages
 * @desc    Enviar nova mensagem
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    { content }
 */
router.post('/messages', async (req, res) => {
    await chatController.sendMessage(req, res);
});

/**
 * @route   GET /api/chat/messages
 * @desc    Buscar mensagens da empresa (com paginação)
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @query   { limit?, offset? }
 */
router.get('/messages', async (req, res) => {
    await chatController.getMessages(req, res);
});

/**
 * @route   GET /api/chat/messages/recent
 * @desc    Buscar mensagens mais recentes
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @query   { limit? }
 */
router.get('/messages/recent', async (req, res) => {
    await chatController.getRecentMessages(req, res);
});

/**
 * @route   GET /api/chat/messages/:messageId
 * @desc    Buscar mensagem específica
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @param   { messageId }
 */
router.get('/messages/:messageId', async (req, res) => {
    await chatController.getMessage(req, res);
});

/**
 * @route   PUT /api/chat/messages/:messageId
 * @desc    Atualizar mensagem (apenas pelo autor)
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @param   { messageId }
 * @body    { content }
 */
router.put('/messages/:messageId', verifyMessageOwnership, async (req, res) => {
    await chatController.updateMessage(req, res);
});

/**
 * @route   DELETE /api/chat/messages/:messageId
 * @desc    Deletar mensagem (apenas pelo autor)
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @param   { messageId }
 */
router.delete('/messages/:messageId', verifyMessageOwnership, async (req, res) => {
    await chatController.deleteMessage(req, res);
});

/**
 * @route   GET /api/chat/messages/user/:userId
 * @desc    Buscar mensagens por usuário (dentro da mesma empresa)
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @param   { userId }
 * @query   { limit?, offset? }
 */
router.get('/messages/user/:userId', async (req, res) => {
    await chatController.getUserMessages(req, res);
});

/**
 * @route   GET /api/chat/messages/date-range
 * @desc    Buscar mensagens por período
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @query   { startDate, endDate }
 */
router.get('/messages/date-range', async (req, res) => {
    await chatController.getMessagesByDateRange(req, res);
});

/**
 * @route   GET /api/chat/stats
 * @desc    Buscar estatísticas do chat
 * @access  Private
 * @header  Authorization: Bearer <token>
 */
router.get('/stats', async (req, res) => {
    await chatController.getChatStats(req, res);
});

module.exports = router;
