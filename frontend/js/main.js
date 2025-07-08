const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api',
    EMPRESA: 'Krolik',
    USUARIO: 'Usuário Teste'
};

let appState = {
    currentGroup: null,
    currentPrivateChat: null,
    groups: [],
    privateChats: [],
    messages: [],
    isModalOpen: false,
    usuarios: [],
    isSendingMessage: false,
    isProcessingMessage: false
};

document.addEventListener('DOMContentLoaded', function() {
    
    loadUserName();
    
    const chatModal = document.getElementById('chatModal');
    if (chatModal) {
        chatModal.addEventListener('show.bs.modal', function() {
            loadGroups();
            checkUserName();
        });
    }
    
    document.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
    
    const chatPanel = document.getElementById('chatPanel');
    if (chatPanel) {
    }
    
    const groupSelect = document.getElementById('groupSelect');
    if (groupSelect) {
        groupSelect.addEventListener('change', handleGroupChange);
    }

    window.addEventListener('error', function(event) {
        console.error('🔍 [Global Error] Erro JavaScript detectado:', event.error);
        console.error('🔍 [Global Error] Mensagem:', event.message);
        console.error('🔍 [Global Error] Arquivo:', event.filename);
        console.error('🔍 [Global Error] Linha:', event.lineno);
        console.error('🔍 [Global Error] Coluna:', event.colno);
        console.error('🔍 [Global Error] Stack:', event.error?.stack);
    });

    window.addEventListener('unhandledrejection', function(event) {
        console.error('🔍 [Unhandled Promise] Promessa rejeitada:', event.reason);
        console.error('🔍 [Unhandled Promise] Stack:', event.reason?.stack);
    });

    let mediaRecorder;
    let audioChunks = [];
    const audioBtn = document.getElementById('audioBtn');
    if (audioBtn) {
        audioBtn.addEventListener('click', async function() {
            if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const formData = new FormData();
                    formData.append('group_id', appState.currentGroup.id);
                    formData.append('empresa', CONFIG.EMPRESA);
                    formData.append('usuario', CONFIG.USUARIO);
                    formData.append('mensagem', 'Áudio');
                    formData.append('anexo_arquivo', audioBlob, 'audio.webm');
                    const response = await fetch(`${CONFIG.API_BASE_URL}/messages`, {
                        method: 'POST',
                        body: formData
                    });
                    const data = await response.json();
                    if (data.success) {
                        await loadMessages(appState.currentGroup.id);
                    } else {
                        showAlert('Erro ao enviar áudio: ' + data.message, 'danger');
                    }
                };
                mediaRecorder.start();
                this.classList.add('recording');
            } else if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                this.classList.remove('recording');
            }
        });
    }

    // Extrai a base do API_BASE_URL para usar no socket
    const API_BASE = CONFIG.API_BASE_URL.replace(/\/api$/, '');
    // ATENÇÃO: a porta abaixo deve ser igual à porta do backend principal!
    CONFIG.SOCKET_URL = 'http://localhost:3000';

    (function loadSocketIoScript() {
        if (!window.io) {
            const script = document.createElement('script');
            script.src = CONFIG.SOCKET_URL + '/socket.io/socket.io.js';
            script.onload = setupSocketIo;
            document.head.appendChild(script);
        } else {
            setupSocketIo();
        }
    })();

    let socket;
    function setupSocketIo() {
        socket = io(CONFIG.SOCKET_URL);

        socket.on('mensagem_recebida', (mensagem) => {
            if (appState.currentGroup && mensagem.group_id === appState.currentGroup.id) {
                appState.messages.push(mensagem);
                displayMessages(appState.messages);
            }
        });
    }
});

function toggleChatPanel() {
    
    const chatPanel = document.getElementById('chatPanel');
    if (!chatPanel) {
        console.error('❌ [toggleChatPanel] chatPanel não encontrado!');
        return;
    }
    
    const isVisible = chatPanel.classList.contains('visible');
    
    if (!isVisible) {
        
        chatPanel.style.display = 'block';
        setTimeout(() => {
            chatPanel.classList.remove('hidden');
            chatPanel.classList.add('visible');
        }, 10);
        
        loadGroups();
        checkUserName();
        setupMessageListeners();
        setTimeout(() => {
            const messageInput = document.getElementById('messageInput');
            if (messageInput && typeof messageInput.autoResize === 'function') messageInput.autoResize();
        }, 100);
    } else {
        if (appState.isProcessingMessage) {
            return;
        }
        
        
        chatPanel.classList.remove('visible');
        chatPanel.classList.add('hidden');
        setTimeout(() => {
            chatPanel.style.display = 'none';
        }, 300);
    }
}

function setupMessageListeners() {
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput && !messageInput.hasAttribute('data-listeners-setup')) {
        
        
        messageInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleMessageSubmit(event);
            }
        });
        
        function autoResize() {
            messageInput.style.height = 'auto';
            const scrollHeight = messageInput.scrollHeight;
            const maxHeight = 120;
            const newHeight = Math.min(scrollHeight, maxHeight);
            messageInput.style.height = newHeight + 'px';
        }
        
        messageInput.addEventListener('input', autoResize);
        messageInput.addEventListener('keyup', autoResize);
        messageInput.addEventListener('paste', autoResize);
        
        messageInput.autoResize = autoResize;
        
        messageInput.setAttribute('data-listeners-setup', 'true');
    } else {
    }
}

async function loadGroups() {
    
    try {
        showLoading('groupsList');
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/groups/empresa/${CONFIG.EMPRESA}`);
        const data = await response.json();
        
        
        if (data.success) {
            appState.groups = data.data;
            
            await loadPrivateChats();
            
            
            await populateGroupsList(data.data);
        } else {
            console.error('❌ [loadGroups] Erro na resposta:', data.message);
            showAlert('Erro ao carregar grupos: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('❌ [loadGroups] Erro ao carregar grupos:', error);
        showAlert('Erro ao carregar grupos', 'danger');
    } finally {
        hideLoading('groupsList');
    }
}

async function loadPrivateChats() {
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/private-message/private-messages?empresa=${CONFIG.EMPRESA}&usuario=${CONFIG.USUARIO}`);
        const data = await response.json();
        
        
        if (data.success) {
            
            const conversations = groupPrivateMessages(data.data);
            appState.privateChats = conversations;
        } else {
            console.error('❌ [loadPrivateChats] Erro na resposta:', data.message);
        }
    } catch (error) {
        console.error('❌ [loadPrivateChats] Erro ao carregar conversas privadas:', error);
    }
}

function groupPrivateMessages(messages) {
    
    const conversations = new Map();
    
    messages.forEach((message, index) => {
        const otherUser = message.remetente === CONFIG.USUARIO ? message.destinatario : message.remetente;
        const key = otherUser;
        
        if (!conversations.has(key)) {
            conversations.set(key, {
                otherUser,
                lastMessage: message,
                messageCount: 0
            });
        }
        
        conversations.get(key).messageCount++;
    });
    
    const result = Array.from(conversations.values());
    return result;
}

async function populateGroupsList(groups) {
    
    const groupsList = document.getElementById('groupsList');
    if (!groupsList) {
        console.error('❌ [populateGroupsList] groupsList não encontrado!');
        return;
    }
    
    
    groupsList.innerHTML = '';
    
    if (appState.privateChats.length > 0) {
        
        for (const privateChat of appState.privateChats) {
            const privateChatItem = createPrivateChatListItem(privateChat);
            groupsList.appendChild(privateChatItem);
        }
        
        const separator = document.createElement('div');
        separator.className = 'text-center text-muted py-2';
        separator.innerHTML = '<small>Grupos</small>';
        separator.style.borderTop = '1px solid #e9ecef';
        separator.style.borderBottom = '1px solid #e9ecef';
        groupsList.appendChild(separator);
    }
    
    if (groups.length === 0) {
        
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-center text-muted p-3';
        emptyMessage.innerHTML = `
            <i class="fas fa-comments fa-2x mb-2"></i>
            <p>Nenhum grupo encontrado</p>
            <button class="btn btn-primary btn-sm" onclick="createNewGroup()">
                <i class="fas fa-plus"></i> Criar Primeiro Grupo
            </button>
        `;
        groupsList.appendChild(emptyMessage);
        return;
    }
    
    
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        
        const lastMessage = await getLastMessage(group.id);
        const groupItem = createGroupListItem(group, lastMessage);
        groupsList.appendChild(groupItem);
    }
    
}

async function getLastMessage(groupId) {
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/groups/${groupId}/messages?empresa=${CONFIG.EMPRESA}`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            const lastMessage = data.data[data.data.length - 1];
            return lastMessage;
        }
        return null;
    } catch (error) {
        console.error('❌ [getLastMessage] Erro ao buscar última mensagem:', error);
        return null;
    }
}

function createGroupListItem(group, lastMessage) {
    
    const groupItem = document.createElement('div');
    groupItem.className = 'group-item';
    groupItem.onclick = () => selectGroup(group);
    
    const avatar = group.nome_grupo.charAt(0).toUpperCase();
    
    let lastMessageText = 'Nenhuma mensagem ainda';
    let lastMessageTime = '';
    
    if (lastMessage) {
        lastMessageText = lastMessage.mensagem.length > 50 
            ? lastMessage.mensagem.substring(0, 50) + '...' 
            : lastMessage.mensagem;
        lastMessageTime = new Date(lastMessage.criado_em).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    groupItem.innerHTML = `
        <div class="group-item-avatar">
            ${avatar}
        </div>
        <div class="group-item-content">
            <div class="group-item-name">${group.nome_grupo}</div>
            <div class="group-item-last-message">${lastMessageText}</div>
        </div>
        <div class="group-item-time">${lastMessageTime}</div>
    `;
    
    return groupItem;
}

function createPrivateChatListItem(privateChat) {
    
    const privateChatItem = document.createElement('div');
    privateChatItem.className = 'private-chat-item';
    privateChatItem.onclick = () => selectPrivateChat(privateChat);
    
    const avatar = privateChat.otherUser.charAt(0).toUpperCase();
    
    let lastMessageText = 'Nenhuma mensagem ainda';
    let lastMessageTime = '';
    
    if (privateChat.lastMessage) {
        lastMessageText = privateChat.lastMessage.mensagem.length > 50 
            ? privateChat.lastMessage.mensagem.substring(0, 50) + '...' 
            : privateChat.lastMessage.mensagem;
        lastMessageTime = new Date(privateChat.lastMessage.criado_em).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    privateChatItem.innerHTML = `
        <div class="private-chat-item-avatar">
            ${avatar}
        </div>
        <div class="private-chat-item-content">
            <div class="private-chat-item-name">
                <span class="private-indicator"></span>${privateChat.otherUser}
            </div>
            <div class="private-chat-item-last-message">${lastMessageText}</div>
        </div>
        <div class="private-chat-item-time">${lastMessageTime}</div>
    `;
    
    return privateChatItem;
}

async function selectGroup(group) {
    
    document.querySelectorAll('.group-item, .private-chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    event.currentTarget.classList.add('active');
    
    appState.currentPrivateChat = null;
    
    appState.currentGroup = group;
    
    await loadMessages(group.id);
    
    document.getElementById('chatHeader').style.display = 'block';
    document.getElementById('messageInputContainer').style.display = 'block';
    
    document.getElementById('currentGroupName').textContent = group.nome_grupo;
    document.getElementById('currentGroupInfo').textContent = `Grupo • ${appState.messages.length} mensagens`;
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput && typeof messageInput.autoResize === 'function') messageInput.autoResize();
    
}

async function selectPrivateChat(privateChat) {
    
    document.querySelectorAll('.group-item, .private-chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    event.currentTarget.classList.add('active');
    
    appState.currentGroup = null;
    
    appState.currentPrivateChat = privateChat;
    
    await loadPrivateMessages(privateChat.otherUser);
    
    document.getElementById('chatHeader').style.display = 'block';
    document.getElementById('messageInputContainer').style.display = 'block';
    
    document.getElementById('currentGroupName').textContent = privateChat.otherUser;
    document.getElementById('currentGroupInfo').textContent = `Conversa privada • ${appState.messages.length} mensagens`;
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput && typeof messageInput.autoResize === 'function') messageInput.autoResize();
    
}

async function loadPrivateMessages(otherUser) {
    
    try {
        showLoading('messagesContainer');
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/private-message/private-messages/conversation?empresa=${CONFIG.EMPRESA}&usuario1=${CONFIG.USUARIO}&usuario2=${otherUser}`);
        const data = await response.json();
        
        
        if (data.success) {
            appState.messages = data.data;
            
            displayMessages(data.data);
        } else {
            console.error('❌ [loadPrivateMessages] Erro na resposta:', data.message);
            showAlert('Erro ao carregar mensagens privadas: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('❌ [loadPrivateMessages] Erro ao carregar mensagens privadas:', error);
        showAlert('Erro ao carregar mensagens privadas', 'danger');
    } finally {
        hideLoading('messagesContainer');
    }
}

async function loadMessages(groupId) {
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/groups/${groupId}/messages?empresa=${CONFIG.EMPRESA}`);
        const data = await response.json();
        
        
        if (data.success) {
            appState.messages = data.data;
            
            displayMessages(data.data);
        } else {
            console.error('❌ [loadMessages] Erro na resposta:', data.message);
            showAlert('Erro ao carregar mensagens: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('❌ [loadMessages] Erro ao carregar mensagens:', error);
        showAlert('Erro ao carregar mensagens', 'danger');
    }
}

function displayMessages(messages) {
    
    const container = document.getElementById('messagesContainer');
    if (!container) {
        console.error('❌ [displayMessages] messagesContainer não encontrado!');
        return;
    }
    
    if (messages.length === 0) {
        
        showEmptyMessages();
        return;
    }
    
    
    container.innerHTML = '';
    
    messages.forEach((message, index) => {
        
        const messageElement = createMessageElement(message);
        container.appendChild(messageElement);
    });
    
    
    container.scrollTop = container.scrollHeight;
}

function createMessageElement(message) {
    
    const messageDiv = document.createElement('div');
    
    const isOwnMessage = message.usuario === CONFIG.USUARIO || message.remetente === CONFIG.USUARIO;
    messageDiv.className = `message ${isOwnMessage ? 'own' : 'other'}`;
    
    const time = new Date(message.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    function linkify(text) {
        return text.replace(/(https?:\/\/[\w\-\.\/?#=&;%+~:@!$'()*\[\],]+)/gi, '<a href="$1" target="_blank">$1</a>');
    }
    const mensagemComLinks = linkify(message.mensagem);
    const editedText = message.editada ? ' <small>(editada)</small>' : '';
    
    let statusHtml = '';
    if (isOwnMessage) {
        if (message.status === 'enviando') {
            statusHtml = '<span title="Enviando..." style="color:#888;margin-left:6px;">...</span>';
        } else if (message.status === 'erro') {
            statusHtml = `<span title="${message.erro || 'Erro ao enviar'}" style="color:#e74c3c;margin-left:6px;cursor:help;">&#9888;</span>`;
        } else {
            statusHtml = '<span title="Enviada" style="color:#27ae60;margin-left:6px;">&#10003;</span>';
        }
    }
    
    let attachmentHtml = '';
    if (message.anexo_arquivo) {
        const fileName = message.anexo_arquivo;
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        if (['webm', 'mp3', 'wav', 'ogg'].includes(fileExtension)) {
            attachmentHtml = `
                <div class="message-attachment">
                    <audio controls>
                        <source src="${CONFIG.API_BASE_URL}/uploads/${fileName}" type="audio/${fileExtension}">
                        Seu navegador não suporta áudio.
                    </audio>
                </div>
            `;
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
            attachmentHtml = `
                <div class="message-attachment">
                    <img src="${CONFIG.API_BASE_URL}/uploads/${fileName}" alt="Imagem anexada" style="max-width: 300px; max-height: 300px; border-radius: 8px;">
                </div>
            `;
        } else {
            attachmentHtml = `
                <div class="message-attachment">
                    <a href="${CONFIG.API_BASE_URL}/uploads/${fileName}" target="_blank" class="btn btn-outline-primary btn-sm">
                        <i class="fas fa-file"></i> ${fileName}
                    </a>
                </div>
            `;
        }
    }
    
    const userName = message.usuario || message.remetente;
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-user">${userName}</span>
            <span class="message-time">${time}${editedText}${statusHtml}</span>
        </div>
        <div class="message-content">${mensagemComLinks}</div>
        ${attachmentHtml}
    `;
    
    return messageDiv;
}

function showEmptyMessages() {
    
    const container = document.getElementById('messagesContainer');
    if (!container) {
        console.error('❌ [showEmptyMessages] messagesContainer não encontrado!');
        return;
    }
    
    container.innerHTML = `
        <div class="text-center text-muted">
            <i class="fas fa-comments fa-3x mb-3"></i>
            <p>Nenhuma mensagem ainda. Seja o primeiro a enviar uma mensagem!</p>
        </div>
    `;
}

async function handleMessageSubmit(event) {
    
    if (event) {
        event.preventDefault();
    }
    
    const messageInput = document.getElementById('messageInput');
    const fileInput = document.getElementById('fileInput');

    if (!appState.currentGroup && !appState.currentPrivateChat) {
        showAlert('Selecione um grupo ou conversa para enviar mensagens', 'warning');
        return;
    }

    const hasMessage = messageInput.value.trim().length > 0;
    const hasFile = fileInput && fileInput.files.length > 0;
    
    
    if (!hasMessage && !hasFile) {
        showAlert('Digite uma mensagem ou anexe um arquivo', 'warning');
        return;
    }

    if (appState.isSendingMessage || appState.isProcessingMessage) {
        return;
    }
    
    appState.isSendingMessage = true;
    appState.isProcessingMessage = true;

    try {
        if (appState.currentGroup) {
            
            await sendGroupMessage(messageInput, fileInput);
        } else if (appState.currentPrivateChat) {
            
            await sendPrivateMessage(messageInput, fileInput);
        }
        
        messageInput.value = '';
        if (fileInput) {
            fileInput.value = '';
            const fileBtn = document.querySelector('label[for="fileInput"]');
            if (fileBtn) {
                fileBtn.innerHTML = '<i class="fas fa-paperclip"></i>';
                fileBtn.classList.remove('btn-success');
                fileBtn.classList.add('btn-outline-secondary');
            }
        }
        
        if (typeof messageInput.autoResize === 'function') messageInput.autoResize();
        
    } catch (error) {
        console.error('❌ [handleMessageSubmit] Erro ao enviar mensagem:', error);
        showAlert('Erro ao enviar mensagem', 'danger');
    } finally {
        appState.isSendingMessage = false;
        appState.isProcessingMessage = false;
    }
}

async function sendGroupMessage(messageInput, fileInput) {
    
    const hasMessage = messageInput.value.trim().length > 0;
    const hasFile = fileInput && fileInput.files.length > 0;

    
    const formData = new FormData();
    formData.append('group_id', appState.currentGroup.id);
    formData.append('empresa', CONFIG.EMPRESA);
    formData.append('usuario', CONFIG.USUARIO);
    formData.append('mensagem', messageInput.value || '');
    
    if (hasFile) {
        formData.append('anexo_arquivo', fileInput.files[0]);
    }

    try {
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/messages`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            
            await loadMessages(appState.currentGroup.id);
            
        } else {
            console.error('❌ [sendGroupMessage] Erro na resposta:', data.message);
            showAlert('Erro ao enviar mensagem: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('❌ [sendGroupMessage] Erro ao enviar mensagem:', error);
        showAlert('Erro ao enviar mensagem', 'danger');
    }

    if (window.socket) {
        const mensagem = {
            group_id: appState.currentGroup.id,
            empresa: CONFIG.EMPRESA,
            usuario: CONFIG.USUARIO,
            mensagem: messageInput.value,
            data_envio: new Date().toISOString()
        };
        window.socket.emit('nova_mensagem', mensagem);
    }
}

async function sendPrivateMessage(messageInput, fileInput) {
    
    const hasMessage = messageInput.value.trim().length > 0;
    const hasFile = fileInput && fileInput.files.length > 0;

    
    try {
        if (hasFile) {
            
            const formData = new FormData();
            formData.append('empresa', CONFIG.EMPRESA);
            formData.append('remetente', CONFIG.USUARIO);
            formData.append('destinatario', appState.currentPrivateChat.otherUser);
            formData.append('mensagem', messageInput.value || '');
            formData.append('anexo_arquivo', fileInput.files[0]);

            const response = await fetch(`${CONFIG.API_BASE_URL}/private-message/private-messages`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                
                await loadPrivateMessages(appState.currentPrivateChat.otherUser);
                
                await loadGroups();
            } else {
                console.error('❌ [sendPrivateMessage] Erro na resposta (com arquivo):', data.message);
                showAlert('Erro ao enviar mensagem privada: ' + data.message, 'danger');
            }
        } else {
            
            const messageData = {
                empresa: CONFIG.EMPRESA,
                remetente: CONFIG.USUARIO,
                destinatario: appState.currentPrivateChat.otherUser,
                mensagem: messageInput.value
            };

            const response = await fetch(`${CONFIG.API_BASE_URL}/private-message/private-messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                
                await loadPrivateMessages(appState.currentPrivateChat.otherUser);
                
                await loadGroups();
            } else {
                console.error('❌ [sendPrivateMessage] Erro na resposta (sem arquivo):', data.message);
                showAlert('Erro ao enviar mensagem privada: ' + data.message, 'danger');
            }
        }
    } catch (error) {
        console.error('❌ [sendPrivateMessage] Erro ao enviar mensagem privada:', error);
        showAlert('Erro ao enviar mensagem privada', 'danger');
    } finally {
        const chatPanel = document.getElementById('chatPanel');
        if (chatPanel) {
            const display = chatPanel.style.display;
            if (display === 'none') {
            }
        }
    }
}

function createNewGroup() {
    
    const newGroupModal = new bootstrap.Modal(document.getElementById('newGroupModal'));
    newGroupModal.show();
}

async function submitNewGroup() {
    
    const groupNameInput = document.getElementById('groupName');
    if (!groupNameInput.value.trim()) {
        showAlert('Digite o nome do grupo', 'warning');
        return;
    }
    try {
        showLoading('groupsList');
        
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                empresa: CONFIG.EMPRESA,
                nome_grupo: groupNameInput.value.trim()
            })
        });
        const data = await response.json();
        
        
        if (data.success) {
            
            const newGroupModal = bootstrap.Modal.getInstance(document.getElementById('newGroupModal'));
            newGroupModal.hide();
            groupNameInput.value = '';
            
            await loadGroups();
        } else {
            console.error('❌ [submitNewGroup] Erro na resposta:', data.message);
            showAlert('Erro ao criar grupo: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('❌ [submitNewGroup] Erro ao criar grupo:', error);
        showAlert('Erro ao criar grupo', 'danger');
    } finally {
        hideLoading('groupsList');
    }
}

function openEditGroupModal() {
    
    if (!appState.currentGroup) {
        showAlert('Nenhum grupo selecionado', 'warning');
        return;
    }
    
    const editGroupModal = new bootstrap.Modal(document.getElementById('editGroupModal'));
    const editGroupNameInput = document.getElementById('editGroupName');
    editGroupNameInput.value = appState.currentGroup.nome_grupo;
    editGroupModal.show();
}

async function saveGroupEdit() {
    
    const editGroupNameInput = document.getElementById('editGroupName');
    const newName = editGroupNameInput.value.trim();
    
    if (!newName) {
        showAlert('Digite o novo nome do grupo', 'warning');
        return;
    }
    
    try {
        
        showAlert('Funcionalidade de editar grupo será implementada em breve!', 'info');
        
        const editGroupModal = bootstrap.Modal.getInstance(document.getElementById('editGroupModal'));
        editGroupModal.hide();
    } catch (error) {
        console.error('❌ [saveGroupEdit] Erro ao editar grupo:', error);
        showAlert('Erro ao editar grupo', 'danger');
    }
}

function openDeleteGroupModal() {
    
    if (!appState.currentGroup) {
        showAlert('Nenhum grupo selecionado', 'warning');
        return;
    }
    
    const deleteGroupModal = new bootstrap.Modal(document.getElementById('deleteGroupModal'));
    document.getElementById('deleteGroupName').textContent = appState.currentGroup.nome_grupo;
    deleteGroupModal.show();
}

async function confirmDeleteGroup() {
    
    try {
        showLoading('messagesContainer');
        
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/groups/${appState.currentGroup.id}?empresa=${CONFIG.EMPRESA}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            
            showAlert('Grupo removido com sucesso!', 'success');
            
            const deleteGroupModal = bootstrap.Modal.getInstance(document.getElementById('deleteGroupModal'));
            deleteGroupModal.hide();
            
            appState.currentGroup = null;
            appState.messages = [];
            
            document.getElementById('chatHeader').style.display = 'none';
            document.getElementById('messageInputContainer').style.display = 'none';
            showEmptyMessages();
            
            
            await loadGroups();
        } else {
            console.error('❌ [confirmDeleteGroup] Erro na resposta:', data.message);
            showAlert('Erro ao remover grupo: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('❌ [confirmDeleteGroup] Erro ao remover grupo:', error);
        showAlert('Erro ao remover grupo', 'danger');
    } finally {
        hideLoading('messagesContainer');
    }
}

function openPrivateChatModal() {
    
    const privateChatModal = new bootstrap.Modal(document.getElementById('privateChatModal'));
    loadUsuarios();
    privateChatModal.show();
}

async function loadUsuarios() {
    
    try {
        const usuariosList = document.getElementById('usuariosList');
        usuariosList.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-spinner fa-spin"></i>
                <p class="mt-2">Carregando usuários...</p>
            </div>
        `;
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/private-message/private-messages/usuarios?empresa=${CONFIG.EMPRESA}`);
        const data = await response.json();
        
        
        if (data.success) {
            appState.usuarios = data.data.filter(usuario => usuario !== CONFIG.USUARIO);
            
            populateUsuariosList(data.data.filter(usuario => usuario !== CONFIG.USUARIO));
        } else {
            console.error('❌ [loadUsuarios] Erro na resposta:', data.message);
            showAlert('Erro ao carregar usuários: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('❌ [loadUsuarios] Erro ao carregar usuários:', error);
        showAlert('Erro ao carregar usuários', 'danger');
    }
}

function populateUsuariosList(usuarios) {
    
    const usuariosList = document.getElementById('usuariosList');
    
    if (usuarios.length === 0) {
        
        usuariosList.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-users fa-2x mb-2"></i>
                <p>Nenhum usuário encontrado</p>
                <small>Os usuários aparecerão aqui quando enviarem mensagens</small>
            </div>
        `;
        return;
    }
    
    
    usuariosList.innerHTML = '';
    
    usuarios.forEach((usuario, index) => {
        
        const usuarioItem = createUsuarioItem(usuario);
        usuariosList.appendChild(usuarioItem);
    });
    
}

function createUsuarioItem(usuario) {
    
    const usuarioItem = document.createElement('div');
    usuarioItem.className = 'usuario-item';
    usuarioItem.onclick = () => startPrivateChat(usuario);
    
    const avatar = usuario.charAt(0).toUpperCase();
    
    usuarioItem.innerHTML = `
        <div class="usuario-item-avatar">
            ${avatar}
        </div>
        <div class="usuario-item-name">${usuario}</div>
    `;
    
    return usuarioItem;
}

async function startPrivateChat(usuario) {
    
    try {
        const privateChatModal = bootstrap.Modal.getInstance(document.getElementById('privateChatModal'));
        privateChatModal.hide();
        
        const newPrivateChat = {
            otherUser: usuario,
            lastMessage: null,
            messageCount: 0
        };
        
        appState.privateChats.unshift(newPrivateChat);
        
        
        await selectPrivateChat(newPrivateChat);
        
        
        await loadGroups();
        
        showAlert(`Conversa iniciada com ${usuario}`, 'success');
    } catch (error) {
        console.error('❌ [startPrivateChat] Erro ao iniciar conversa privada:', error);
        showAlert('Erro ao iniciar conversa privada', 'danger');
    }
}

async function sendPrivateMessage() {
    
    showAlert('Use a área de chat para enviar mensagens privadas', 'info');
}

function openUserNameModal() {
    
    const userNameModal = new bootstrap.Modal(document.getElementById('userNameModal'));
    const userNameInput = document.getElementById('userNameInput');
    
    userNameInput.value = CONFIG.USUARIO;
    
    userNameModal.show();
}

function saveUserName() {
    
    const userLoginInput = document.getElementById('userLoginInput');
    const userPasswordInput = document.getElementById('userPasswordInput');
    const userNameInput = document.getElementById('userNameInput');
    const login = userLoginInput.value.trim();
    const senha = userPasswordInput.value.trim();
    const nome = userNameInput.value.trim();

    
    if (!login || !senha || !nome) {
        showAlert('Preencha todos os campos!', 'warning');
        return;
    }
    if (nome.length < 2) {
        showAlert('O nome deve ter pelo menos 2 caracteres', 'warning');
        return;
    }
    if (login.length < 3) {
        showAlert('O login deve ter pelo menos 3 caracteres', 'warning');
        return;
    }
    if (senha.length < 3) {
        showAlert('A senha deve ter pelo menos 3 caracteres', 'warning');
        return;
    }

    
    fetch(`${CONFIG.API_BASE_URL}/usuarios/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, senha, nome })
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao salvar usuário');
        
        
        localStorage.setItem('kchat_user_name', nome);
        localStorage.setItem('kchat_user_login', login);
        CONFIG.USUARIO = nome;
        
        const userNameModal = bootstrap.Modal.getInstance(document.getElementById('userNameModal'));
        userNameModal.hide();
        
        setTimeout(() => {
            const userNameChangedModal = new bootstrap.Modal(document.getElementById('userNameChangedModal'));
            userNameChangedModal.show();
        }, 400);
        
    })
    .catch(err => {
        console.error('❌ [saveUserName] Erro ao salvar usuário:', err);
        if (err.message.includes('Login já existe')) {
            showAlert('Este login já está em uso. Escolha outro.', 'danger');
        } else {
            showAlert(err.message, 'danger');
        }
    });
}

function loadUserName() {
    
    const savedName = localStorage.getItem('kchat_user_name');
    if (savedName) {
        CONFIG.USUARIO = savedName;
    } else {
    }
}

function checkUserName() {
    
    const savedName = localStorage.getItem('kchat_user_name');
    
    if (!savedName || savedName === 'Usuário Teste') {
        setTimeout(() => {
            openUserNameModal();
        }, 1000);
    }
}

function handleFileSelect(event) {
    
    const file = event.target.files[0];
    if (file) {
        
        const fileBtn = document.querySelector('label[for="fileInput"]');
        const originalText = fileBtn.innerHTML;
        
        fileBtn.innerHTML = `<i class="fas fa-file"></i> ${file.name.substring(0, 15)}${file.name.length > 15 ? '...' : ''}`;
        fileBtn.classList.add('btn-success');
        fileBtn.classList.remove('btn-outline-secondary');
        
        setTimeout(() => {
            fileBtn.innerHTML = originalText;
            fileBtn.classList.remove('btn-success');
            fileBtn.classList.add('btn-outline-secondary');
        }, 3000);
        
    } else {
    }
}

function showLoading(elementId) {
    
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.add('loading');
    } else {
        console.error('❌ [showLoading] Elemento não encontrado:', elementId);
    }
}

function hideLoading(elementId) {
    
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.remove('loading');
    } else {
        console.error('❌ [hideLoading] Elemento não encontrado:', elementId);
    }
}

function showAlert(message, type = 'info') {
    
    const chatPanel = document.getElementById('chatPanel');
    const displayBefore = chatPanel ? chatPanel.style.display : 'elemento não encontrado';
    
    alert(message);
    
    const displayAfter = chatPanel ? chatPanel.style.display : 'elemento não encontrado';
    
    if (displayBefore !== displayAfter) {
        console.error('❌ [showAlert] ATENÇÃO: Estado do painel mudou durante o alerta!');
    }
    
}

async function handleGroupChange(event) {
    
    const groupId = event.target.value;
    const deleteGroupBtn = document.getElementById('deleteGroupBtn');
    
    
    if (!groupId) {
        
        appState.currentGroup = null;
        appState.messages = [];
        showEmptyMessages();
        deleteGroupBtn.style.display = 'none';
        return;
    }
    
    appState.currentGroup = appState.groups.find(g => g.id == groupId);
    deleteGroupBtn.style.display = 'block';
    
    await loadMessages(groupId);
} 

const messageInput = document.getElementById('messageInput');
if (messageInput) {
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
} 

// Ao abrir o modal do QR Code, mostrar o spinner e esconder o canvas
const whatsappQrModal = document.getElementById('whatsappQrModal');
if (whatsappQrModal) {
    whatsappQrModal.addEventListener('show.bs.modal', function() {
        const qrLoadingSpinner = document.getElementById('qrLoadingSpinner');
        const qrCanvas = document.getElementById('qrCanvas');
        if (qrLoadingSpinner) qrLoadingSpinner.style.display = 'block';
        if (qrCanvas) qrCanvas.style.display = 'none';
        const qrStatus = document.getElementById('qrStatus');
        if (qrStatus) qrStatus.textContent = 'Aguardando QR Code...';
    });
} 