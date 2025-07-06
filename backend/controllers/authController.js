const UserModel = require('../models/userModel');
const { generateToken } = require('../middleware/authMiddleware');

class AuthController {
    constructor() {
        this.userModel = new UserModel();
    }

    /**
     * Registrar novo usuário
     * POST /api/auth/register
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async register(req, res) {
        try {
            const { name, email, password, company_id } = req.body;

            // Validações básicas
            if (!name || !email || !password || !company_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos os campos são obrigatórios'
                });
            }

            // Validar nome
            if (name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome deve ter pelo menos 2 caracteres'
                });
            }

            // Validar email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email inválido'
                });
            }

            // Validar senha
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Senha deve ter pelo menos 6 caracteres'
                });
            }

            // Validar company_id
            if (!Number.isInteger(parseInt(company_id)) || parseInt(company_id) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID da empresa inválido'
                });
            }

            // Verificar se email já existe
            const emailExists = await this.userModel.emailExists(email);
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Email já está em uso'
                });
            }

            // Criar usuário
            const userData = {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password,
                company_id: parseInt(company_id)
            };

            const newUser = await this.userModel.create(userData);

            // Gerar token JWT
            const token = generateToken(newUser);

            // Retornar resposta de sucesso
            res.status(201).json({
                success: true,
                message: 'Usuário registrado com sucesso',
                data: {
                    user: {
                        id: newUser.id,
                        name: newUser.name,
                        email: newUser.email,
                        company_id: newUser.company_id,
                        company_name: newUser.company_name,
                        created_at: newUser.created_at
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Erro no registro:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Fazer login do usuário
     * POST /api/auth/login
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validações básicas
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email e senha são obrigatórios'
                });
            }

            // Buscar usuário por email
            const user = await this.userModel.getByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ou senha incorretos'
                });
            }

            // Verificar senha
            const isPasswordValid = await this.userModel.verifyPassword(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ou senha incorretos'
                });
            }

            // Gerar token JWT
            const token = generateToken(user);

            // Retornar resposta de sucesso
            res.status(200).json({
                success: true,
                message: 'Login realizado com sucesso',
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        company_id: user.company_id,
                        company_name: user.company_name,
                        created_at: user.created_at
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Obter perfil do usuário autenticado
     * GET /api/auth/profile
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await this.userModel.getById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        company_id: user.company_id,
                        company_name: user.company_name,
                        created_at: user.created_at,
                        updated_at: user.updated_at
                    }
                }
            });

        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Atualizar perfil do usuário
     * PUT /api/auth/profile
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { name, email, currentPassword, newPassword } = req.body;

            // Validações básicas
            if (!name && !email && !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Pelo menos um campo deve ser fornecido para atualização'
                });
            }

            // Buscar usuário atual
            const currentUser = await this.userModel.getByEmail(req.user.email);
            if (!currentUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            const updateData = {};

            // Validar e adicionar nome
            if (name) {
                if (name.trim().length < 2) {
                    return res.status(400).json({
                        success: false,
                        message: 'Nome deve ter pelo menos 2 caracteres'
                    });
                }
                updateData.name = name.trim();
            }

            // Validar e adicionar email
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email inválido'
                    });
                }

                // Verificar se email já existe (excluindo o usuário atual)
                const emailExists = await this.userModel.emailExists(email, userId);
                if (emailExists) {
                    return res.status(409).json({
                        success: false,
                        message: 'Email já está em uso'
                    });
                }
                updateData.email = email.toLowerCase().trim();
            }

            // Validar e adicionar nova senha
            if (newPassword) {
                if (!currentPassword) {
                    return res.status(400).json({
                        success: false,
                        message: 'Senha atual é obrigatória para alterar a senha'
                    });
                }

                // Verificar senha atual
                const isCurrentPasswordValid = await this.userModel.verifyPassword(currentPassword, currentUser.password);
                if (!isCurrentPasswordValid) {
                    return res.status(401).json({
                        success: false,
                        message: 'Senha atual incorreta'
                    });
                }

                if (newPassword.length < 6) {
                    return res.status(400).json({
                        success: false,
                        message: 'Nova senha deve ter pelo menos 6 caracteres'
                    });
                }
                updateData.password = newPassword;
            }

            // Atualizar usuário
            const updatedUser = await this.userModel.update(userId, updateData);

            res.status(200).json({
                success: true,
                message: 'Perfil atualizado com sucesso',
                data: {
                    user: {
                        id: updatedUser.id,
                        name: updatedUser.name,
                        email: updatedUser.email,
                        company_id: updatedUser.company_id,
                        company_name: updatedUser.company_name,
                        created_at: updatedUser.created_at,
                        updated_at: updatedUser.updated_at
                    }
                }
            });

        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Fazer logout (invalidar token)
     * POST /api/auth/logout
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async logout(req, res) {
        try {
            // Em uma implementação mais robusta, você poderia adicionar o token
            // a uma blacklist ou usar refresh tokens. Por simplicidade,
            // apenas retornamos sucesso e o cliente remove o token localmente.
            
            res.status(200).json({
                success: true,
                message: 'Logout realizado com sucesso'
            });

        } catch (error) {
            console.error('Erro no logout:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    /**
     * Verificar se token é válido
     * GET /api/auth/verify
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async verifyToken(req, res) {
        try {
            // Se chegou até aqui, o token é válido (middleware já verificou)
            res.status(200).json({
                success: true,
                message: 'Token válido',
                data: {
                    user: req.user
                }
            });

        } catch (error) {
            console.error('Erro na verificação do token:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
}

module.exports = AuthController;
