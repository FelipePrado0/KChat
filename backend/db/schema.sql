-- Tabela de conversas (grupos)
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa TEXT NOT NULL,
    nome_grupo TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    empresa TEXT NOT NULL,
    usuario TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    editada BOOLEAN DEFAULT 0,
    deletada BOOLEAN DEFAULT 0,
    anexo_link TEXT,
    anexo_arquivo TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversations_empresa ON conversations(empresa);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_empresa ON messages(empresa);
CREATE INDEX IF NOT EXISTS idx_messages_hora ON messages(hora); 