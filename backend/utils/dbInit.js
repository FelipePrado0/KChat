// Importa módulos necessários
const sqlite3 = require('sqlite3').verbose(); // Driver SQLite para Node.js
const path = require('path'); // Utilitário de caminhos
const fs = require('fs'); // Sistema de arquivos

// Caminho para o arquivo do banco de dados SQLite
const dbPath = path.join(__dirname, '../db/database.sqlite');

// Garante que o diretório do banco existe
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Cria a conexão com o banco de dados
const db = new sqlite3.Database(dbPath);

console.log('Usando banco de dados em:', dbPath);

// Função para inicializar o banco de dados (cria tabelas se não existirem)
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // Cria a tabela groups antes de qualquer coisa
        db.run(`CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa TEXT NOT NULL,
            nome_grupo TEXT NOT NULL,
            criado_em DATETIME DEFAULT (DATETIME('now', 'localtime')),
            modificado_em DATETIME,
            deletado_em DATETIME
        );`, (err) => {
            if (err) {
                console.error('Erro ao criar tabela groups:', err);
                reject(err);
                return;
            } else {
                console.log('✓ Tabela groups criada/verificada');
            }

            // Lê o arquivo de schema SQL
            const schemaPath = path.join(__dirname, '../db/schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            // Executa o schema no banco (cria tabelas)
            db.exec(schema, (err) => {
                if (err) {
                    console.error('Erro ao inicializar banco de dados:', err);
                    reject(err);
                } else {
                    console.log('Banco de dados inicializado com sucesso!');

                    // Cria a tabela de mensagens se não existir
                    db.run(`
                        CREATE TABLE IF NOT EXISTS messages (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            group_id INTEGER NOT NULL,
                            empresa TEXT NOT NULL,
                            usuario TEXT NOT NULL,
                            mensagem TEXT NOT NULL,
                            anexo_link TEXT,
                            anexo_arquivo TEXT,
                            editada BOOLEAN DEFAULT 0,
                            hora DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (group_id) REFERENCES groups (id)
                        )
                    `, (err) => {
                        if (err) {
                            console.error('Erro ao criar tabela messages:', err);
                        } else {
                            console.log('✓ Tabela messages criada/verificada');
                        }
                    });

                    // Cria a tabela de mensagens privadas se não existir
                    db.run(`
                        CREATE TABLE IF NOT EXISTS private_messages (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            empresa TEXT NOT NULL,
                            remetente TEXT NOT NULL,
                            destinatario TEXT NOT NULL,
                            mensagem TEXT NOT NULL,
                            anexo_link TEXT,
                            anexo_arquivo TEXT,
                            criado_em DATETIME DEFAULT (DATETIME('now', 'localtime')),
                            modificado_em DATETIME,
                            deletado_em DATETIME
                        )
                    `, (err) => {
                        if (err) {
                            console.error('Erro ao criar tabela private_messages:', err);
                        } else {
                            console.log('✓ Tabela private_messages criada/verificada');
                        }
                    });

                    resolve();
                }
            });
        });
    });
}

// Função para fechar a conexão com o banco
function closeDatabase() {
    return new Promise((resolve) => {
        db.close((err) => {
            if (err) {
                console.error('Erro ao fechar banco de dados:', err);
            } else {
                console.log('Conexão com banco de dados fechada.');
            }
            resolve();
        });
    });
}

// Função para registrar logs na tabela api_logs
function logApi({ empresa, rota, metodo, status_code, mensagem, body_request, body_response, erro }) {
    db.run(
        `INSERT INTO api_logs (empresa, rota, metodo, status_code, mensagem, body_request, body_response, erro, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now', 'localtime'))`,
        [
            empresa || null,
            rota,
            metodo,
            status_code || null,
            mensagem || null,
            body_request ? JSON.stringify(body_request) : null,
            body_response ? JSON.stringify(body_response) : null,
            erro || null
        ],
        (err) => {
            if (err) {
                console.error('Erro ao registrar log da API:', err);
            }
        }
    );
}

// Função para migrar a tabela api_logs para o novo formato
function migrateApiLogsTable() {
    db.serialize(() => {
        // Adiciona coluna empresa se não existir
        db.get("PRAGMA table_info(api_logs)", (err, info) => {
            if (err) return;
            db.all("PRAGMA table_info(api_logs)", (err, columns) => {
                if (err) return;
                const colNames = columns.map(c => c.name);
                if (!colNames.includes('empresa')) {
                    db.run("ALTER TABLE api_logs ADD COLUMN empresa TEXT", () => {});
                }
                // Renomeia colunas se necessário
                if (colNames.includes('corpo_requisicao')) {
                    db.run("ALTER TABLE api_logs RENAME TO api_logs_old", () => {
                        db.run(`CREATE TABLE IF NOT EXISTS api_logs (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            empresa TEXT,
                            rota TEXT NOT NULL,
                            metodo TEXT NOT NULL,
                            status_code INTEGER,
                            mensagem TEXT,
                            body_request TEXT,
                            body_response TEXT,
                            erro TEXT,
                            criado_em DATETIME DEFAULT (DATETIME('now', 'localtime'))
                        )`, () => {
                            db.run(`INSERT INTO api_logs (id, empresa, rota, metodo, status_code, mensagem, body_request, body_response, erro, criado_em)
                                SELECT id, NULL, rota, metodo, status_code, mensagem, corpo_requisicao, corpo_resposta, erro, criado_em FROM api_logs_old`, () => {
                                db.run("DROP TABLE api_logs_old", () => {});
                            });
                        });
                    });
                }
            });
        });
    });
}

// Função para remover a coluna 'hora' das tabelas messages e private_messages
function migrateRemoveHoraColumn() {
    db.serialize(() => {
        // Remover de messages
        db.all("PRAGMA table_info(messages)", (err, columns) => {
            if (err) return;
            const colNames = columns.map(c => c.name);
            if (colNames.includes('hora')) {
                db.run("ALTER TABLE messages RENAME TO messages_old", () => {
                    db.run(`CREATE TABLE IF NOT EXISTS messages (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        group_id INTEGER NOT NULL,
                        empresa TEXT NOT NULL,
                        usuario TEXT NOT NULL,
                        mensagem TEXT NOT NULL,
                        editada BOOLEAN DEFAULT 0,
                        deletada BOOLEAN DEFAULT 0,
                        anexo_link TEXT,
                        anexo_arquivo TEXT,
                        criado_em DATETIME DEFAULT (DATETIME('now', 'localtime')),
                        modificado_em DATETIME,
                        deletado_em DATETIME,
                        FOREIGN KEY (group_id) REFERENCES groups(id)
                    )`, () => {
                        db.run(`INSERT INTO messages (id, group_id, empresa, usuario, mensagem, editada, deletada, anexo_link, anexo_arquivo, criado_em, modificado_em, deletado_em)
                            SELECT id, group_id, empresa, usuario, mensagem, editada, deletada, anexo_link, anexo_arquivo, criado_em, modificado_em, deletado_em FROM messages_old`, () => {
                            db.run("DROP TABLE messages_old", () => {});
                        });
                    });
                });
            }
        });
        // Remover de private_messages
        db.all("PRAGMA table_info(private_messages)", (err, columns) => {
            if (err) return;
            const colNames = columns.map(c => c.name);
            if (colNames.includes('hora')) {
                db.run("ALTER TABLE private_messages RENAME TO private_messages_old", () => {
                    db.run(`CREATE TABLE IF NOT EXISTS private_messages (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        empresa TEXT NOT NULL,
                        remetente TEXT NOT NULL,
                        destinatario TEXT NOT NULL,
                        mensagem TEXT NOT NULL,
                        anexo_link TEXT,
                        anexo_arquivo TEXT,
                        criado_em DATETIME DEFAULT (DATETIME('now', 'localtime')),
                        modificado_em DATETIME,
                        deletado_em DATETIME
                    )`, () => {
                        db.run(`INSERT INTO private_messages (id, empresa, remetente, destinatario, mensagem, anexo_link, anexo_arquivo, criado_em, modificado_em, deletado_em)
                            SELECT id, empresa, remetente, destinatario, mensagem, anexo_link, anexo_arquivo, criado_em, modificado_em, deletado_em FROM private_messages_old`, () => {
                            db.run("DROP TABLE private_messages_old", () => {});
                        });
                    });
                });
            }
        });
    });
}

// Função para verificar e corrigir a estrutura da tabela groups
function verifyGroupsTable() {
    db.serialize(() => {
        // Verifica se a tabela groups existe e tem a estrutura correta
        db.all("PRAGMA table_info(groups)", (err, columns) => {
            if (err) {
                console.log('Tabela groups não existe, será criada pelo schema');
                return;
            }
            
            const colNames = columns.map(c => c.name);
            console.log('✓ Estrutura da tabela groups verificada:', colNames);
            
            // Verifica se todas as colunas necessárias existem
            const requiredColumns = ['id', 'empresa', 'nome_grupo', 'criado_em', 'modificado_em', 'deletado_em'];
            const missingColumns = requiredColumns.filter(col => !colNames.includes(col));
            
            if (missingColumns.length > 0) {
                console.log('⚠️ Colunas faltando na tabela groups:', missingColumns);
            } else {
                console.log('✓ Tabela groups está com estrutura correta');
            }
        });
    });
}

// Chama as migrações ao inicializar o banco
initializeDatabase().then(() => {
    migrateApiLogsTable();
    migrateRemoveHoraColumn();
    verifyGroupsTable();
});

// Exporta o banco e as funções para uso externo
module.exports = {
    db,
    initializeDatabase,
    closeDatabase,
    logApi
};
