// Importa o model de grupos
const GroupModel = require('../models/groupModel');

// Controller para gerenciar grupos de chat
class GroupController {
    /**
     * Cria um novo grupo
     * POST /api/groups
     */
    static async createGroup(req, res) {
        try {
            const { empresa, nome_grupo } = req.body;
            if (!empresa || !nome_grupo) {
                return res.status(400).json({ success: false, message: 'Empresa e nome do grupo são obrigatórios' });
            }
            if (nome_grupo.trim().length < 2) {
                return res.status(400).json({ success: false, message: 'Nome do grupo deve ter pelo menos 2 caracteres' });
            }
            const group = await GroupModel.create(empresa, nome_grupo.trim());
            res.status(201).json({ success: true, message: 'Grupo criado com sucesso', data: group });
        } catch (error) {
            console.error('Erro ao criar grupo:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }
    static async getGroupsByEmpresa(req, res) {
        try {
            const { empresa } = req.params;
            if (!empresa) {
                return res.status(400).json({ success: false, message: 'Empresa é obrigatória' });
            }
            const groups = await GroupModel.findByEmpresa(empresa);
            res.json({ success: true, data: groups });
        } catch (error) {
            console.error('Erro ao buscar grupos:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }
    static async getGroupById(req, res) {
        try {
            const { id } = req.params;
            const { empresa } = req.query;
            if (!empresa) {
                return res.status(400).json({ success: false, message: 'Empresa é obrigatória' });
            }
            const group = await GroupModel.findById(id, empresa);
            if (!group) {
                return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
            }
            res.json({ success: true, data: group });
        } catch (error) {
            console.error('Erro ao buscar grupo:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }
    static async checkGroupExists(req, res) {
        try {
            const { id } = req.params;
            const { empresa } = req.query;
            if (!empresa) {
                return res.status(400).json({ success: false, message: 'Empresa é obrigatória' });
            }
            const exists = await GroupModel.exists(id, empresa);
            res.json({ success: true, exists });
        } catch (error) {
            console.error('Erro ao verificar grupo:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }
    static async deleteGroup(req, res) {
        try {
            const { id } = req.params;
            const { empresa } = req.query;
            if (!empresa) {
                return res.status(400).json({ success: false, message: 'Empresa é obrigatória' });
            }
            const exists = await GroupModel.exists(id, empresa);
            if (!exists) {
                return res.status(404).json({ success: false, message: 'Grupo não encontrado' });
            }
            const result = await GroupModel.delete(id, empresa);
            res.json({ success: true, message: 'Grupo removido com sucesso', data: result });
        } catch (error) {
            console.error('Erro ao remover grupo:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }
}
module.exports = GroupController; 