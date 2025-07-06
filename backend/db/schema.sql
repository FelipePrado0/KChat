-- Tabela de grupos (antes conversations)
CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa TEXT NOT NULL,
    nome_grupo TEXT NOT NULL,
    criado_em DATETIME DEFAULT (DATETIME('now', 'localtime')),
    modificado_em DATETIME,
    deletado_em DATETIME
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
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
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_groups_empresa ON groups(empresa);
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_empresa ON messages(empresa);
CREATE INDEX IF NOT EXISTS idx_messages_criado_em ON messages(criado_em);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    nome TEXT NOT NULL,
    criado_em DATETIME DEFAULT (DATETIME('now', 'localtime')),
    modificado_em DATETIME,
    deletado_em DATETIME
);

-- Tabela de logs da API
CREATE TABLE IF NOT EXISTS api_logs (
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
);

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cnpj TEXT NOT NULL UNIQUE,
    email TEXT,
    telefone TEXT,
    endereco TEXT,
    criado_em DATETIME DEFAULT (DATETIME('now', 'localtime')),
    modificado_em DATETIME,
    deletado_em DATETIME
); 