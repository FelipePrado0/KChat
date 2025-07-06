const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Caminho para o banco de dados
const dbPath = path.join(__dirname, '../db/database.sqlite');

class UserModel {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
    }

    /**
     * Criar um novo usuário
     * @param {Object} userData - Dados do usuário
     * @param {string} userData.name - Nome do usuário
     * @param {string} userData.email - Email do usuário
     * @param {string} userData.password - Senha do usuário
     * @param {number} userData.company_id - ID da empresa
     * @returns {Promise<Object>} Usuário criado
     */
    async create(userData) {
        return new Promise((resolve, reject) => {
            // Hash da senha
            const saltRounds = 12;
            bcrypt.hash(userData.password, saltRounds, (err, hash) => {
                if (err) {
                    return reject(err);
                }

                const query = `
                    INSERT INTO users (name, email, password, company_id)
                    VALUES (?, ?, ?, ?)
                `;
                
                this.db.run(query, [userData.name, userData.email, hash, userData.company_id], function(err) {
                    if (err) {
                        return reject(err);
                    }
                    
                    // Retornar usuário criado (sem a senha)
                    this.getById(this.lastID)
                        .then(user => resolve(user))
                        .catch(reject);
                }.bind(this));
            });
        });
    }

    /**
     * Buscar usuário por ID
     * @param {number} id - ID do usuário
     * @returns {Promise<Object|null>} Usuário encontrado ou null
     */
    async getById(id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT u.id, u.name, u.email, u.company_id, u.created_at, u.updated_at,
                       c.name as company_name
                FROM users u
                JOIN companies c ON u.company_id = c.id
                WHERE u.id = ?
            `;
            
            this.db.get(query, [id], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row || null);
            });
        });
    }

    /**
     * Buscar usuário por email
     * @param {string} email - Email do usuário
     * @returns {Promise<Object|null>} Usuário encontrado ou null
     */
    async getByEmail(email) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT u.id, u.name, u.email, u.password, u.company_id, u.created_at, u.updated_at,
                       c.name as company_name
                FROM users u
                JOIN companies c ON u.company_id = c.id
                WHERE u.email = ?
            `;
            
            this.db.get(query, [email], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row || null);
            });
        });
    }

    /**
     * Buscar usuários por empresa
     * @param {number} companyId - ID da empresa
     * @returns {Promise<Array>} Lista de usuários da empresa
     */
    async getByCompany(companyId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT u.id, u.name, u.email, u.company_id, u.created_at, u.updated_at,
                       c.name as company_name
                FROM users u
                JOIN companies c ON u.company_id = c.id
                WHERE u.company_id = ?
                ORDER BY u.name
            `;
            
            this.db.all(query, [companyId], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows || []);
            });
        });
    }

    /**
     * Atualizar dados do usuário
     * @param {number} id - ID do usuário
     * @param {Object} updateData - Dados para atualizar
     * @returns {Promise<Object>} Usuário atualizado
     */
    async update(id, updateData) {
        return new Promise((resolve, reject) => {
            let query = 'UPDATE users SET ';
            const params = [];
            const updates = [];

            // Construir query dinamicamente
            if (updateData.name) {
                updates.push('name = ?');
                params.push(updateData.name);
            }
            if (updateData.email) {
                updates.push('email = ?');
                params.push(updateData.email);
            }
            if (updateData.password) {
                // Hash da nova senha
                bcrypt.hash(updateData.password, 12, (err, hash) => {
                    if (err) {
                        return reject(err);
                    }
                    updates.push('password = ?');
                    params.push(hash);
                    params.push(id);
                    
                    query += updates.join(', ') + ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
                    
                    this.db.run(query, params, function(err) {
                        if (err) {
                            return reject(err);
                        }
                        
                        this.getById(id)
                            .then(user => resolve(user))
                            .catch(reject);
                    }.bind(this));
                });
                return;
            }

            if (updates.length === 0) {
                return reject(new Error('Nenhum dado para atualizar'));
            }

            params.push(id);
            query += updates.join(', ') + ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            
            this.db.run(query, params, function(err) {
                if (err) {
                    return reject(err);
                }
                
                this.getById(id)
                    .then(user => resolve(user))
                    .catch(reject);
            }.bind(this));
        });
    }

    /**
     * Deletar usuário
     * @param {number} id - ID do usuário
     * @returns {Promise<boolean>} True se deletado com sucesso
     */
    async delete(id) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM users WHERE id = ?';
            
            this.db.run(query, [id], function(err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.changes > 0);
            });
        });
    }

    /**
     * Verificar se email já existe
     * @param {string} email - Email para verificar
     * @param {number} excludeId - ID do usuário a excluir da verificação (para updates)
     * @returns {Promise<boolean>} True se email existe
     */
    async emailExists(email, excludeId = null) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
            const params = [email];
            
            if (excludeId) {
                query += ' AND id != ?';
                params.push(excludeId);
            }
            
            this.db.get(query, params, (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row.count > 0);
            });
        });
    }

    /**
     * Verificar senha do usuário
     * @param {string} password - Senha em texto plano
     * @param {string} hashedPassword - Senha hash
     * @returns {Promise<boolean>} True se senha está correta
     */
    async verifyPassword(password, hashedPassword) {
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, hashedPassword, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
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

module.exports = UserModel;
