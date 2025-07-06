// Importa a conexão com o banco de dados SQLite
const { db } = require('../utils/dbInit');

// Model para manipulação de conversas (grupos)
class ConversationModel {
    /**
     * Cria uma nova conversa (grupo)
     * @param {string} empresa - Nome da empresa
     * @param {string} nomeGrupo - Nome do grupo
     */
    static async create(empresa, nomeGrupo) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO conversations (empresa, nome_grupo) 
                VALUES (?, ?)
            `;
            // Executa o insert no banco
            db.run(query, [empresa, nomeGrupo], function(err) {
                if (err) {
                    reject(err);
                } else {
                    // Retorna o objeto da conversa criada
                    resolve({
                        id: this.lastID,
                        empresa,
                        nome_grupo: nomeGrupo,
                        criado_em: new Date().toISOString()
                    });
                }
            });
        });
    }

    /**
     * Lista todas as conversas de uma empresa
     * @param {string} empresa - Nome da empresa
     */
    static async findByEmpresa(empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM conversations 
                WHERE empresa = ? 
                ORDER BY criado_em DESC
            `;
            // Busca todas as conversas da empresa
            db.all(query, [empresa], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Busca uma conversa por ID
     * @param {number} id - ID da conversa
     * @param {string} empresa - Nome da empresa
     */
    static async findById(id, empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM conversations 
                WHERE id = ? AND empresa = ?
            `;
            // Busca a conversa pelo ID
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
     * Verifica se uma conversa existe
     * @param {number} id - ID da conversa
     * @param {string} empresa - Nome da empresa
     */
    static async exists(id, empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT COUNT(*) as count FROM conversations 
                WHERE id = ? AND empresa = ?
            `;
            // Conta quantas conversas existem com esse ID e empresa
            db.get(query, [id, empresa], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count > 0); // true se existe
                }
            });
        });
    }
}

// Exporta o model para uso nos controllers
module.exports = ConversationModel; 