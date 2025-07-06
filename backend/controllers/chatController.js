// Importa os models necessários para manipular mensagens e conversas
const MessageModel = require('../models/messageModel');
const ConversationModel = require('../models/conversationModel');
const multer = require('multer'); // Middleware para upload de arquivos
const path = require('path'); // Utilitário de caminhos
const fs = require('fs'); // Sistema de arquivos

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    // Define o diretório de upload
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    // Define o nome do arquivo salvo
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configura o multer com limites e filtros de tipo de arquivo
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite de 10MB por arquivo
    },
    fileFilter: function (req, file, cb) {
        // Permite apenas imagens, documentos e PDFs
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido'));
        }
    }
});

// Controller principal do chat
class ChatController {
    constructor() {
        // Instancia o model de mensagens (não é necessário, mas mantido para compatibilidade)
        this.messageModel = new MessageModel();
    }

    /**
     * Envia uma nova mensagem para um grupo
     * POST /api/chat/messages
     */
    async sendMessage(req, res) {
        try {
            // Extrai dados do corpo da requisição
            const { conversation_id, empresa, usuario, mensagem, anexo_link } = req.body;
            let anexoArquivo = null;

            // Se houver arquivo enviado, salva o nome
            if (req.file) {
                anexoArquivo = req.file.filename;
            }

            // Validações básicas
            if (!conversation_id || !empresa || !usuario || !mensagem) {
                return res.status(400).json({
                    success: false,
                    message: 'Conversa, empresa, usuário e mensagem são obrigatórios'
                });
            }

            if (mensagem.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Mensagem não pode estar vazia'
                });
            }

            // Verifica se a conversa existe
            const conversationExists = await ConversationModel.exists(conversation_id, empresa);
            if (!conversationExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversa não encontrada'
                });
            }

            // Cria a mensagem no banco
            const message = await MessageModel.create(
                conversation_id, 
                empresa, 
                usuario, 
                mensagem.trim(),
                anexo_link || null,
                anexoArquivo
            );

            // Retorna sucesso
            res.status(201).json({
                success: true,
                message: 'Mensagem enviada com sucesso',
                data: message
            });

        } catch (error) {
            // Captura e retorna erro
            console.error('Erro ao enviar mensagem:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Lista mensagens de um grupo específico
     * GET /api/chat/conversations/:conversation_id/messages
     */
    async getMessagesByConversation(req, res) {
        try {
            const { conversation_id } = req.params;
            const { empresa } = req.query;

            // Validação do parâmetro empresa
            if (!empresa) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa é obrigatória'
                });
            }

            // Verifica se a conversa existe
            const conversationExists = await ConversationModel.exists(conversation_id, empresa);
            if (!conversationExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversa não encontrada'
                });
            }

            // Busca as mensagens do grupo
            const messages = await MessageModel.findByConversation(conversation_id, empresa);

            // Retorna as mensagens
            res.json({
                success: true,
                data: messages
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
     * Edita uma mensagem existente
     * PUT /api/chat/messages/:id
     */
    async editMessage(req, res) {
        try {
            const { id } = req.params;
            const { empresa, nova_mensagem } = req.body;

            // Validações
            if (!empresa || !nova_mensagem) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa e nova mensagem são obrigatórios'
                });
            }

            if (nova_mensagem.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Mensagem não pode estar vazia'
                });
            }

            // Atualiza a mensagem no banco
            const updated = await MessageModel.update(id, empresa, nova_mensagem.trim());

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Mensagem não encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Mensagem editada com sucesso'
            });

        } catch (error) {
            console.error('Erro ao editar mensagem:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Deleta (marca como deletada) uma mensagem
     * DELETE /api/chat/messages/:id
     */
    async deleteMessage(req, res) {
        try {
            const { id } = req.params;
            const { empresa } = req.body;

            // Validação
            if (!empresa) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa é obrigatória'
                });
            }

            // Marca a mensagem como deletada
            const deleted = await MessageModel.delete(id, empresa);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Mensagem não encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Mensagem deletada com sucesso'
            });

        } catch (error) {
            console.error('Erro ao deletar mensagem:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Lista todas as mensagens de uma empresa
     * GET /api/chat/messages/empresa/:empresa
     */
    async getMessagesByEmpresa(req, res) {
        try {
            const { empresa } = req.params;
            const { limit } = req.query;

            // Validação
            if (!empresa) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa é obrigatória'
                });
            }

            // Busca as mensagens da empresa
            const messages = await MessageModel.findByEmpresa(empresa, parseInt(limit) || 100);

            res.json({
                success: true,
                data: messages
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
     * Busca uma mensagem específica por ID
     * GET /api/chat/messages/:id
     */
    async getMessageById(req, res) {
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

            // Busca a mensagem
            const message = await MessageModel.findById(id, empresa);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Mensagem não encontrada'
                });
            }

            res.json({
                success: true,
                data: message
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
     * Middleware para upload de arquivo (usado nas rotas de envio de mensagem)
     */
    uploadMiddleware() {
        return upload.single('anexo_arquivo');
    }
}

// Exporta o controller para uso nas rotas
module.exports = ChatController;
