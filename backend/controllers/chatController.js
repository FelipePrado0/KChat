const MessageModel = require('../models/messageModel');
const UserModel = require('../models/userModel');

class ChatController {
    constructor() {
        this.messageModel = new MessageModel();
        this.userModel = new UserModel();
    }

    /**
     * Enviar nova mensagem
     * POST /api/chat/messages
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async sendMessage(req, res) {
        try {
            const { content } = req.body;
            const userId = req.user.id;
            const companyId = req.user.company_id;

            // Validações básicas
            if (!content) {
                return res.status(400).json({
                    success: false,
                    message: 'Conteúdo da mensagem é obrigatório'
                });
            }

            if (content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Conteúdo da mensagem não pode estar vazio'
                });
            }

            if (content.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'Mensagem muito longa (máximo 1000 caracteres)'
                });
            }

            // Criar mensagem
            const messageData = {
                content: content.trim(),
                user_id: userId,
                company_id: companyId
            };

            const newMessage = await this.messageModel.create(messageData);

            res.status(201).json({
                success: true,
                message: 'Mensagem enviada com sucesso',
                data: {
                    message: newMessage
                }
            });

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Buscar mensagens da empresa (com paginação)
     * GET /api/chat/messages
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getMessages(req, res) {
        try {
            const companyId = req.user.company_id;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;

            // Validações de paginação
            if (limit < 1 || limit > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Limite deve estar entre 1 e 100'
                });
            }

            if (offset < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Offset deve ser maior ou igual a 0'
                });
            }

            // Buscar mensagens
            const messages = await this.messageModel.getByCompany(companyId, limit, offset);
            const totalMessages = await this.messageModel.countByCompany(companyId);

            res.status(200).json({
                success: true,
                data: {
                    messages,
                    pagination: {
                        limit,
                        offset,
                        total: totalMessages,
                        hasMore: offset + limit < totalMessages
                    }
                }
            });

        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Buscar mensagens mais recentes
     * GET /api/chat/messages/recent
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getRecentMessages(req, res) {
        try {
            const companyId = req.user.company_id;
            const limit = parseInt(req.query.limit) || 20;

            // Validação de limite
            if (limit < 1 || limit > 50) {
                return res.status(400).json({
                    success: false,
                    message: 'Limite deve estar entre 1 e 50'
                });
            }

            // Buscar mensagens recentes
            const messages = await this.messageModel.getRecentByCompany(companyId, limit);

            res.status(200).json({
                success: true,
                data: {
                    messages
                }
            });

        } catch (error) {
            console.error('Erro ao buscar mensagens recentes:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Buscar mensagem específica
     * GET /api/chat/messages/:messageId
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getMessage(req, res) {
        try {
            const messageId = parseInt(req.params.messageId);
            const companyId = req.user.company_id;

            if (!messageId || messageId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID da mensagem inválido'
                });
            }

            // Buscar mensagem
            const message = await this.messageModel.getById(messageId, companyId);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Mensagem não encontrada'
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    message
                }
            });

        } catch (error) {
            console.error('Erro ao buscar mensagem:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Atualizar mensagem
     * PUT /api/chat/messages/:messageId
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async updateMessage(req, res) {
        try {
            const messageId = parseInt(req.params.messageId);
            const { content } = req.body;
            const userId = req.user.id;
            const companyId = req.user.company_id;

            // Validações básicas
            if (!content) {
                return res.status(400).json({
                    success: false,
                    message: 'Conteúdo da mensagem é obrigatório'
                });
            }

            if (content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Conteúdo da mensagem não pode estar vazio'
                });
            }

            if (content.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'Mensagem muito longa (máximo 1000 caracteres)'
                });
            }

            // Atualizar mensagem
            const updateData = { content: content.trim() };
            const updatedMessage = await this.messageModel.update(messageId, userId, companyId, updateData);

            res.status(200).json({
                success: true,
                message: 'Mensagem atualizada com sucesso',
                data: {
                    message: updatedMessage
                }
            });

        } catch (error) {
            console.error('Erro ao atualizar mensagem:', error);
            
            if (error.message.includes('não encontrada') || error.message.includes('sem permissão')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Deletar mensagem
     * DELETE /api/chat/messages/:messageId
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async deleteMessage(req, res) {
        try {
            const messageId = parseInt(req.params.messageId);
            const userId = req.user.id;
            const companyId = req.user.company_id;

            // Deletar mensagem
            const deleted = await this.messageModel.delete(messageId, userId, companyId);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Mensagem não encontrada ou sem permissão para deletar'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Mensagem deletada com sucesso'
            });

        } catch (error) {
            console.error('Erro ao deletar mensagem:', error);
            
            if (error.message.includes('não encontrada') || error.message.includes('sem permissão')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Buscar mensagens por usuário
     * GET /api/chat/messages/user/:userId
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getUserMessages(req, res) {
        try {
            const targetUserId = parseInt(req.params.userId);
            const companyId = req.user.company_id;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;

            // Validações
            if (!targetUserId || targetUserId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do usuário inválido'
                });
            }

            if (limit < 1 || limit > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Limite deve estar entre 1 e 100'
                });
            }

            if (offset < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Offset deve ser maior ou igual a 0'
                });
            }

            // Verificar se o usuário pertence à mesma empresa
            const targetUser = await this.userModel.getById(targetUserId);
            if (!targetUser || targetUser.company_id !== companyId) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            // Buscar mensagens do usuário
            const messages = await this.messageModel.getByUser(targetUserId, companyId, limit, offset);

            res.status(200).json({
                success: true,
                data: {
                    messages,
                    user: {
                        id: targetUser.id,
                        name: targetUser.name,
                        email: targetUser.email
                    }
                }
            });

        } catch (error) {
            console.error('Erro ao buscar mensagens do usuário:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Buscar mensagens por período
     * GET /api/chat/messages/date-range
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getMessagesByDateRange(req, res) {
        try {
            const companyId = req.user.company_id;
            const { startDate, endDate } = req.query;

            // Validações
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Data inicial e final são obrigatórias'
                });
            }

            // Validar formato das datas (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de data inválido (use YYYY-MM-DD)'
                });
            }

            // Validar se startDate <= endDate
            if (new Date(startDate) > new Date(endDate)) {
                return res.status(400).json({
                    success: false,
                    message: 'Data inicial deve ser menor ou igual à data final'
                });
            }

            // Buscar mensagens por período
            const messages = await this.messageModel.getByDateRange(companyId, startDate, endDate);

            res.status(200).json({
                success: true,
                data: {
                    messages,
                    dateRange: {
                        startDate,
                        endDate
                    }
                }
            });

        } catch (error) {
            console.error('Erro ao buscar mensagens por período:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Buscar estatísticas do chat
     * GET /api/chat/stats
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getChatStats(req, res) {
        try {
            const companyId = req.user.company_id;

            // Contar mensagens totais
            const totalMessages = await this.messageModel.countByCompany(companyId);

            // Buscar usuários da empresa
            const users = await this.userModel.getByCompany(companyId);

            // Buscar mensagens dos últimos 7 dias
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const startDate = sevenDaysAgo.toISOString().split('T')[0];
            const endDate = new Date().toISOString().split('T')[0];
            
            const recentMessages = await this.messageModel.getByDateRange(companyId, startDate, endDate);

            res.status(200).json({
                success: true,
                data: {
                    stats: {
                        totalMessages,
                        totalUsers: users.length,
                        messagesLast7Days: recentMessages.length
                    },
                    users: users.map(user => ({
                        id: user.id,
                        name: user.name,
                        email: user.email
                    }))
                }
            });

        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
}

module.exports = ChatController;
