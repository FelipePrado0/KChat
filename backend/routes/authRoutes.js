const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Instanciar controlador
const authController = new AuthController();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar novo usuário
 * @access  Public
 * @body    { name, email, password, company_id }
 */
router.post('/register', async (req, res) => {
    await authController.register(req, res);
});

/**
 * @route   POST /api/auth/login
 * @desc    Fazer login do usuário
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', async (req, res) => {
    await authController.login(req, res);
});

/**
 * @route   GET /api/auth/profile
 * @desc    Obter perfil do usuário autenticado
 * @access  Private
 * @header  Authorization: Bearer <token>
 */
router.get('/profile', authenticateToken, async (req, res) => {
    await authController.getProfile(req, res);
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Atualizar perfil do usuário
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    { name?, email?, currentPassword?, newPassword? }
 */
router.put('/profile', authenticateToken, async (req, res) => {
    await authController.updateProfile(req, res);
});

/**
 * @route   POST /api/auth/logout
 * @desc    Fazer logout do usuário
 * @access  Private
 * @header  Authorization: Bearer <token>
 */
router.post('/logout', authenticateToken, async (req, res) => {
    await authController.logout(req, res);
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verificar se token é válido
 * @access  Private
 * @header  Authorization: Bearer <token>
 */
router.get('/verify', authenticateToken, async (req, res) => {
    await authController.verifyToken(req, res);
});

module.exports = router;
