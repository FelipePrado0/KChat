const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco de dados
const dbPath = path.join(__dirname, '../db/database.sqlite');

class MessageModel {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
    }

    /**
     * Criar uma nova mensagem
     * @param {Object} messageData - Dados da mensagem
     * @param {string} messageData.content - Conteúdo da mensagem
     * @param {number} messageData.user_id - ID do usuário que enviou
     * @param {number} messageData.company_id - ID da empresa
     * @returns {Promise<Object>} Mensagem criada
     */
    async create(messageData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO messages (content, user_id, company_id)
                VALUES (?, ?, ?)
            `;
            
            this.db.run(query, [messageData.content, messageData.user_id, messageData.company_id], function(err) {
                if (err) {
                    return reject(err);
                }
                
                // Retornar mensagem criada
                this.getById(this.lastID)
                    .then(message => resolve(message))
                    .catch(reject);
            }.bind(this));
        });
    }

    /**
     * Buscar mensagem por ID (com verificação de empresa)
     * @param {number} id - ID da mensagem
     * @param {number} companyId - ID da empresa para verificação
     * @returns {Promise<Object|null>} Mensagem encontrada ou null
     */
    async getById(id, companyId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT m.id, m.content, m.user_id, m.company_id, m.created_at, m.updated_at,
                       u.name as user_name, u.email as user_email,
                       c.name as company_name
                FROM messages m
                JOIN users u ON m.user_id = u.id
                JOIN companies c ON m.company_id = c.id
                WHERE m.id = ? AND m.company_id = ?
            `;
            
            this.db.get(query, [id, companyId], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row || null);
            });
        });
    }

    /**
     * Buscar mensagens por empresa (com paginação)
     * @param {number} companyId - ID da empresa
     * @param {number} limit - Limite de mensagens por página
     * @param {number} offset - Offset para paginação
     * @returns {Promise<Array>} Lista de mensagens da empresa
     */
    async getByCompany(companyId, limit = 50, offset = 0) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT m.id, m.content, m.user_id, m.company_id, m.created_at, m.updated_at,
                       u.name as user_name, u.email as user_email,
                       c.name as company_name
                FROM messages m
                JOIN users u ON m.user_id = u.id
                JOIN companies c ON m.company_id = c.id
                WHERE m.company_id = ?
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            this.db.all(query, [companyId, limit, offset], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows || []);
            });
        });
    }

    /**
     * Buscar mensagens mais recentes por empresa
     * @param {number} companyId - ID da empresa
     * @param {number} limit - Limite de mensagens
     * @returns {Promise<Array>} Lista das mensagens mais recentes
     */
    async getRecentByCompany(companyId, limit = 20) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT m.id, m.content, m.user_id, m.company_id, m.created_at, m.updated_at,
                       u.name as user_name, u.email as user_email,
                       c.name as company_name
                FROM messages m
                JOIN users u ON m.user_id = u.id
                JOIN companies c ON m.company_id = c.id
                WHERE m.company_id = ?
                ORDER BY m.created_at DESC
                LIMIT ?
            `;
            
            this.db.all(query, [companyId, limit], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows || []);
            });
        });
    }

    /**
     * Buscar mensagens por usuário (dentro da mesma empresa)
     * @param {number} userId - ID do usuário
     * @param {number} companyId - ID da empresa
     * @param {number} limit - Limite de mensagens
     * @param {number} offset - Offset para paginação
     * @returns {Promise<Array>} Lista de mensagens do usuário
     */
    async getByUser(userId, companyId, limit = 50, offset = 0) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT m.id, m.content, m.user_id, m.company_id, m.created_at, m.updated_at,
                       u.name as user_name, u.email as user_email,
                       c.name as company_name
                FROM messages m
                JOIN users u ON m.user_id = u.id
                JOIN companies c ON m.company_id = c.id
                WHERE m.user_id = ? AND m.company_id = ?
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            this.db.all(query, [userId, companyId, limit, offset], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows || []);
            });
        });
    }

    /**
     * Atualizar mensagem (apenas pelo autor)
     * @param {number} id - ID da mensagem
     * @param {number} userId - ID do usuário que está editando
     * @param {number} companyId - ID da empresa
     * @param {Object} updateData - Dados para atualizar
     * @returns {Promise<Object>} Mensagem atualizada
     */
    async update(id, userId, companyId, updateData) {
        return new Promise((resolve, reject) => {
            // Primeiro verificar se a mensagem pertence ao usuário e à empresa
            const verifyQuery = `
                SELECT id FROM messages 
                WHERE id = ? AND user_id = ? AND company_id = ?
            `;
            
            this.db.get(verifyQuery, [id, userId, companyId], (err, row) => {
                if (err) {
                    return reject(err);
                }
                
                if (!row) {
                    return reject(new Error('Mensagem não encontrada ou sem permissão para editar'));
                }
                
                // Atualizar mensagem
                const updateQuery = `
                    UPDATE messages 
                    SET content = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                `;
                
                this.db.run(updateQuery, [updateData.content, id], function(err) {
                    if (err) {
                        return reject(err);
                    }
                    
                    this.getById(id, companyId)
                        .then(message => resolve(message))
                        .catch(reject);
                }.bind(this));
            });
        });
    }

    /**
     * Deletar mensagem (apenas pelo autor)
     * @param {number} id - ID da mensagem
     * @param {number} userId - ID do usuário que está deletando
     * @param {number} companyId - ID da empresa
     * @returns {Promise<boolean>} True se deletado com sucesso
     */
    async delete(id, userId, companyId) {
        return new Promise((resolve, reject) => {
            // Primeiro verificar se a mensagem pertence ao usuário e à empresa
            const verifyQuery = `
                SELECT id FROM messages 
                WHERE id = ? AND user_id = ? AND company_id = ?
            `;
            
            this.db.get(verifyQuery, [id, userId, companyId], (err, row) => {
                if (err) {
                    return reject(err);
                }
                
                if (!row) {
                    return reject(new Error('Mensagem não encontrada ou sem permissão para deletar'));
                }
                
                // Deletar mensagem
                const deleteQuery = 'DELETE FROM messages WHERE id = ?';
                
                this.db.run(deleteQuery, [id], function(err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(this.changes > 0);
                });
            });
        });
    }

    /**
     * Contar mensagens por empresa
     * @param {number} companyId - ID da empresa
     * @returns {Promise<number>} Número total de mensagens
     */
    async countByCompany(companyId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as count FROM messages WHERE company_id = ?';
            
            this.db.get(query, [companyId], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row.count);
            });
        });
    }

    /**
     * Buscar mensagens por data (dentro da empresa)
     * @param {number} companyId - ID da empresa
     * @param {string} startDate - Data inicial (YYYY-MM-DD)
     * @param {string} endDate - Data final (YYYY-MM-DD)
     * @returns {Promise<Array>} Lista de mensagens no período
     */
    async getByDateRange(companyId, startDate, endDate) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT m.id, m.content, m.user_id, m.company_id, m.created_at, m.updated_at,
                       u.name as user_name, u.email as user_email,
                       c.name as company_name
                FROM messages m
                JOIN users u ON m.user_id = u.id
                JOIN companies c ON m.company_id = c.id
                WHERE m.company_id = ? 
                AND DATE(m.created_at) BETWEEN ? AND ?
                ORDER BY m.created_at DESC
            `;
            
            this.db.all(query, [companyId, startDate, endDate], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows || []);
            });
        });
    }

    /**
     * Fechar conexão com o banco
     */
    close() {
        this.db.close();
    }
}

module.exports = MessageModel;
