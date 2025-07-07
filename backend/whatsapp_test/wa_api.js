const express = require('express');
const { Boom } = require('@hapi/boom');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeInMemoryStore } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());
app.use(cors());

const upload = multer({ dest: path.join(__dirname, 'uploads'), limits: { fileSize: 10 * 1024 * 1024 } });

let sock;
let isReady = false;

const DB_PATH = path.join(__dirname, 'whatsapp.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS mensagens_whatsapp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        msg_id TEXT,
        from_jid TEXT,
        content TEXT,
        timestamp INTEGER,
        type TEXT,
        criado_em TEXT,
        deletado_em TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS api_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT,
        payload TEXT,
        response TEXT,
        error TEXT,
        criado_em TEXT
    )`);
});

function nowGmt3() {
    const date = new Date();
    // Ajusta para GMT-3
    date.setHours(date.getHours() - 3);
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

function logApi(endpoint, payload, response, error = null) {
    db.run(
        `INSERT INTO api_logs (endpoint, payload, response, error, criado_em) VALUES (?, ?, ?, ?, ?)` ,
        [endpoint, JSON.stringify(payload), JSON.stringify(response), error ? String(error) : null, nowGmt3()]
    );
}

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('🟢 Frontend conectado ao Socket.io:', socket.id);
});

(async () => {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'baileys_auth'));
    const { version } = await fetchLatestBaileysVersion();
    sock = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: state,
        syncFullHistory: false,
        getMessage: async () => undefined
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
            io.emit('qr', qr);
        }
        if (connection === 'open') {
            isReady = true;
            console.log('✅ Conectado ao WhatsApp via Baileys!');
        } else if (connection === 'close') {
            isReady = false;
            const reason = lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output.statusCode : lastDisconnect?.error;
            console.log('🔌 Conexão fechada:', reason);
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (!m.messages || !m.messages[0]) return;
        const msg = m.messages[0];
        if (msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[Mídia ou mensagem não textual]';
        const type = Object.keys(msg.message || {})[0] || 'unknown';
        const msg_id = msg.key.id;
        const timestamp = msg.messageTimestamp;
        const criado_em = nowGmt3();
        console.log(`📩 Mensagem recebida de ${from}: ${body}`);
        db.run(
            `INSERT INTO mensagens_whatsapp (msg_id, from_jid, content, timestamp, type, criado_em, deletado_em) VALUES (?, ?, ?, ?, ?, ?, NULL)` ,
            [msg_id, from, body, timestamp, type, criado_em],
            (err) => {
                if (err) {
                    console.error('Erro ao salvar mensagem no banco:', err);
                } else {
                    console.log('💾 Mensagem salva no banco de dados.');
                }
            }
        );
    });
})();

function formatTo(to) {
    if (to.endsWith('@s.whatsapp.net') || to.endsWith('@g.us')) return to;
    const onlyNumbers = to.replace(/\D/g, '');
    if (to.includes('-')) return onlyNumbers + '@g.us';
    return '55' + onlyNumbers + '@s.whatsapp.net';
}

app.post('/send-message', async (req, res) => {
    if (!isReady) return res.status(400).json({ success: false, message: 'WhatsApp não está conectado.' });
    let { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ success: false, message: 'Parâmetros "to" e "message" são obrigatórios.' });
    to = formatTo(to);
    console.log('[API] Enviando mensagem para:', to, '| Conteúdo:', message);
    let response = null, error = null;
    try {
        await sock.sendMessage(to, { text: message });
        response = { success: true };
        res.json(response);
    } catch (err) {
        error = err;
        response = { success: false, message: err.message };
        res.status(500).json(response);
    }
    logApi('/send-message', { to, message }, response, error);
});

app.post('/send-media', upload.single('file'), async (req, res) => {
    if (!isReady) return res.status(400).json({ success: false, message: 'WhatsApp não está conectado.' });
    let { to, caption } = req.body;
    if (!to || !req.file) return res.status(400).json({ success: false, message: 'Parâmetros "to" e arquivo são obrigatórios.' });
    to = formatTo(to);
    console.log('[API] Enviando arquivo para:', to, '| Legenda:', caption, '| Arquivo:', req.file.originalname);
    let response = null, error = null;
    try {
        const filePath = req.file.path;
        const mimetype = req.file.mimetype;
        const buffer = fs.readFileSync(filePath);
        await sock.sendMessage(to, { document: buffer, mimetype, fileName: req.file.originalname, caption });
        fs.unlinkSync(filePath);
        response = { success: true };
        res.json(response);
    } catch (err) {
        error = err;
        response = { success: false, message: err.message };
        res.status(500).json(response);
    }
    logApi('/send-media', { to, caption, file: req.file?.originalname }, response, error);
});

app.get('/list-contacts-groups', async (req, res) => {
    if (!isReady) {
        const response = { success: false, message: 'WhatsApp não está conectado.' };
        logApi('/list-contacts-groups', {}, response, null);
        return res.status(400).json(response);
    }
    try {
        const contacts = Object.values(sock?.contacts || {});
        const chats = await sock?.groupFetchAllParticipating?.() || {};
        const groups = Object.values(chats);
        const contatosFiltrados = contacts.filter(c => c.id?.endsWith('@s.whatsapp.net'));
        const gruposFiltrados = groups.map(g => ({ id: g.id, name: g.subject }));
        const response = {
            success: true,
            contacts: contatosFiltrados.map(c => ({ id: c.id, name: c.name || c.notify || c.shortName || c.pushname })),
            groups: gruposFiltrados
        };
        logApi('/list-contacts-groups', {}, response, null);
        res.json(response);
    } catch (err) {
        logApi('/list-contacts-groups', {}, null, err);
        res.status(500).json({ success: false, message: err.message });
    }
});

const PORT = 3333;
server.listen(PORT, () => {
    console.log(`🚀 API WhatsApp Baileys rodando em http://localhost:${PORT}`);
}); 