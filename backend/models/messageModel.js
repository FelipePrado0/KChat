// Importa a conexão com o banco de dados SQLite
const { db } = require('../utils/dbInit');

// Model para manipulação de mensagens
class MessageModel {
    /**
     * Cria uma nova mensagem no banco
     * @param {number} groupId - ID do grupo
     * @param {string} empresa - Nome da empresa
     * @param {string} usuario - Nome do usuário
     * @param {string} mensagem - Texto da mensagem
     * @param {string|null} anexoLink - Link opcional
     * @param {string|null} anexoArquivo - Nome do arquivo opcional
     */
    static async create(groupId, empresa, usuario, mensagem, anexoLink = null, anexoArquivo = null) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO messages (group_id, empresa, usuario, mensagem, anexo_link, anexo_arquivo, criado_em)
                VALUES (?, ?, ?, ?, ?, ?, DATETIME('now', 'localtime'))
            `;
            // Executa o insert no banco
            db.run(query, [groupId, empresa, usuario, mensagem, anexoLink, anexoArquivo], function(err) {
                if (err) {
                    reject(err);
                } else {
                    // Retorna o objeto da mensagem criada
                    resolve({
                        id: this.lastID,
                        group_id: groupId,
                        empresa,
                        usuario,
                        mensagem,
                        anexo_link: anexoLink,
                        anexo_arquivo: anexoArquivo,
                        criado_em: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                    });
                }
            });
        });
    }

    /**
     * Lista todas as mensagens de um grupo
     * @param {number} groupId - ID do grupo
     * @param {string} empresa - Nome da empresa
     */
    static async findByGroup(groupId, empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM messages 
                WHERE group_id = ? AND empresa = ? AND deletada = 0
                ORDER BY criado_em ASC
            `;
            // Busca todas as mensagens do grupo
            db.all(query, [groupId, empresa], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Busca uma mensagem por ID
     * @param {number} id - ID da mensagem
     * @param {string} empresa - Nome da empresa
     */
    static async findById(id, empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM messages 
                WHERE id = ? AND empresa = ?
            `;
            // Busca a mensagem pelo ID
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
     * Edita o texto de uma mensagem
     * @param {number} id - ID da mensagem
     * @param {string} empresa - Nome da empresa
     * @param {string} novaMensagem - Novo texto
     */
    static async update(id, empresa, novaMensagem) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE messages 
                SET mensagem = ?, editada = 1 
                WHERE id = ? AND empresa = ?
            `;
            // Atualiza a mensagem no banco
            db.run(query, [novaMensagem, id, empresa], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0); // true se alguma linha foi alterada
                }
            });
        });
    }

    /**
     * Marca uma mensagem como deletada
     * @param {number} id - ID da mensagem
     * @param {string} empresa - Nome da empresa
     */
    static async delete(id, empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE messages 
                SET deletada = 1 
                WHERE id = ? AND empresa = ?
            `;
            // Marca a mensagem como deletada
            db.run(query, [id, empresa], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0); // true se alguma linha foi alterada
                }
            });
        });
    }

    /**
     * Lista todas as mensagens de uma empresa (de todos os grupos)
     * @param {string} empresa - Nome da empresa
     * @param {number} limit - Limite de mensagens
     */
    static async findByEmpresa(empresa, limit = 100) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT m.*, c.nome_grupo 
                FROM messages m
                JOIN groups c ON m.group_id = c.id
                WHERE m.empresa = ? AND m.deletada = 0
                ORDER BY m.criado_em DESC
                LIMIT ?
            `;
            // Busca as mensagens da empresa
            db.all(query, [empresa, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Conta o número de mensagens de um grupo
     * @param {number} groupId - ID do grupo
     * @param {string} empresa - Nome da empresa
     */
    static async countByGroup(groupId, empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT COUNT(*) as count FROM messages 
                WHERE group_id = ? AND empresa = ? AND deletada = 0
            `;
            // Conta as mensagens do grupo
            db.get(query, [groupId, empresa], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }
}

// Exporta o model para uso nos controllers
module.exports = MessageModel;
