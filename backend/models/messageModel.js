const { db } = require('../utils/dbInit');

class MessageModel {
    static async create(groupId, empresa, usuario, mensagem, anexoLink = null, anexoArquivo = null) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO messages (group_id, empresa, usuario, mensagem, anexo_link, anexo_arquivo, criado_em)
                VALUES (?, ?, ?, ?, ?, ?, DATETIME('now', 'localtime'))
            `;
            
            db.run(query, [groupId, empresa, usuario, mensagem, anexoLink, anexoArquivo], function(err) {
                if (err) {
                    reject(err);
                } else {
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

    static async findByGroup(groupId, empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM messages 
                WHERE group_id = ? AND empresa = ? AND deletada = 0
                ORDER BY criado_em ASC
            `;
            
            db.all(query, [groupId, empresa], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async findById(id, empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM messages 
                WHERE id = ? AND empresa = ?
            `;
            
            db.get(query, [id, empresa], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    static async update(id, empresa, novaMensagem) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE messages 
                SET mensagem = ?, editada = 1 
                WHERE id = ? AND empresa = ?
            `;
            
            db.run(query, [novaMensagem, id, empresa], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    static async delete(id, empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE messages 
                SET deletada = 1 
                WHERE id = ? AND empresa = ?
            `;
            
            db.run(query, [id, empresa], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

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
            
            db.all(query, [empresa, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async countByGroup(groupId, empresa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT COUNT(*) as count FROM messages 
                WHERE group_id = ? AND empresa = ? AND deletada = 0
            `;
            
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

module.exports = MessageModel;
