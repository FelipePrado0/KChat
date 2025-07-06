// ===============================
// main.js — Lógica principal do chat KChat
// Comentários detalhados para facilitar o entendimento de iniciantes
// ===============================

// Configurações globais do sistema (ajuste conforme necessário)
const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api', // URL base da API backend
    EMPRESA: 'Krolik', // Nome da empresa (pode ser alterado)
    USUARIO: 'Usuário Teste' // Nome do usuário (pode ser alterado)
};

// Estado global da aplicação (guarda grupo atual, mensagens, etc)
let appState = {
    currentGroup: null, // Grupo selecionado
    currentPrivateChat: null, // Conversa privada selecionada
    groups: [],        // Lista de grupos
    privateChats: [],  // Lista de conversas privadas
    messages: [],      // Mensagens do grupo/conversa atual
    isModalOpen: false, // Se o modal do chat está aberto
    usuarios: []       // Lista de usuários da empresa
};

// Inicialização da aplicação ao carregar a página
// Adiciona listeners para abrir modal, enviar mensagem, trocar grupo, etc
// DOMContentLoaded garante que o HTML já foi carregado
// ---------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 KChat inicializado');
    
    // Carrega nome do usuário
    loadUserName();
    
    // Carrega grupos ao abrir o modal do chat
    const chatModal = document.getElementById('chatModal');
    if (chatModal) {
        chatModal.addEventListener('show.bs.modal', function() {
            loadGroups();
            checkUserName(); // Verifica se precisa configurar nome
        });
    }
    
    // Configura envio de mensagem
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', handleMessageSubmit);
    }
    
    // Configura troca de grupo
    const groupSelect = document.getElementById('groupSelect');
    if (groupSelect) {
        groupSelect.addEventListener('change', handleGroupChange);
    }
    
    // Permite enviar mensagem com Enter (Shift+Enter para nova linha)
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                messageForm.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}));
            }
        });
    }
});

// Função para abrir o modal do chat
function openChatModal() {
    const chatModal = new bootstrap.Modal(document.getElementById('chatModal'));
    chatModal.show();
    appState.isModalOpen = true;
}

// Função para buscar grupos do backend e popular a lista
async function loadGroups() {
    try {
        showLoading('groupsList');
        
        // Faz requisição para listar grupos da empresa
        const response = await fetch(`${CONFIG.API_BASE_URL}/groups/empresa/${CONFIG.EMPRESA}`);
        const data = await response.json();
        
        if (data.success) {
            appState.groups = data.data;
            await loadPrivateChats(); // Carrega conversas privadas
            await populateGroupsList(data.data); // Preenche a lista de grupos
        } else {
            showAlert('Erro ao carregar grupos: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar grupos:', error);
        showAlert('Erro ao carregar grupos', 'danger');
    } finally {
        hideLoading('groupsList');
    }
}

// Função para carregar conversas privadas
async function loadPrivateChats() {
    try {
        // Busca todas as mensagens privadas do usuário atual
        const response = await fetch(`${CONFIG.API_BASE_URL}/private-message/private-messages?empresa=${CONFIG.EMPRESA}&usuario=${CONFIG.USUARIO}`);
        const data = await response.json();
        
        if (data.success) {
            // Agrupa mensagens por conversa
            const conversations = groupPrivateMessages(data.data);
            appState.privateChats = conversations;
        }
    } catch (error) {
        console.error('Erro ao carregar conversas privadas:', error);
    }
}

// Função para agrupar mensagens privadas por conversa
function groupPrivateMessages(messages) {
    const conversations = new Map();
    
    messages.forEach(message => {
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
    
    return Array.from(conversations.values());
}

// Preenche a lista de grupos com os dados recebidos
async function populateGroupsList(groups) {
    const groupsList = document.getElementById('groupsList');
    if (!groupsList) return;
    
    groupsList.innerHTML = '';
    
    // Adiciona conversas privadas primeiro
    if (appState.privateChats.length > 0) {
        for (const privateChat of appState.privateChats) {
            const privateChatItem = createPrivateChatListItem(privateChat);
            groupsList.appendChild(privateChatItem);
        }
        
        // Adiciona separador
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
    
    // Para cada grupo, busca a última mensagem e cria o item da lista
    for (const group of groups) {
        const lastMessage = await getLastMessage(group.id);
        const groupItem = createGroupListItem(group, lastMessage);
        groupsList.appendChild(groupItem);
    }
}

// Busca a última mensagem de um grupo
async function getLastMessage(groupId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/groups/${groupId}/messages?empresa=${CONFIG.EMPRESA}`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            // Retorna a última mensagem do array (mais recente)
            return data.data[data.data.length - 1];
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar última mensagem:', error);
        return null;
    }
}

// Cria o elemento visual de um item de grupo na lista
function createGroupListItem(group, lastMessage) {
    const groupItem = document.createElement('div');
    groupItem.className = 'group-item';
    groupItem.onclick = () => selectGroup(group);
    
    // Avatar do grupo (primeira letra do nome)
    const avatar = group.nome_grupo.charAt(0).toUpperCase();
    
    // Informações da última mensagem
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

// Cria o elemento visual de um item de conversa privada na lista
function createPrivateChatListItem(privateChat) {
    const privateChatItem = document.createElement('div');
    privateChatItem.className = 'private-chat-item';
    privateChatItem.onclick = () => selectPrivateChat(privateChat);
    
    // Avatar do usuário (primeira letra do nome)
    const avatar = privateChat.otherUser.charAt(0).toUpperCase();
    
    // Informações da última mensagem
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

// Quando o usuário seleciona um grupo
async function selectGroup(group) {
    // Remove seleção anterior
    document.querySelectorAll('.group-item, .private-chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Adiciona seleção ao item clicado
    event.currentTarget.classList.add('active');
    
    // Limpa conversa privada atual
    appState.currentPrivateChat = null;
    
    // Atualiza grupo atual e carrega mensagens
    appState.currentGroup = group;
    await loadMessages(group.id);
    
    // Mostra cabeçalho e área de input
    document.getElementById('chatHeader').style.display = 'block';
    document.getElementById('messageInputContainer').style.display = 'block';
    
    // Atualiza informações do cabeçalho
    document.getElementById('currentGroupName').textContent = group.nome_grupo;
    document.getElementById('currentGroupInfo').textContent = `Grupo • ${appState.messages.length} mensagens`;
}

// Quando o usuário seleciona uma conversa privada
async function selectPrivateChat(privateChat) {
    // Remove seleção anterior
    document.querySelectorAll('.group-item, .private-chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Adiciona seleção ao item clicado
    event.currentTarget.classList.add('active');
    
    // Limpa grupo atual
    appState.currentGroup = null;
    
    // Atualiza conversa privada atual e carrega mensagens
    appState.currentPrivateChat = privateChat;
    await loadPrivateMessages(privateChat.otherUser);
    
    // Mostra cabeçalho e área de input
    document.getElementById('chatHeader').style.display = 'block';
    document.getElementById('messageInputContainer').style.display = 'block';
    
    // Atualiza informações do cabeçalho
    document.getElementById('currentGroupName').textContent = privateChat.otherUser;
    document.getElementById('currentGroupInfo').textContent = `Conversa privada • ${appState.messages.length} mensagens`;
}

// Busca mensagens privadas entre dois usuários
async function loadPrivateMessages(otherUser) {
    try {
        showLoading('messagesContainer');
        
        // Faz requisição para buscar mensagens privadas
        const response = await fetch(`${CONFIG.API_BASE_URL}/private-message/private-messages/conversation?empresa=${CONFIG.EMPRESA}&usuario1=${CONFIG.USUARIO}&usuario2=${otherUser}`);
        const data = await response.json();
        
        if (data.success) {
            appState.messages = data.data;
            displayMessages(data.data); // Mostra mensagens na tela
        } else {
            showAlert('Erro ao carregar mensagens privadas: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar mensagens privadas:', error);
        showAlert('Erro ao carregar mensagens privadas', 'danger');
    } finally {
        hideLoading('messagesContainer');
    }
}

// Busca mensagens do grupo selecionado
async function loadMessages(groupId) {
    try {
        showLoading('messagesContainer');
        
        // Faz requisição para buscar mensagens do grupo
        const response = await fetch(`${CONFIG.API_BASE_URL}/groups/${groupId}/messages?empresa=${CONFIG.EMPRESA}`);
        const data = await response.json();
        
        if (data.success) {
            appState.messages = data.data;
            displayMessages(data.data); // Mostra mensagens na tela
        } else {
            showAlert('Erro ao carregar mensagens: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        showAlert('Erro ao carregar mensagens', 'danger');
    } finally {
        hideLoading('messagesContainer');
    }
}

// Mostra as mensagens na tela
function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    if (messages.length === 0) {
        showEmptyMessages();
        return;
    }
    
    container.innerHTML = '';
    
    // Cria um elemento para cada mensagem
    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        container.appendChild(messageElement);
    });
    
    // Faz scroll automático para a última mensagem
    container.scrollTop = container.scrollHeight;
}

// Cria o elemento visual de uma mensagem
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.usuario === CONFIG.USUARIO ? 'own' : 'other'}`;
    const time = new Date(message.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    // Detecta links no texto e transforma em <a>
    function linkify(text) {
        return text.replace(/(https?:\/\/[\w\-\.\/?#=&;%+~:@!$'()*\[\],]+)/gi, '<a href="$1" target="_blank">$1</a>');
    }
    const mensagemComLinks = linkify(message.mensagem);
    const editedText = message.editada ? ' <small>(editada)</small>' : '';
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-user">${message.usuario}</span>
            <span class="message-time">${time}${editedText}</span>
        </div>
        <div class="message-content">${mensagemComLinks}</div>
    `;
    return messageDiv;
}

// Mostra mensagem "nenhuma mensagem ainda"
function showEmptyMessages() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center text-muted">
            <i class="fas fa-comments fa-3x mb-3"></i>
            <p>Nenhuma mensagem ainda. Seja o primeiro a enviar uma mensagem!</p>
        </div>
    `;
}

// Lida com o envio de mensagem pelo formulário
async function handleMessageSubmit(event) {
    event.preventDefault(); // Evita recarregar a página
    const messageInput = document.getElementById('messageInput');
    const linkInput = document.getElementById('linkInput');
    const fileInput = document.getElementById('fileInput');

    // Valida se há grupo ou conversa privada selecionada
    if (!appState.currentGroup && !appState.currentPrivateChat) {
        showAlert('Selecione um grupo ou conversa para enviar mensagens', 'warning');
        return;
    }

    try {
        showLoading('messagesContainer');
        
        if (appState.currentGroup) {
            // Envia mensagem para grupo
            await sendGroupMessage(messageInput, linkInput, fileInput);
        } else if (appState.currentPrivateChat) {
            // Envia mensagem privada
            await sendPrivateMessageToUser(messageInput, linkInput, fileInput);
        }
        
        // Limpa campos após envio
        messageInput.value = '';
        if (linkInput) linkInput.value = '';
        if (fileInput) fileInput.value = '';
        hideLinkInput();
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showAlert('Erro ao enviar mensagem', 'danger');
    } finally {
        hideLoading('messagesContainer');
    }
}

// Função para enviar mensagem para grupo
async function sendGroupMessage(messageInput, linkInput, fileInput) {
    // Monta os dados do formulário
    const formData = new FormData();
    formData.append('group_id', appState.currentGroup.id);
    formData.append('empresa', CONFIG.EMPRESA);
    formData.append('usuario', CONFIG.USUARIO);
    formData.append('mensagem', messageInput.value);
    if (linkInput && linkInput.value) {
        formData.append('anexo_link', linkInput.value);
    }
    if (fileInput && fileInput.files.length > 0) {
        formData.append('anexo_arquivo', fileInput.files[0]);
    }

    // Envia a mensagem para o backend
    const response = await fetch(`${CONFIG.API_BASE_URL}/messages`, {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    
    if (data.success) {
        // Atualiza mensagens
        await loadMessages(appState.currentGroup.id);
        // Atualiza lista de grupos para mostrar nova última mensagem
        await loadGroups();
    } else {
        showAlert('Erro ao enviar mensagem: ' + data.message, 'danger');
    }
}

// Função para enviar mensagem privada
async function sendPrivateMessageToUser(messageInput, linkInput, fileInput) {
    // Monta os dados da mensagem privada
    const messageData = {
        empresa: CONFIG.EMPRESA,
        remetente: CONFIG.USUARIO,
        destinatario: appState.currentPrivateChat.otherUser,
        mensagem: messageInput.value
    };
    
    if (linkInput && linkInput.value) {
        messageData.anexo_link = linkInput.value;
    }
    if (fileInput && fileInput.files.length > 0) {
        // TODO: Implementar upload de arquivo para mensagens privadas
        showAlert('Upload de arquivo para mensagens privadas será implementado em breve', 'info');
    }

    // Envia a mensagem privada para o backend
    const response = await fetch(`${CONFIG.API_BASE_URL}/private-message/private-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
    });
    const data = await response.json();
    
    if (data.success) {
        // Atualiza mensagens
        await loadPrivateMessages(appState.currentPrivateChat.otherUser);
        // Atualiza lista de conversas privadas
        await loadGroups();
    } else {
        showAlert('Erro ao enviar mensagem privada: ' + data.message, 'danger');
    }
}

// ===============================
// FUNCIONALIDADES DE GRUPOS
// ===============================

// Função para criar novo grupo (abre modal)
function createNewGroup() {
    const newGroupModal = new bootstrap.Modal(document.getElementById('newGroupModal'));
    newGroupModal.show();
}

// Função para enviar novo grupo para o backend
async function submitNewGroup() {
    const groupNameInput = document.getElementById('groupName');
    if (!groupNameInput.value.trim()) {
        showAlert('Digite o nome do grupo', 'warning');
        return;
    }
    try {
        showLoading('groupsList');
        // Envia requisição para criar grupo
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
            // Fecha modal e recarrega grupos
            const newGroupModal = bootstrap.Modal.getInstance(document.getElementById('newGroupModal'));
            newGroupModal.hide();
            groupNameInput.value = '';
            await loadGroups();
        } else {
            showAlert('Erro ao criar grupo: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Erro ao criar grupo:', error);
        showAlert('Erro ao criar grupo', 'danger');
    } finally {
        hideLoading('groupsList');
    }
}

// Função para abrir modal de editar grupo
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

// Função para salvar edição do grupo
async function saveGroupEdit() {
    const editGroupNameInput = document.getElementById('editGroupName');
    const newName = editGroupNameInput.value.trim();
    
    if (!newName) {
        showAlert('Digite o novo nome do grupo', 'warning');
        return;
    }
    
    try {
        // TODO: Implementar rota de edição no backend
        showAlert('Funcionalidade de editar grupo será implementada em breve!', 'info');
        
        // Fecha o modal
        const editGroupModal = bootstrap.Modal.getInstance(document.getElementById('editGroupModal'));
        editGroupModal.hide();
    } catch (error) {
        console.error('Erro ao editar grupo:', error);
        showAlert('Erro ao editar grupo', 'danger');
    }
}

// Função para abrir modal de confirmar remoção
function openDeleteGroupModal() {
    if (!appState.currentGroup) {
        showAlert('Nenhum grupo selecionado', 'warning');
        return;
    }
    
    const deleteGroupModal = new bootstrap.Modal(document.getElementById('deleteGroupModal'));
    document.getElementById('deleteGroupName').textContent = appState.currentGroup.nome_grupo;
    deleteGroupModal.show();
}

// Função para confirmar remoção do grupo
async function confirmDeleteGroup() {
    try {
        showLoading('messagesContainer');
        
        // Faz requisição para remover o grupo
        const response = await fetch(`${CONFIG.API_BASE_URL}/groups/${appState.currentGroup.id}?empresa=${CONFIG.EMPRESA}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Grupo removido com sucesso!', 'success');
            
            // Fecha modal de confirmação
            const deleteGroupModal = bootstrap.Modal.getInstance(document.getElementById('deleteGroupModal'));
            deleteGroupModal.hide();
            
            // Limpa estado atual
            appState.currentGroup = null;
            appState.messages = [];
            
            // Atualiza interface
            document.getElementById('chatHeader').style.display = 'none';
            document.getElementById('messageInputContainer').style.display = 'none';
            showEmptyMessages();
            
            // Recarrega lista de grupos
            await loadGroups();
        } else {
            showAlert('Erro ao remover grupo: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Erro ao remover grupo:', error);
        showAlert('Erro ao remover grupo', 'danger');
    } finally {
        hideLoading('messagesContainer');
    }
}

// ===============================
// FUNCIONALIDADES DE MENSAGENS PRIVADAS
// ===============================

// Função para abrir modal de mensagem privada
function openPrivateChatModal() {
    const privateChatModal = new bootstrap.Modal(document.getElementById('privateChatModal'));
    loadUsuarios(); // Carrega lista de usuários
    privateChatModal.show();
}

// Função para carregar lista de usuários
async function loadUsuarios() {
    try {
        const usuariosList = document.getElementById('usuariosList');
        usuariosList.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-spinner fa-spin"></i>
                <p class="mt-2">Carregando usuários...</p>
            </div>
        `;
        
        // Busca usuários da empresa
        const response = await fetch(`${CONFIG.API_BASE_URL}/private-message/private-messages/usuarios?empresa=${CONFIG.EMPRESA}`);
        const data = await response.json();
        
        if (data.success) {
            appState.usuarios = data.data.filter(usuario => usuario !== CONFIG.USUARIO); // Remove o usuário atual
            populateUsuariosList(data.data.filter(usuario => usuario !== CONFIG.USUARIO));
        } else {
            showAlert('Erro ao carregar usuários: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showAlert('Erro ao carregar usuários', 'danger');
    }
}

// Função para preencher lista de usuários
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
    
    usuarios.forEach(usuario => {
        const usuarioItem = createUsuarioItem(usuario);
        usuariosList.appendChild(usuarioItem);
    });
}

// Função para criar item de usuário
function createUsuarioItem(usuario) {
    const usuarioItem = document.createElement('div');
    usuarioItem.className = 'usuario-item';
    usuarioItem.onclick = () => startPrivateChat(usuario);
    
    // Avatar do usuário (primeira letra do nome)
    const avatar = usuario.charAt(0).toUpperCase();
    
    usuarioItem.innerHTML = `
        <div class="usuario-item-avatar">
            ${avatar}
        </div>
        <div class="usuario-item-name">${usuario}</div>
    `;
    
    return usuarioItem;
}

// Função para iniciar conversa privada
async function startPrivateChat(usuario) {
    try {
        // Fecha o modal
        const privateChatModal = bootstrap.Modal.getInstance(document.getElementById('privateChatModal'));
        privateChatModal.hide();
        
        // Cria uma nova conversa privada
        const newPrivateChat = {
            otherUser: usuario,
            lastMessage: null,
            messageCount: 0
        };
        
        // Adiciona à lista de conversas privadas
        appState.privateChats.unshift(newPrivateChat);
        
        // Seleciona a conversa
        await selectPrivateChat(newPrivateChat);
        
        // Atualiza a lista de grupos/conversas
        await loadGroups();
        
        showAlert(`Conversa iniciada com ${usuario}`, 'success');
        
    } catch (error) {
        console.error('Erro ao iniciar conversa privada:', error);
        showAlert('Erro ao iniciar conversa privada', 'danger');
    }
}

// Função para enviar mensagem privada (antiga - removida)
async function sendPrivateMessage() {
    // Esta função foi substituída por sendPrivateMessageToUser
    showAlert('Use a área de chat para enviar mensagens privadas', 'info');
}

// ===============================
// FUNCIONALIDADES DE USUÁRIO
// ===============================

// Função para abrir modal de configuração de nome
function openUserNameModal() {
    const userNameModal = new bootstrap.Modal(document.getElementById('userNameModal'));
    const userNameInput = document.getElementById('userNameInput');
    
    // Preenche com o nome atual se existir
    userNameInput.value = CONFIG.USUARIO;
    
    userNameModal.show();
}

// Função para salvar o nome do usuário
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
        // Salva nome e login no localStorage
        localStorage.setItem('kchat_user_name', nome);
        localStorage.setItem('kchat_user_login', login);
        CONFIG.USUARIO = nome;
        // Fecha o modal
        const userNameModal = bootstrap.Modal.getInstance(document.getElementById('userNameModal'));
        userNameModal.hide();
        // Mostra modal de confirmação
        setTimeout(() => {
            const userNameChangedModal = new bootstrap.Modal(document.getElementById('userNameChangedModal'));
            userNameChangedModal.show();
        }, 400);
    })
    .catch(err => {
        if (err.message.includes('Login já existe')) {
            showAlert('Este login já está em uso. Escolha outro.', 'danger');
        } else {
            showAlert(err.message, 'danger');
        }
    });
}

// Função para carregar nome do usuário do localStorage
function loadUserName() {
    const savedName = localStorage.getItem('kchat_user_name');
    if (savedName) {
        CONFIG.USUARIO = savedName;
    }
}

// Função para verificar se o usuário já configurou o nome
function checkUserName() {
    const savedName = localStorage.getItem('kchat_user_name');
    if (!savedName || savedName === 'Usuário Teste') {
        // Abre modal para configurar nome na primeira vez
        setTimeout(() => {
            openUserNameModal();
        }, 1000);
    }
}

// ===============================
// FUNÇÕES AUXILIARES
// ===============================

// Mostra/esconde o campo de link
function toggleLinkInput() {
    const linkInputRow = document.getElementById('linkInputRow');
    if (linkInputRow.style.display === 'none') {
        linkInputRow.style.display = 'flex';
    } else {
        linkInputRow.style.display = 'none';
    }
}

function hideLinkInput() {
    const linkInputRow = document.getElementById('linkInputRow');
    linkInputRow.style.display = 'none';
}

// Lida com seleção de arquivo
function handleFileSelect(event) {
    // Exemplo: pode mostrar nome do arquivo selecionado
    // const file = event.target.files[0];
    // if (file) { ... }
}

// Mostra um loading em um elemento
function showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.add('loading');
    }
}

function hideLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.remove('loading');
    }
}

// Mostra um alerta na tela
function showAlert(message, type = 'info') {
    alert(message); // Simples, pode ser melhorado
}

// Quando o usuário troca de grupo
async function handleGroupChange(event) {
    const groupId = event.target.value;
    const deleteGroupBtn = document.getElementById('deleteGroupBtn');
    
    if (!groupId) {
        appState.currentGroup = null;
        appState.messages = [];
        showEmptyMessages();
        deleteGroupBtn.style.display = 'none'; // Esconde botão de remover
        return;
    }
    
    // Atualiza grupo atual e carrega mensagens
    appState.currentGroup = appState.groups.find(g => g.id == groupId);
    deleteGroupBtn.style.display = 'block'; // Mostra botão de remover
    await loadMessages(groupId);
} 