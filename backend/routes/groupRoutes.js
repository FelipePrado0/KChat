// Importa o framework Express
const express = require('express');
const router = express.Router();
// Importa o controller de grupos
const GroupController = require('../controllers/groupController');

// Rota para criar novo grupo
// POST /api/groups
router.post('/groups', GroupController.createGroup);

// Rota para listar grupos de uma empresa
// GET /api/groups/empresa/:empresa
router.get('/groups/empresa/:empresa', GroupController.getGroupsByEmpresa);

// Rota alternativa para listar grupos de uma empresa (compatibilidade)
router.get('/groups/:empresa', GroupController.getGroupsByEmpresa);

// Rota para buscar grupo por ID
// GET /api/groups/:id?empresa=XXX
router.get('/groups/:id', GroupController.getGroupById);

// Rota para verificar se grupo existe
// GET /api/groups/:id/exists?empresa=XXX
router.get('/groups/:id/exists', GroupController.checkGroupExists);

// Rota para remover grupo e suas mensagens
// DELETE /api/groups/:id?empresa=XXX
router.delete('/groups/:id', GroupController.deleteGroup);

// Exporta o router para uso no server.js
module.exports = router; 