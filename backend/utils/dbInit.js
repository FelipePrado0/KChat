const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco de dados
const dbPath = path.join(__dirname, '../db/database.sqlite');

// Criar conexão com o banco
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar com o banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

// Criar tabela de empresas
const createCompaniesTable = `
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

// Criar tabela de usuários
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    company_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
)`;

// Criar tabela de mensagens
const createMessagesTable = `
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
)`;

// Criar índices para melhor performance
const createIndexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_company ON messages(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)'
];

// Função para criar as tabelas
async function initializeDatabase() {
    try {
        // Criar tabelas
        await runQuery(createCompaniesTable);
        console.log('✓ Tabela companies criada/verificada');
        
        await runQuery(createUsersTable);
        console.log('✓ Tabela users criada/verificada');
        
        await runQuery(createMessagesTable);
        console.log('✓ Tabela messages criada/verificada');
        
        // Criar índices
        for (const indexQuery of createIndexes) {
            await runQuery(indexQuery);
        }
        console.log('✓ Índices criados/verificados');
        
        // Inserir empresa padrão (Krolik)
        await insertDefaultCompany();
        
        console.log('✓ Banco de dados inicializado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Erro ao fechar conexão:', err.message);
            } else {
                console.log('Conexão com banco de dados fechada.');
            }
        });
    }
}

// Função auxiliar para executar queries
function runQuery(query) {
    return new Promise((resolve, reject) => {
        db.run(query, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
}

// Função para inserir empresa padrão
async function insertDefaultCompany() {
    const insertCompany = `
        INSERT OR IGNORE INTO companies (id, name) 
        VALUES (1, 'Krolik')
    `;
    
    try {
        await runQuery(insertCompany);
        console.log('✓ Empresa padrão (Krolik) inserida/verificada');
    } catch (error) {
        console.error('Erro ao inserir empresa padrão:', error);
    }
}

// Executar inicialização se o arquivo for executado diretamente
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase, dbPath };
