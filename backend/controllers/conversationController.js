// Importa o model de conversas (grupos)
const ConversationModel = require('../models/conversationModel');

// Controller para gerenciar grupos de chat
class ConversationController {
    /**
     * Cria uma nova conversa (grupo)
     * POST /api/conversations
     */
    static async createConversation(req, res) {
        try {
            // Extrai dados do corpo da requisição
            const { empresa, nome_grupo } = req.body;

            // Validações básicas
            if (!empresa || !nome_grupo) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa e nome do grupo são obrigatórios'
                });
            }

            if (nome_grupo.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome do grupo deve ter pelo menos 2 caracteres'
                });
            }

            // Cria a conversa no banco
            const conversation = await ConversationModel.create(empresa, nome_grupo.trim());

            // Retorna sucesso
            res.status(201).json({
                success: true,
                message: 'Conversa criada com sucesso',
                data: conversation
            });

        } catch (error) {
            // Captura e retorna erro
            console.error('Erro ao criar conversa:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Lista todas as conversas (grupos) de uma empresa
     * GET /api/conversations/empresa/:empresa
     */
    static async getConversationsByEmpresa(req, res) {
        try {
            const { empresa } = req.params;

            // Validação
            if (!empresa) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa é obrigatória'
                });
            }

            // Busca as conversas da empresa
            const conversations = await ConversationModel.findByEmpresa(empresa);

            // Retorna as conversas
            res.json({
                success: true,
                data: conversations
            });

        } catch (error) {
            console.error('Erro ao buscar conversas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Busca uma conversa (grupo) por ID
     * GET /api/conversations/:id?empresa=XXX
     */
    static async getConversationById(req, res) {
        try {
            const { id } = req.params;
            const { empresa } = req.query;

            // Validação
            if (!empresa) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa é obrigatória'
                });
            }

            // Busca a conversa
            const conversation = await ConversationModel.findById(id, empresa);

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversa não encontrada'
                });
            }

            res.json({
                success: true,
                data: conversation
            });

        } catch (error) {
            console.error('Erro ao buscar conversa:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Verifica se uma conversa existe
     * GET /api/conversations/:id/exists?empresa=XXX
     */
    static async checkConversationExists(req, res) {
        try {
            const { id } = req.params;
            const { empresa } = req.query;

            // Validação
            if (!empresa) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa é obrigatória'
                });
            }

            // Verifica existência da conversa
            const exists = await ConversationModel.exists(id, empresa);

            res.json({
                success: true,
                exists
            });

        } catch (error) {
            console.error('Erro ao verificar conversa:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
}

// Exporta o controller para uso nas rotas
module.exports = ConversationController; 