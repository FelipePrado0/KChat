// Importa o model de mensagens privadas
const PrivateMessageModel = require('../models/privateMessageModel');

// Controller para gerenciar mensagens privadas
class PrivateMessageController {
    /**
     * Cria uma nova mensagem privada
     * POST /api/private-messages
     */
    static async createPrivateMessage(req, res) {
        try {
            // Extrai dados do corpo da requisição
            const { empresa, remetente, destinatario, mensagem, anexo_link, anexo_arquivo } = req.body;

            // Validações básicas
            if (!empresa || !remetente || !destinatario || !mensagem) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa, remetente, destinatário e mensagem são obrigatórios'
                });
            }

            if (remetente === destinatario) {
                return res.status(400).json({
                    success: false,
                    message: 'Não é possível enviar mensagem para si mesmo'
                });
            }

            if (mensagem.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'A mensagem não pode estar vazia'
                });
            }

            // Cria a mensagem privada no banco
            const privateMessage = await PrivateMessageModel.create(
                empresa, 
                remetente.trim(), 
                destinatario.trim(), 
                mensagem.trim(),
                anexo_link || null,
                anexo_arquivo || null
            );

            // Retorna sucesso
            res.status(201).json({
                success: true,
                message: 'Mensagem privada enviada com sucesso',
                data: privateMessage
            });

        } catch (error) {
            // Captura e retorna erro
            console.error('Erro ao criar mensagem privada:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Lista todas as mensagens privadas de um usuário
     * GET /api/private-messages?empresa=XXX&usuario=XXX
     */
    static async getPrivateMessages(req, res) {
        try {
            const { empresa, usuario } = req.query;

            // Validação
            if (!empresa || !usuario) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa e usuário são obrigatórios'
                });
            }

            // Busca as mensagens privadas do usuário
            const messages = await PrivateMessageModel.findByUsuario(empresa, usuario);

            // Retorna as mensagens
            res.json({
                success: true,
                data: messages
            });

        } catch (error) {
            console.error('Erro ao buscar mensagens privadas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Lista mensagens entre dois usuários específicos
     * GET /api/private-messages/conversation?empresa=XXX&usuario1=XXX&usuario2=XXX
     */
    static async getGroup(req, res) {
        try {
            const { empresa, usuario1, usuario2 } = req.query;

            // Validação
            if (!empresa || !usuario1 || !usuario2) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa e ambos os usuários são obrigatórios'
                });
            }

            // Busca a conversa entre os dois usuários
            const group = await PrivateMessageModel.findGroup(empresa, usuario1, usuario2);

            // Retorna a conversa
            res.json({
                success: true,
                data: group
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
     * Lista todos os usuários únicos de uma empresa
     * GET /api/private-messages/usuarios?empresa=XXX
     */
    static async getUsuariosByEmpresa(req, res) {
        try {
            const { empresa } = req.query;

            // Validação
            if (!empresa) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa é obrigatória'
                });
            }

            // Busca todos os usuários únicos da empresa
            const usuarios = await PrivateMessageModel.findUsuariosByEmpresa(empresa);

            // Retorna os usuários
            res.json({
                success: true,
                data: usuarios
            });

        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Busca a última mensagem de uma conversa privada
     * GET /api/private-messages/last?empresa=XXX&usuario1=XXX&usuario2=XXX
     */
    static async getLastMessage(req, res) {
        try {
            const { empresa, usuario1, usuario2 } = req.query;

            // Validação
            if (!empresa || !usuario1 || !usuario2) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa e ambos os usuários são obrigatórios'
                });
            }

            // Busca a última mensagem entre os dois usuários
            const lastMessage = await PrivateMessageModel.findLastMessage(empresa, usuario1, usuario2);

            // Retorna a última mensagem
            res.json({
                success: true,
                data: lastMessage
            });

        } catch (error) {
            console.error('Erro ao buscar última mensagem:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
}

// Exporta o controller para uso nas rotas
module.exports = PrivateMessageController; 