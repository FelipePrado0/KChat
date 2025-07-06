// Importa a conexão com o banco de dados SQLite
const { db } = require('../utils/dbInit');

// Model para manipulação de mensagens
class MessageModel {
    /**
     * Cria uma nova mensagem no banco
     * @param {number} conversationId - ID do grupo
     * @param {string} empresa - Nome da empresa
     * @param {string} usuario - Nome do usuário
     * @param {string} mensagem - Texto da mensagem
     * @param {string|null} anexoLink - Link opcional
     * @param {string|null} anexoArquivo - Nome do arquivo opcional
     */
    static async create(conversationId, empresa, usuario, mensagem, anexoLink = null, anexoArquivo = null) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO messages (conversation_id, empresa, usuario, mensagem, anexo_link, anexo_arquivo) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            // Executa o insert no banco
            db.run(query, [conversationId, empresa, usuario, mensagem, anexoLink, anexoArquivo], function(err) {
                if (err) {
                    reject(err);
                } else {
                    // Retorna o objeto da mensagem criada
                    resolve({
                        id: this.lastID,
                        conversation_id: conversationId,
                        empresa,
                        usuario,
                        mensagem,
                        anexo_link: anexoLink,
                        anexo_arquivo: anexoArquivo,
                        hora: new Date().toISOString(),
                        editada: false,
                        deletada: false,
                        criado_em: new Date().toISOString()
                    });
                }
            });
        });
    }

    /**
     * Lista todas as mensagens de um grupo
     * @param {number} conversationId - ID do grupo
     * @param {string} empresa - Nome da empresa
     */
    static async findByConversation(conversationId, empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM messages 
                WHERE conversation_id = ? AND empresa = ? AND deletada = 0
                ORDER BY hora ASC
            `;
            // Busca todas as mensagens do grupo
            db.all(query, [conversationId, empresa], (err, rows) => {
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
                JOIN conversations c ON m.conversation_id = c.id
                WHERE m.empresa = ? AND m.deletada = 0
                ORDER BY m.hora DESC
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
     * @param {number} conversationId - ID do grupo
     * @param {string} empresa - Nome da empresa
     */
    static async countByConversation(conversationId, empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT COUNT(*) as count FROM messages 
                WHERE conversation_id = ? AND empresa = ? AND deletada = 0
            `;
            // Conta as mensagens do grupo
            db.get(query, [conversationId, empresa], (err, row) => {
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
