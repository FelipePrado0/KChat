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

// Função para inicializar o banco de dados (cria tabelas se não existirem)
function initializeDatabase() {
    return new Promise((resolve, reject) => {
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
                resolve();
            }
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

// Exporta o banco e as funções para uso externo
module.exports = {
    db,
    initializeDatabase,
    closeDatabase
};
