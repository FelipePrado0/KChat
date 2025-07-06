const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

// Configurações do JWT
const JWT_SECRET = process.env.JWT_SECRET || 'kchat_jwt_secret_key_2024_krolik';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Middleware para verificar se o token JWT é válido
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Obter token do header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acesso não fornecido'
            });
        }

        // Verificar e decodificar o token
        jwt.verify(token, JWT_SECRET, async (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Token expirado'
                    });
                } else if (err.name === 'JsonWebTokenError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Token inválido'
                    });
                } else {
                    return res.status(401).json({
                        success: false,
                        message: 'Erro na verificação do token'
                    });
                }
            }

            try {
                // Buscar usuário no banco para verificar se ainda existe
                const userModel = new UserModel();
                const user = await userModel.getById(decoded.userId);
                
                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Usuário não encontrado'
                    });
                }

                // Adicionar informações do usuário ao request
                req.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    company_id: user.company_id,
                    company_name: user.company_name
                };

                next();
            } catch (dbError) {
                console.error('Erro ao buscar usuário:', dbError);
                return res.status(500).json({
                    success: false,
                    message: 'Erro interno do servidor'
                });
            }
        });
    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Middleware para verificar se o usuário pertence à empresa especificada
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const verifyCompanyAccess = (req, res, next) => {
    try {
        const userCompanyId = req.user.company_id;
        const requestedCompanyId = parseInt(req.params.companyId || req.body.company_id);

        if (!requestedCompanyId) {
            return res.status(400).json({
                success: false,
                message: 'ID da empresa não fornecido'
            });
        }

        if (userCompanyId !== requestedCompanyId) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: usuário não pertence à empresa especificada'
            });
        }

        next();
    } catch (error) {
        console.error('Erro na verificação de acesso à empresa:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Middleware para verificar se o usuário é o proprietário da mensagem
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const verifyMessageOwnership = async (req, res, next) => {
    try {
        const messageId = parseInt(req.params.messageId);
        const userId = req.user.id;
        const companyId = req.user.company_id;

        if (!messageId) {
            return res.status(400).json({
                success: false,
                message: 'ID da mensagem não fornecido'
            });
        }

        // Importar MessageModel
        const MessageModel = require('../models/messageModel');
        const messageModel = new MessageModel();

        // Verificar se a mensagem pertence ao usuário
        const message = await messageModel.getById(messageId, companyId);
        
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Mensagem não encontrada'
            });
        }

        if (message.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: apenas o autor pode modificar a mensagem'
            });
        }

        // Adicionar mensagem ao request para uso posterior
        req.message = message;
        next();
    } catch (error) {
        console.error('Erro na verificação de propriedade da mensagem:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Função para gerar token JWT
 * @param {Object} user - Dados do usuário
 * @returns {string} Token JWT
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            companyId: user.company_id
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * Função para verificar se o token está próximo de expirar
 * @param {string} token - Token JWT
 * @returns {boolean} True se está próximo de expirar
 */
const isTokenNearExpiry = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) {
            return true;
        }

        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = decoded.exp - now;
        const oneHour = 60 * 60; // 1 hora em segundos

        return timeUntilExpiry < oneHour;
    } catch (error) {
        return true;
    }
};

module.exports = {
    authenticateToken,
    verifyCompanyAccess,
    verifyMessageOwnership,
    generateToken,
    isTokenNearExpiry,
    JWT_SECRET,
    JWT_EXPIRES_IN
};
