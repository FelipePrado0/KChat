const { db } = require('../utils/dbInit');
const bcrypt = require('bcrypt');

// Insere ou atualiza usuário pelo login
exports.upsertUsuario = (req, res) => {
    const { login, senha, nome } = req.body;
    if (!login || !senha || !nome) {
        return res.status(400).json({ error: 'Login, senha e nome são obrigatórios.' });
    }
    // Hash da senha
    const saltRounds = 10;
    bcrypt.hash(senha, saltRounds, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Erro ao gerar hash da senha.' });
        // Tenta atualizar
        db.run(
            `UPDATE usuarios SET senha = ?, nome = ? WHERE login = ?`,
            [hash, nome, login],
            function (err) {
                if (err) return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
                if (this.changes === 0) {
                    // Não existia, faz insert
                    db.run(
                        `INSERT INTO usuarios (login, senha, nome) VALUES (?, ?, ?)`,
                        [login, hash, nome],
                        function (err) {
                            if (err) {
                                if (err.code === 'SQLITE_CONSTRAINT') {
                                    return res.status(409).json({ error: 'Login já existe.' });
                                }
                                return res.status(500).json({ error: 'Erro ao inserir usuário.' });
                            }
                            return res.json({ success: true, id: this.lastID, updated: false });
                        }
                    );
                } else {
                    // Atualizado
                    return res.json({ success: true, updated: true });
                }
            }
        );
    });
};

// Lista todos os usuários (id, login, nome)
exports.listUsuarios = (req, res) => {
    db.all('SELECT id, login, nome FROM usuarios', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar usuários.' });
        res.json(rows);
    });
}; 