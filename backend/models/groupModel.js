// Importa a conexão com o banco de dados SQLite
const { db } = require('../utils/dbInit');

// Model para manipulação de grupos
class GroupModel {
    /**
     * Cria um novo grupo
     * @param {string} empresa - Nome da empresa
     * @param {string} nomeGrupo - Nome do grupo
     */
    static async create(empresa, nomeGrupo) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO groups (empresa, nome_grupo, criado_em)
                VALUES (?, ?, DATETIME('now', 'localtime'))
            `;
            // Executa o insert no banco
            db.run(query, [empresa, nomeGrupo], function(err) {
                if (err) {
                    reject(err);
                } else {
                    // Retorna o objeto do grupo criado
                    resolve({
                        id: this.lastID,
                        empresa,
                        nome_grupo: nomeGrupo,
                        criado_em: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                    });
                }
            });
        });
    }

    /**
     * Lista todos os grupos de uma empresa
     * @param {string} empresa - Nome da empresa
     */
    static async findByEmpresa(empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM groups 
                WHERE empresa = ? 
                ORDER BY criado_em DESC
            `;
            console.log('🔍 Query executada:', query);
            console.log('🔍 Parâmetro empresa:', empresa);
            
            // Busca todos os grupos da empresa
            db.all(query, [empresa], (err, rows) => {
                if (err) {
                    console.error('❌ Erro na query:', err);
                    reject(err);
                } else {
                    console.log('📋 Resultado da query:', rows);
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Busca um grupo por ID
     * @param {number} id - ID do grupo
     * @param {string} empresa - Nome da empresa
     */
    static async findById(id, empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM groups 
                WHERE id = ? AND empresa = ?
            `;
            // Busca o grupo pelo ID
            db.get(query, [id, empresa], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Verifica se um grupo existe
     * @param {number} id - ID do grupo
     * @param {string} empresa - Nome da empresa
     */
    static async exists(id, empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT COUNT(*) as count FROM groups 
                WHERE id = ? AND empresa = ?
            `;
            // Conta quantos grupos existem com esse ID e empresa
            db.get(query, [id, empresa], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count > 0); // true se existe
                }
            });
        });
    }

    /**
     * Remove um grupo e todas as suas mensagens
     * @param {number} id - ID do grupo
     * @param {string} empresa - Nome da empresa
     */
    static async delete(id, empresa) {
        return new Promise((resolve, reject) => {
            // Primeiro remove todas as mensagens do grupo
            const deleteMessagesQuery = `
                DELETE FROM messages 
                WHERE group_id = ? AND empresa = ?
            `;
            
            // Depois remove o grupo
            const deleteGroupQuery = `
                DELETE FROM groups 
                WHERE id = ? AND empresa = ?
            `;
            
            // Executa as operações em sequência
            db.run(deleteMessagesQuery, [id, empresa], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Remove o grupo
                db.run(deleteGroupQuery, [id, empresa], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            success: true,
                            messagesDeleted: this.changes,
                            groupDeleted: true
                        });
                    }
                });
            });
        });
    }
}

// Exporta o model para uso nos controllers
module.exports = GroupModel; 