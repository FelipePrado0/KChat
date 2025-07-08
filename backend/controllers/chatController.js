const MessageModel = require('../models/messageModel');
const GroupModel = require('../models/groupModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { logApi } = require('../utils/dbInit');
const { validateFileType, createUploadDirectory, generateUniqueFilename } = require('../utils/helpers');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        createUploadDirectory(config.upload.directory);
        cb(null, config.upload.directory);
    },
    filename: function (req, file, cb) {
        cb(null, generateUniqueFilename(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: config.upload.maxSize
    },
    fileFilter: function (req, file, cb) {
        if (validateFileType(file, config.upload.allowedTypes)) {
            return cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido'));
        }
    }
});

class ChatController {
    constructor() {
        this.messageModel = new MessageModel();
    }

    async sendMessage(req, res) {
        try {
            console.log('--- [sendMessage] Início ---');
            console.log('Body recebido:', req.body);
            if (req.file) {
                console.log('Arquivo recebido:', req.file.filename);
            }
            
            const { group_id, empresa, usuario, mensagem, anexo_link } = req.body;
            let anexoArquivo = null;

            if (req.file) {
                anexoArquivo = req.file.filename;
            }

            if (!group_id || !empresa || !usuario) {
                console.log('Validação falhou: campos obrigatórios ausentes');
                return res.status(400).json({
                    success: false,
                    message: 'Conversa, empresa e usuário são obrigatórios'
                });
            }

            if (!mensagem && !anexoArquivo) {
                console.log('Validação falhou: mensagem vazia e sem arquivo');
                return res.status(400).json({
                    success: false,
                    message: 'Mensagem ou arquivo é obrigatório'
                });
            }

            const conversationExists = await GroupModel.exists(group_id, empresa);
            console.log('Conversa existe?', conversationExists);
            if (!conversationExists) {
                console.log('Conversa não encontrada:', group_id, empresa);
                return res.status(404).json({
                    success: false,
                    message: 'Conversa não encontrada'
                });
            }

            console.log('Criando mensagem no banco...');
            const message = await MessageModel.create(
                group_id, 
                empresa, 
                usuario, 
                mensagem.trim(),
                anexo_link || null,
                anexoArquivo
            );
            
            logApi({
                empresa,
                rota: req.originalUrl,
                metodo: req.method,
                status_code: 201,
                mensagem: 'Mensagem enviada com sucesso',
                body_request: req.body,
                body_response: message,
                erro: null
            });
            
            console.log('Mensagem criada:', message);
            console.log('--- [sendMessage] Fim: sucesso ---');
            
            res.status(201).json({
                success: true,
                message: 'Mensagem enviada com sucesso',
                data: message
            });

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    async getMessagesByGroup(req, res) {
        try {
            const { group_id } = req.params;
            const { empresa } = req.query;

            if (!empresa) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa é obrigatória'
                });
            }

            const conversationExists = await GroupModel.exists(group_id, empresa);
            if (!conversationExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversa não encontrada'
                });
            }

            const messages = await MessageModel.findByGroup(group_id, empresa);

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

    async editMessage(req, res) {
        try {
            const { id } = req.params;
            const { empresa, nova_mensagem } = req.body;

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

    async deleteMessage(req, res) {
        try {
            const { id } = req.params;
            const { empresa } = req.body;

            if (!empresa) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa é obrigatória'
                });
            }

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

    async getMessagesByEmpresa(req, res) {
        try {
            const { empresa } = req.params;
            const { limit } = req.query;

            if (!empresa) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa é obrigatória'
                });
            }

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

    async getMessageById(req, res) {
        try {
            const { id } = req.params;
            const { empresa } = req.query;

            if (!empresa) {
                return res.status(400).json({
                    success: false,
                    message: 'Empresa é obrigatória'
                });
            }

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

    uploadMiddleware() {
        return upload.single('anexo_arquivo');
    }
}

module.exports = ChatController;
