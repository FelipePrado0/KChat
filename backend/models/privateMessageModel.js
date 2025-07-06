// Importa a conexão com o banco de dados SQLite
const { db } = require('../utils/dbInit');

// Model para manipulação de mensagens privadas
class PrivateMessageModel {
    /**
     * Cria uma nova mensagem privada
     * @param {string} empresa - Nome da empresa
     * @param {string} remetente - Nome do remetente
     * @param {string} destinatario - Nome do destinatário
     * @param {string} mensagem - Conteúdo da mensagem
     * @param {string} anexoLink - Link opcional
     * @param {string} anexoArquivo - Arquivo opcional
     */
    static async create(empresa, remetente, destinatario, mensagem, anexoLink = null, anexoArquivo = null) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO private_messages (empresa, remetente, destinatario, mensagem, anexo_link, anexo_arquivo, criado_em)
                VALUES (?, ?, ?, ?, ?, ?, DATETIME('now', 'localtime'))
            `;
            // Executa o insert no banco
            db.run(query, [empresa, remetente, destinatario, mensagem, anexoLink, anexoArquivo], function(err) {
                if (err) {
                    reject(err);
                } else {
                    // Retorna o objeto da mensagem criada
                    resolve({
                        id: this.lastID,
                        empresa,
                        remetente,
                        destinatario,
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
     * Lista todas as mensagens privadas de um usuário
     * @param {string} empresa - Nome da empresa
     * @param {string} usuario - Nome do usuário
     */
    static async findByUsuario(empresa, usuario) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM private_messages 
                WHERE empresa = ? AND (remetente = ? OR destinatario = ?)
                ORDER BY criado_em DESC
            `;
            // Busca todas as mensagens do usuário (enviadas ou recebidas)
            db.all(query, [empresa, usuario, usuario], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Lista mensagens entre dois usuários específicos
     * @param {string} empresa - Nome da empresa
     * @param {string} usuario1 - Primeiro usuário
     * @param {string} usuario2 - Segundo usuário
     */
    static async findGroup(empresa, usuario1, usuario2) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM private_messages 
                WHERE empresa = ? 
                AND ((remetente = ? AND destinatario = ?) OR (remetente = ? AND destinatario = ?))
                ORDER BY criado_em ASC
            `;
            // Busca mensagens entre os dois usuários
            db.all(query, [empresa, usuario1, usuario2, usuario2, usuario1], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Lista todos os usuários únicos de uma empresa
     * @param {string} empresa - Nome da empresa
     */
    static async findUsuariosByEmpresa(empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT DISTINCT usuario FROM (
                    SELECT remetente as usuario FROM private_messages WHERE empresa = ?
                    UNION
                    SELECT destinatario as usuario FROM private_messages WHERE empresa = ?
                )
                ORDER BY usuario
            `;
            // Busca todos os usuários únicos que já trocaram mensagens
            db.all(query, [empresa, empresa], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => row.usuario));
                }
            });
        });
    }

    /**
     * Busca a última mensagem de uma conversa privada
     * @param {string} empresa - Nome da empresa
     * @param {string} usuario1 - Primeiro usuário
     * @param {string} usuario2 - Segundo usuário
     */
    static async findLastMessage(empresa, usuario1, usuario2) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM private_messages 
                WHERE empresa = ? 
                AND ((remetente = ? AND destinatario = ?) OR (remetente = ? AND destinatario = ?))
                ORDER BY criado_em DESC
                LIMIT 1
            `;
            // Busca a última mensagem entre os dois usuários
            db.get(query, [empresa, usuario1, usuario2, usuario2, usuario1], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}

// Exporta o model para uso nos controllers
module.exports = PrivateMessageModel; 