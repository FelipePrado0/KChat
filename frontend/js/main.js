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
    usuarios: [],      // Lista de usuários da empresa
    isSendingMessage: false, // Previne envio duplo de mensagens
    isProcessingMessage: false // Previne fechamento durante processamento
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
    
    // Configura envio de mensagem (agora via onclick no botão e Enter no textarea)
    
    // Previne submits de formulários que possam causar reload
    document.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
    
    // Monitora mudanças no painel de chat para detectar fechamento acidental
    const chatPanel = document.getElementById('chatPanel');
    if (chatPanel) {
        console.log('🔍 [DOMContentLoaded] Chat panel encontrado e configurado');
    }
    
    // Modal pode ser fechado normalmente
    
    // Configura troca de grupo
    const groupSelect = document.getElementById('groupSelect');
    if (groupSelect) {
        groupSelect.addEventListener('change', handleGroupChange);
    }
    
    // Listeners de mensagem serão configurados quando o modal abrir

    // Captura erros JavaScript globais
    window.addEventListener('error', function(event) {
        console.error('🔍 [Global Error] Erro JavaScript detectado:', event.error);
        console.error('🔍 [Global Error] Mensagem:', event.message);
        console.error('🔍 [Global Error] Arquivo:', event.filename);
        console.error('🔍 [Global Error] Linha:', event.lineno);
        console.error('🔍 [Global Error] Coluna:', event.colno);
        console.error('🔍 [Global Error] Stack:', event.error?.stack);
    });

    // Captura promessas rejeitadas não tratadas
    window.addEventListener('unhandledrejection', function(event) {
        console.error('🔍 [Unhandled Promise] Promessa rejeitada:', event.reason);
        console.error('🔍 [Unhandled Promise] Stack:', event.reason?.stack);
    });



    // --- Áudio ---
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
    // --- Fim áudio ---

    // === INTEGRAÇÃO SOCKET.IO ===
    // Adiciona o script do socket.io dinamicamente se não estiver presente
    (function loadSocketIoScript() {
        if (!window.io) {
            const script = document.createElement('script');
            script.src = 'http://localhost:3000/socket.io/socket.io.js';
            script.onload = setupSocketIo;
            document.head.appendChild(script);
        } else {
            setupSocketIo();
        }
    })();

    let socket;
    function setupSocketIo() {
        socket = io('http://localhost:3000');
        console.log('🔌 Socket.io conectado:', socket.id);

        // Recebe mensagem em tempo real
        socket.on('mensagem_recebida', (mensagem) => {
            console.log('📥 Nova mensagem recebida via socket:', mensagem);
            // Se a mensagem for do grupo/conversa atual, exibe imediatamente
            if (appState.currentGroup && mensagem.group_id === appState.currentGroup.id) {
                appState.messages.push(mensagem);
                displayMessages(appState.messages);
            }
            // (Opcional) Adapte para mensagens privadas se necessário
        });
    }
});

// Função para alternar exibição do painel fixo do chat
function toggleChatPanel() {
    console.log('🔍 [toggleChatPanel] Iniciando...');
    console.log('🔍 [toggleChatPanel] Chamada de:', new Error().stack.split('\n')[2]);
    
    const chatPanel = document.getElementById('chatPanel');
    if (!chatPanel) {
        console.error('❌ [toggleChatPanel] chatPanel não encontrado!');
        return;
    }
    
    const isVisible = chatPanel.classList.contains('visible');
    console.log('🔍 [toggleChatPanel] Painel visível:', isVisible);
    
    if (!isVisible) {
        console.log('🔍 [toggleChatPanel] Abrindo painel...');
        chatPanel.style.display = 'block';
        // Pequeno delay para garantir que o display foi aplicado
        setTimeout(() => {
            chatPanel.classList.remove('hidden');
            chatPanel.classList.add('visible');
        }, 10);
        
        loadGroups();
        checkUserName();
        setupMessageListeners();
        // Chama autoResize ao abrir o painel
        setTimeout(() => {
            const messageInput = document.getElementById('messageInput');
            if (messageInput && typeof messageInput.autoResize === 'function') messageInput.autoResize();
        }, 100);
        console.log('✅ [toggleChatPanel] Painel aberto com sucesso');
    } else {
        // Previne fechamento durante processamento de mensagem
        if (appState.isProcessingMessage) {
            console.log('🔍 [toggleChatPanel] Fechamento bloqueado - mensagem sendo processada');
            return;
        }
        
        console.log('🔍 [toggleChatPanel] Fechando painel...');
        console.log('🔍 [toggleChatPanel] Motivo do fechamento: chamada manual');
        chatPanel.classList.remove('visible');
        chatPanel.classList.add('hidden');
        // Remove o display após a animação
        setTimeout(() => {
            chatPanel.style.display = 'none';
        }, 300);
        console.log('✅ [toggleChatPanel] Painel fechado com sucesso');
    }
}

// Função para configurar listeners de mensagem (executada apenas uma vez)
function setupMessageListeners() {
    console.log('🔍 [setupMessageListeners] Configurando listeners de mensagem...');
    const messageInput = document.getElementById('messageInput');
    if (messageInput && !messageInput.hasAttribute('data-listeners-setup')) {
        console.log('🔍 [setupMessageListeners] Adicionando listeners ao messageInput...');
        
        // Adiciona listener para Enter no textarea
        messageInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleMessageSubmit(event);
            }
        });
        
        // Função para auto-resize do textarea
        function autoResize() {
            messageInput.style.height = 'auto';
            const scrollHeight = messageInput.scrollHeight;
            const maxHeight = 120; // 3 linhas aprox.
            const newHeight = Math.min(scrollHeight, maxHeight);
            messageInput.style.height = newHeight + 'px';
        }
        
        // Adiciona listeners para auto-resize
        messageInput.addEventListener('input', autoResize);
        messageInput.addEventListener('keyup', autoResize);
        messageInput.addEventListener('paste', autoResize);
        
        // Expor função para uso externo
        messageInput.autoResize = autoResize;
        
        // Marca que os listeners já foram configurados
        messageInput.setAttribute('data-listeners-setup', 'true');
        console.log('✅ [setupMessageListeners] Listeners configurados com sucesso');
    } else {
        console.log('🔍 [setupMessageListeners] Listeners já configurados ou messageInput não encontrado');
    }
}

// Função para buscar grupos do backend e popular a lista
async function loadGroups() {
    console.log('🔍 [loadGroups] Iniciando carregamento de grupos...');
    try {
        showLoading('groupsList');
        
        // Faz requisição para listar grupos da empresa
        const response = await fetch(`${CONFIG.API_BASE_URL}/groups/empresa/${CONFIG.EMPRESA}`);
        const data = await response.json();
        
        console.log('🔍 [loadGroups] Resposta recebida:', data.success);
        
        if (data.success) {
            appState.groups = data.data;
            console.log('🔍 [loadGroups] Carregando conversas privadas...');
            await loadPrivateChats(); // Carrega conversas privadas
            console.log('🔍 [loadGroups] Populando lista de grupos...');
            await populateGroupsList(data.data); // Preenche a lista de grupos
            console.log('✅ [loadGroups] Grupos carregados com sucesso');
        } else {
            console.error('❌ [loadGroups] Erro na resposta:', data.message);
            showAlert('Erro ao carregar grupos: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('❌ [loadGroups] Erro ao carregar grupos:', error);
        showAlert('Erro ao carregar grupos', 'danger');
    } finally {
        hideLoading('groupsList');
        console.log('🔍 [loadGroups] Finalizado');
    }
}

// Função para carregar conversas privadas
async function loadPrivateChats() {
    console.log('🔍 [loadPrivateChats] Iniciando carregamento de conversas privadas...');
    try {
        // Busca todas as mensagens privadas do usuário atual
        const response = await fetch(`${CONFIG.API_BASE_URL}/private-message/private-messages?empresa=${CONFIG.EMPRESA}&usuario=${CONFIG.USUARIO}`);
        const data = await response.json();
        
        console.log('🔍 [loadPrivateChats] Resposta recebida:', data.success, 'Mensagens:', data.data?.length || 0);
        
        if (data.success) {
            // Agrupa mensagens por conversa
            console.log('🔍 [loadPrivateChats] Agrupando mensagens por conversa...');
            const conversations = groupPrivateMessages(data.data);
            appState.privateChats = conversations;
            console.log('✅ [loadPrivateChats] Conversas privadas carregadas:', conversations.length);
        } else {
            console.error('❌ [loadPrivateChats] Erro na resposta:', data.message);
        }
    } catch (error) {
        console.error('❌ [loadPrivateChats] Erro ao carregar conversas privadas:', error);
    }
}

// Função para agrupar mensagens privadas por conversa
function groupPrivateMessages(messages) {
    console.log('🔍 [groupPrivateMessages] Iniciando agrupamento de mensagens privadas:', messages.length);
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
    console.log('✅ [groupPrivateMessages] Conversas agrupadas:', result.length);
    return result;
}

// Preenche a lista de grupos com os dados recebidos
async function populateGroupsList(groups) {
    console.log('🔍 [populateGroupsList] Iniciando população da lista de grupos...');
    const groupsList = document.getElementById('groupsList');
    if (!groupsList) {
        console.error('❌ [populateGroupsList] groupsList não encontrado!');
        return;
    }
    
    console.log('🔍 [populateGroupsList] Limpando lista atual...');
    groupsList.innerHTML = '';
    
    // Adiciona conversas privadas primeiro
    if (appState.privateChats.length > 0) {
        console.log('🔍 [populateGroupsList] Adicionando conversas privadas:', appState.privateChats.length);
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
        console.log('🔍 [populateGroupsList] Nenhum grupo encontrado, mostrando mensagem vazia');
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
        console.log('✅ [populateGroupsList] Finalizado - nenhum grupo');
        return;
    }
    
    console.log('🔍 [populateGroupsList] Processando grupos:', groups.length);
    // Para cada grupo, busca a última mensagem e cria o item da lista
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        console.log(`🔍 [populateGroupsList] Processando grupo ${i + 1}/${groups.length}:`, group.nome_grupo);
        const lastMessage = await getLastMessage(group.id);
        const groupItem = createGroupListItem(group, lastMessage);
        groupsList.appendChild(groupItem);
    }
    
    console.log('✅ [populateGroupsList] Lista de grupos populada com sucesso');
}

// Busca a última mensagem de um grupo
async function getLastMessage(groupId) {
    console.log('🔍 [getLastMessage] Buscando última mensagem do grupo:', groupId);
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/groups/${groupId}/messages?empresa=${CONFIG.EMPRESA}`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            // Retorna a última mensagem do array (mais recente)
            const lastMessage = data.data[data.data.length - 1];
            console.log('✅ [getLastMessage] Última mensagem encontrada para grupo:', groupId);
            return lastMessage;
        }
        console.log('🔍 [getLastMessage] Nenhuma mensagem encontrada para grupo:', groupId);
        return null;
    } catch (error) {
        console.error('❌ [getLastMessage] Erro ao buscar última mensagem:', error);
        return null;
    }
}

// Cria o elemento visual de um item de grupo na lista
function createGroupListItem(group, lastMessage) {
    console.log('🔍 [createGroupListItem] Criando item para grupo:', group.nome_grupo);
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
    
    console.log('✅ [createGroupListItem] Item criado com sucesso');
    return groupItem;
}

// Cria o elemento visual de um item de conversa privada na lista
function createPrivateChatListItem(privateChat) {
    console.log('🔍 [createPrivateChatListItem] Criando item para conversa privada com:', privateChat.otherUser);
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
    
    console.log('✅ [createPrivateChatListItem] Item criado com sucesso');
    return privateChatItem;
}

// Quando o usuário seleciona um grupo
async function selectGroup(group) {
    console.log('🔍 [selectGroup] Selecionando grupo:', group.nome_grupo, 'ID:', group.id);
    
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
    console.log('🔍 [selectGroup] Carregando mensagens do grupo...');
    await loadMessages(group.id);
    
    // Mostra cabeçalho e área de input
    document.getElementById('chatHeader').style.display = 'block';
    document.getElementById('messageInputContainer').style.display = 'block';
    
    // Atualiza informações do cabeçalho
    document.getElementById('currentGroupName').textContent = group.nome_grupo;
    document.getElementById('currentGroupInfo').textContent = `Grupo • ${appState.messages.length} mensagens`;
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput && typeof messageInput.autoResize === 'function') messageInput.autoResize();
    
    console.log('✅ [selectGroup] Grupo selecionado com sucesso');
}

// Quando o usuário seleciona uma conversa privada
async function selectPrivateChat(privateChat) {
    console.log('🔍 [selectPrivateChat] Selecionando conversa privada com:', privateChat.otherUser);
    
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
    console.log('🔍 [selectPrivateChat] Carregando mensagens privadas...');
    await loadPrivateMessages(privateChat.otherUser);
    
    // Mostra cabeçalho e área de input
    document.getElementById('chatHeader').style.display = 'block';
    document.getElementById('messageInputContainer').style.display = 'block';
    
    // Atualiza informações do cabeçalho
    document.getElementById('currentGroupName').textContent = privateChat.otherUser;
    document.getElementById('currentGroupInfo').textContent = `Conversa privada • ${appState.messages.length} mensagens`;
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput && typeof messageInput.autoResize === 'function') messageInput.autoResize();
    
    console.log('✅ [selectPrivateChat] Conversa privada selecionada com sucesso');
}

// Busca mensagens privadas entre dois usuários
async function loadPrivateMessages(otherUser) {
    console.log('🔍 [loadPrivateMessages] Carregando mensagens privadas com:', otherUser);
    try {
        showLoading('messagesContainer');
        
        // Faz requisição para buscar mensagens privadas
        const response = await fetch(`${CONFIG.API_BASE_URL}/private-message/private-messages/conversation?empresa=${CONFIG.EMPRESA}&usuario1=${CONFIG.USUARIO}&usuario2=${otherUser}`);
        const data = await response.json();
        
        console.log('🔍 [loadPrivateMessages] Resposta recebida:', data.success, 'Mensagens:', data.data?.length || 0);
        
        if (data.success) {
            appState.messages = data.data;
            console.log('🔍 [loadPrivateMessages] Chamando displayMessages...');
            displayMessages(data.data); // Mostra mensagens na tela
            console.log('✅ [loadPrivateMessages] Mensagens privadas carregadas com sucesso');
        } else {
            console.error('❌ [loadPrivateMessages] Erro na resposta:', data.message);
            showAlert('Erro ao carregar mensagens privadas: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('❌ [loadPrivateMessages] Erro ao carregar mensagens privadas:', error);
        showAlert('Erro ao carregar mensagens privadas', 'danger');
    } finally {
        hideLoading('messagesContainer');
        console.log('🔍 [loadPrivateMessages] Finalizado');
    }
}

// Busca mensagens do grupo selecionado
async function loadMessages(groupId) {
    console.log('🔍 [loadMessages] Iniciando carregamento de mensagens para grupo:', groupId);
    try {
        // Faz requisição para buscar mensagens do grupo
        const response = await fetch(`${CONFIG.API_BASE_URL}/groups/${groupId}/messages?empresa=${CONFIG.EMPRESA}`);
        const data = await response.json();
        
        console.log('🔍 [loadMessages] Resposta recebida:', data.success, 'Mensagens:', data.data?.length || 0);
        
        if (data.success) {
            appState.messages = data.data;
            console.log('🔍 [loadMessages] Chamando displayMessages...');
            displayMessages(data.data);
            console.log('✅ [loadMessages] Mensagens carregadas com sucesso');
        } else {
            console.error('❌ [loadMessages] Erro na resposta:', data.message);
            showAlert('Erro ao carregar mensagens: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('❌ [loadMessages] Erro ao carregar mensagens:', error);
        showAlert('Erro ao carregar mensagens', 'danger');
    }
}

// Mostra as mensagens na tela
function displayMessages(messages) {
    console.log('🔍 [displayMessages] Iniciando exibição de mensagens:', messages.length);
    const container = document.getElementById('messagesContainer');
    if (!container) {
        console.error('❌ [displayMessages] messagesContainer não encontrado!');
        return;
    }
    
    if (messages.length === 0) {
        console.log('🔍 [displayMessages] Nenhuma mensagem, mostrando mensagem vazia');
        showEmptyMessages();
        return;
    }
    
    console.log('🔍 [displayMessages] Limpando container e criando elementos...');
    container.innerHTML = '';
    
    // Cria um elemento para cada mensagem
    messages.forEach((message, index) => {
        console.log(`🔍 [displayMessages] Criando mensagem ${index + 1}/${messages.length}`);
        const messageElement = createMessageElement(message);
        container.appendChild(messageElement);
    });
    
    // Faz scroll automático para a última mensagem
    console.log('🔍 [displayMessages] Fazendo scroll para última mensagem');
    container.scrollTop = container.scrollHeight;
    console.log('✅ [displayMessages] Mensagens exibidas com sucesso');
}

// Cria o elemento visual de uma mensagem
function createMessageElement(message) {
    console.log('🔍 [createMessageElement] Criando elemento para mensagem:', message.id);
    const messageDiv = document.createElement('div');
    
    // Determina se é mensagem própria (funciona para grupos e mensagens privadas)
    const isOwnMessage = message.usuario === CONFIG.USUARIO || message.remetente === CONFIG.USUARIO;
    messageDiv.className = `message ${isOwnMessage ? 'own' : 'other'}`;
    
    const time = new Date(message.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Detecta links no texto e transforma em <a>
    function linkify(text) {
        return text.replace(/(https?:\/\/[\w\-\.\/?#=&;%+~:@!$'()*\[\],]+)/gi, '<a href="$1" target="_blank">$1</a>');
    }
    const mensagemComLinks = linkify(message.mensagem);
    const editedText = message.editada ? ' <small>(editada)</small>' : '';
    
    // Status marker
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
    
    // Renderização de anexos
    let attachmentHtml = '';
    if (message.anexo_arquivo) {
        const fileName = message.anexo_arquivo;
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        if (['webm', 'mp3', 'wav', 'ogg'].includes(fileExtension)) {
            // Player de áudio
            attachmentHtml = `
                <div class="message-attachment">
                    <audio controls>
                        <source src="${CONFIG.API_BASE_URL}/uploads/${fileName}" type="audio/${fileExtension}">
                        Seu navegador não suporta áudio.
                    </audio>
                </div>
            `;
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
            // Imagem
            attachmentHtml = `
                <div class="message-attachment">
                    <img src="${CONFIG.API_BASE_URL}/uploads/${fileName}" alt="Imagem anexada" style="max-width: 300px; max-height: 300px; border-radius: 8px;">
                </div>
            `;
        } else {
            // Outros tipos de arquivo (PDF, DOC, etc.)
            attachmentHtml = `
                <div class="message-attachment">
                    <a href="${CONFIG.API_BASE_URL}/uploads/${fileName}" target="_blank" class="btn btn-outline-primary btn-sm">
                        <i class="fas fa-file"></i> ${fileName}
                    </a>
                </div>
            `;
        }
    }
    
    // Nome do usuário (funciona para grupos e mensagens privadas)
    const userName = message.usuario || message.remetente;
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-user">${userName}</span>
            <span class="message-time">${time}${editedText}${statusHtml}</span>
        </div>
        <div class="message-content">${mensagemComLinks}</div>
        ${attachmentHtml}
    `;
    
    console.log('✅ [createMessageElement] Elemento criado com sucesso');
    return messageDiv;
}

// Mostra mensagem "nenhuma mensagem ainda"
function showEmptyMessages() {
    console.log('🔍 [showEmptyMessages] Mostrando mensagem vazia...');
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
    console.log('✅ [showEmptyMessages] Mensagem vazia exibida');
}

// Lida com o envio de mensagem pelo formulário
async function handleMessageSubmit(event) {
    console.log('🔍 [handleMessageSubmit] Iniciando envio de mensagem...');
    
    // Previne comportamento padrão
    if (event) {
        event.preventDefault();
        console.log('🔍 [handleMessageSubmit] Evento prevenido');
    }
    
    const messageInput = document.getElementById('messageInput');
    const fileInput = document.getElementById('fileInput');

    // Valida se há grupo ou conversa privada selecionada
    if (!appState.currentGroup && !appState.currentPrivateChat) {
        console.log('❌ [handleMessageSubmit] Nenhum grupo/conversa selecionado');
        showAlert('Selecione um grupo ou conversa para enviar mensagens', 'warning');
        return;
    }

    // Verifica se há conteúdo para enviar
    const hasMessage = messageInput.value.trim().length > 0;
    const hasFile = fileInput && fileInput.files.length > 0;
    
    console.log('🔍 [handleMessageSubmit] hasMessage:', hasMessage, 'hasFile:', hasFile);
    
    if (!hasMessage && !hasFile) {
        console.log('❌ [handleMessageSubmit] Nenhum conteúdo para enviar');
        showAlert('Digite uma mensagem ou anexe um arquivo', 'warning');
        return;
    }

    // Previne envio duplo
    if (appState.isSendingMessage || appState.isProcessingMessage) {
        console.log('❌ [handleMessageSubmit] Já está enviando ou processando mensagem');
        return;
    }
    
    appState.isSendingMessage = true;
    appState.isProcessingMessage = true;
    console.log('🔍 [handleMessageSubmit] Iniciando envio...');

    try {
        if (appState.currentGroup) {
            console.log('🔍 [handleMessageSubmit] Enviando para grupo:', appState.currentGroup.id);
            await sendGroupMessage(messageInput, fileInput);
        } else if (appState.currentPrivateChat) {
            console.log('🔍 [handleMessageSubmit] Enviando mensagem privada');
            await sendPrivateMessage(messageInput, fileInput);
        }
        
        // Limpa campos após envio
        messageInput.value = '';
        if (fileInput) {
            fileInput.value = '';
            // Limpa o visual do botão de arquivo
            const fileBtn = document.querySelector('label[for="fileInput"]');
            if (fileBtn) {
                fileBtn.innerHTML = '<i class="fas fa-paperclip"></i>';
                fileBtn.classList.remove('btn-success');
                fileBtn.classList.add('btn-outline-secondary');
            }
        }
        
        if (typeof messageInput.autoResize === 'function') messageInput.autoResize();
        
        console.log('✅ [handleMessageSubmit] Mensagem enviada com sucesso');
        
    } catch (error) {
        console.error('❌ [handleMessageSubmit] Erro ao enviar mensagem:', error);
        showAlert('Erro ao enviar mensagem', 'danger');
    } finally {
        appState.isSendingMessage = false;
        appState.isProcessingMessage = false;
        console.log('🔍 [handleMessageSubmit] Finalizado');
    }
}

// Função para enviar mensagem para grupo
async function sendGroupMessage(messageInput, fileInput) {
    console.log('🔍 [sendGroupMessage] Iniciando envio para grupo...');
    const hasMessage = messageInput.value.trim().length > 0;
    const hasFile = fileInput && fileInput.files.length > 0;

    console.log('🔍 [sendGroupMessage] hasMessage:', hasMessage, 'hasFile:', hasFile);

    // Monta os dados do formulário
    const formData = new FormData();
    formData.append('group_id', appState.currentGroup.id);
    formData.append('empresa', CONFIG.EMPRESA);
    formData.append('usuario', CONFIG.USUARIO);
    formData.append('mensagem', messageInput.value || '');
    
    if (hasFile) {
        formData.append('anexo_arquivo', fileInput.files[0]);
    }

    try {
        console.log('🔍 [sendGroupMessage] Enviando requisição...');
        // Envia a mensagem para o backend
        const response = await fetch(`${CONFIG.API_BASE_URL}/messages`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        console.log('🔍 [sendGroupMessage] Resposta recebida:', data.success);
        
        if (data.success) {
            console.log('🔍 [sendGroupMessage] Recarregando mensagens...');
            
            // Recarrega as mensagens do grupo
            await loadMessages(appState.currentGroup.id);
            
            console.log('✅ [sendGroupMessage] Mensagem enviada e mensagens recarregadas');
        } else {
            console.error('❌ [sendGroupMessage] Erro na resposta:', data.message);
            showAlert('Erro ao enviar mensagem: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('❌ [sendGroupMessage] Erro ao enviar mensagem:', error);
        showAlert('Erro ao enviar mensagem', 'danger');
    }

    // Emite via socket para atualização em tempo real
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

// Função para enviar mensagem privada
async function sendPrivateMessage(messageInput, fileInput) {
    console.log('🔍 [sendPrivateMessage] Iniciando envio de mensagem privada...');
    const hasMessage = messageInput.value.trim().length > 0;
    const hasFile = fileInput && fileInput.files.length > 0;

    console.log('🔍 [sendPrivateMessage] hasMessage:', hasMessage, 'hasFile:', hasFile);

    try {
        if (hasFile) {
            console.log('🔍 [sendPrivateMessage] Enviando com arquivo...');
            // Envia com arquivo usando FormData
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
            console.log('🔍 [sendPrivateMessage] Resposta recebida (com arquivo):', data.success);
            
            if (data.success) {
                console.log('🔍 [sendPrivateMessage] Recarregando mensagens privadas...');
                await loadPrivateMessages(appState.currentPrivateChat.otherUser);
                console.log('🔍 [sendPrivateMessage] Recarregando grupos...');
                await loadGroups();
                console.log('✅ [sendPrivateMessage] Mensagem privada enviada com sucesso (com arquivo)');
            } else {
                console.error('❌ [sendPrivateMessage] Erro na resposta (com arquivo):', data.message);
                showAlert('Erro ao enviar mensagem privada: ' + data.message, 'danger');
            }
        } else {
            console.log('🔍 [sendPrivateMessage] Enviando sem arquivo...');
            // Envia sem arquivo usando JSON
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
            console.log('🔍 [sendPrivateMessage] Resposta recebida (sem arquivo):', data.success);
            
            if (data.success) {
                console.log('🔍 [sendPrivateMessage] Recarregando mensagens privadas...');
                await loadPrivateMessages(appState.currentPrivateChat.otherUser);
                console.log('🔍 [sendPrivateMessage] Recarregando grupos...');
                await loadGroups();
                console.log('✅ [sendPrivateMessage] Mensagem privada enviada com sucesso (sem arquivo)');
            } else {
                console.error('❌ [sendPrivateMessage] Erro na resposta (sem arquivo):', data.message);
                showAlert('Erro ao enviar mensagem privada: ' + data.message, 'danger');
            }
        }
    } catch (error) {
        console.error('❌ [sendPrivateMessage] Erro ao enviar mensagem privada:', error);
        showAlert('Erro ao enviar mensagem privada', 'danger');
    } finally {
        // Verifica se o painel ainda está aberto após o envio
        const chatPanel = document.getElementById('chatPanel');
        if (chatPanel) {
            const display = chatPanel.style.display;
            console.log('🔍 [sendPrivateMessage] Status do painel após envio:', display);
            if (display === 'none') {
                console.log('❌ [sendPrivateMessage] ATENÇÃO: Painel fechou durante o envio!');
            }
        }
    }
}

// ===============================
// FUNCIONALIDADES DE GRUPOS
// ===============================

// Função para criar novo grupo (abre modal)
function createNewGroup() {
    console.log('🔍 [createNewGroup] Abrindo modal de novo grupo...');
    const newGroupModal = new bootstrap.Modal(document.getElementById('newGroupModal'));
    newGroupModal.show();
    console.log('✅ [createNewGroup] Modal aberto com sucesso');
}

// Função para enviar novo grupo para o backend
async function submitNewGroup() {
    console.log('🔍 [submitNewGroup] Enviando novo grupo...');
    const groupNameInput = document.getElementById('groupName');
    if (!groupNameInput.value.trim()) {
        console.log('❌ [submitNewGroup] Nome do grupo não preenchido');
        showAlert('Digite o nome do grupo', 'warning');
        return;
    }
    try {
        showLoading('groupsList');
        console.log('🔍 [submitNewGroup] Enviando requisição...');
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
        console.log('🔍 [submitNewGroup] Resposta recebida:', data.success);
        
        if (data.success) {
            console.log('✅ [submitNewGroup] Grupo criado com sucesso');
            // Fecha modal e recarrega grupos
            const newGroupModal = bootstrap.Modal.getInstance(document.getElementById('newGroupModal'));
            newGroupModal.hide();
            groupNameInput.value = '';
            console.log('🔍 [submitNewGroup] Recarregando grupos...');
            await loadGroups();
            console.log('✅ [submitNewGroup] Processo finalizado com sucesso');
        } else {
            console.error('❌ [submitNewGroup] Erro na resposta:', data.message);
            showAlert('Erro ao criar grupo: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('❌ [submitNewGroup] Erro ao criar grupo:', error);
        showAlert('Erro ao criar grupo', 'danger');
    } finally {
        hideLoading('groupsList');
        console.log('🔍 [submitNewGroup] Finalizado');
    }
}

// Função para abrir modal de editar grupo
function openEditGroupModal() {
    console.log('🔍 [openEditGroupModal] Abrindo modal de editar grupo...');
    if (!appState.currentGroup) {
        console.log('❌ [openEditGroupModal] Nenhum grupo selecionado');
        showAlert('Nenhum grupo selecionado', 'warning');
        return;
    }
    
    const editGroupModal = new bootstrap.Modal(document.getElementById('editGroupModal'));
    const editGroupNameInput = document.getElementById('editGroupName');
    editGroupNameInput.value = appState.currentGroup.nome_grupo;
    editGroupModal.show();
    console.log('✅ [openEditGroupModal] Modal aberto com sucesso');
}

// Função para salvar edição do grupo
async function saveGroupEdit() {
    console.log('🔍 [saveGroupEdit] Salvando edição do grupo...');
    const editGroupNameInput = document.getElementById('editGroupName');
    const newName = editGroupNameInput.value.trim();
    
    if (!newName) {
        console.log('❌ [saveGroupEdit] Novo nome não preenchido');
        showAlert('Digite o novo nome do grupo', 'warning');
        return;
    }
    
    try {
        // TODO: Implementar rota de edição no backend
        console.log('🔍 [saveGroupEdit] Funcionalidade não implementada');
        showAlert('Funcionalidade de editar grupo será implementada em breve!', 'info');
        
        // Fecha o modal
        const editGroupModal = bootstrap.Modal.getInstance(document.getElementById('editGroupModal'));
        editGroupModal.hide();
        console.log('✅ [saveGroupEdit] Modal fechado');
    } catch (error) {
        console.error('❌ [saveGroupEdit] Erro ao editar grupo:', error);
        showAlert('Erro ao editar grupo', 'danger');
    }
}

// Função para abrir modal de confirmar remoção
function openDeleteGroupModal() {
    console.log('🔍 [openDeleteGroupModal] Abrindo modal de confirmar remoção...');
    if (!appState.currentGroup) {
        console.log('❌ [openDeleteGroupModal] Nenhum grupo selecionado');
        showAlert('Nenhum grupo selecionado', 'warning');
        return;
    }
    
    const deleteGroupModal = new bootstrap.Modal(document.getElementById('deleteGroupModal'));
    document.getElementById('deleteGroupName').textContent = appState.currentGroup.nome_grupo;
    deleteGroupModal.show();
    console.log('✅ [openDeleteGroupModal] Modal aberto com sucesso');
}

// Função para confirmar remoção do grupo
async function confirmDeleteGroup() {
    console.log('🔍 [confirmDeleteGroup] Confirmando remoção do grupo...');
    try {
        showLoading('messagesContainer');
        console.log('🔍 [confirmDeleteGroup] Enviando requisição...');
        
        // Faz requisição para remover o grupo
        const response = await fetch(`${CONFIG.API_BASE_URL}/groups/${appState.currentGroup.id}?empresa=${CONFIG.EMPRESA}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        console.log('🔍 [confirmDeleteGroup] Resposta recebida:', data.success);
        
        if (data.success) {
            console.log('✅ [confirmDeleteGroup] Grupo removido com sucesso');
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
            console.log('🔍 [confirmDeleteGroup] Recarregando grupos...');
            await loadGroups();
            console.log('✅ [confirmDeleteGroup] Processo finalizado com sucesso');
        } else {
            console.error('❌ [confirmDeleteGroup] Erro na resposta:', data.message);
            showAlert('Erro ao remover grupo: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('❌ [confirmDeleteGroup] Erro ao remover grupo:', error);
        showAlert('Erro ao remover grupo', 'danger');
    } finally {
        hideLoading('messagesContainer');
        console.log('🔍 [confirmDeleteGroup] Finalizado');
    }
}

// ===============================
// FUNCIONALIDADES DE MENSAGENS PRIVADAS
// ===============================

// Função para abrir modal de mensagem privada
function openPrivateChatModal() {
    console.log('🔍 [openPrivateChatModal] Abrindo modal de mensagem privada...');
    const privateChatModal = new bootstrap.Modal(document.getElementById('privateChatModal'));
    loadUsuarios(); // Carrega lista de usuários
    privateChatModal.show();
    console.log('✅ [openPrivateChatModal] Modal aberto com sucesso');
}

// Função para carregar lista de usuários
async function loadUsuarios() {
    console.log('🔍 [loadUsuarios] Carregando lista de usuários...');
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
        
        console.log('🔍 [loadUsuarios] Resposta recebida:', data.success, 'Usuários:', data.data?.length || 0);
        
        if (data.success) {
            appState.usuarios = data.data.filter(usuario => usuario !== CONFIG.USUARIO); // Remove o usuário atual
            console.log('🔍 [loadUsuarios] Populando lista de usuários...');
            populateUsuariosList(data.data.filter(usuario => usuario !== CONFIG.USUARIO));
            console.log('✅ [loadUsuarios] Usuários carregados com sucesso');
        } else {
            console.error('❌ [loadUsuarios] Erro na resposta:', data.message);
            showAlert('Erro ao carregar usuários: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('❌ [loadUsuarios] Erro ao carregar usuários:', error);
        showAlert('Erro ao carregar usuários', 'danger');
    }
}

// Função para preencher lista de usuários
function populateUsuariosList(usuarios) {
    console.log('🔍 [populateUsuariosList] Populando lista de usuários:', usuarios.length);
    const usuariosList = document.getElementById('usuariosList');
    
    if (usuarios.length === 0) {
        console.log('🔍 [populateUsuariosList] Nenhum usuário encontrado');
        usuariosList.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-users fa-2x mb-2"></i>
                <p>Nenhum usuário encontrado</p>
                <small>Os usuários aparecerão aqui quando enviarem mensagens</small>
            </div>
        `;
        console.log('✅ [populateUsuariosList] Lista vazia exibida');
        return;
    }
    
    console.log('🔍 [populateUsuariosList] Criando itens de usuário...');
    usuariosList.innerHTML = '';
    
    usuarios.forEach((usuario, index) => {
        console.log(`🔍 [populateUsuariosList] Criando item ${index + 1}/${usuarios.length}:`, usuario);
        const usuarioItem = createUsuarioItem(usuario);
        usuariosList.appendChild(usuarioItem);
    });
    
    console.log('✅ [populateUsuariosList] Lista de usuários populada com sucesso');
}

// Função para criar item de usuário
function createUsuarioItem(usuario) {
    console.log('🔍 [createUsuarioItem] Criando item para usuário:', usuario);
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
    
    console.log('✅ [createUsuarioItem] Item criado com sucesso');
    return usuarioItem;
}

// Função para iniciar conversa privada
async function startPrivateChat(usuario) {
    console.log('🔍 [startPrivateChat] Iniciando conversa privada com:', usuario);
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
        console.log('🔍 [startPrivateChat] Selecionando conversa...');
        await selectPrivateChat(newPrivateChat);
        
        // Atualiza a lista de grupos/conversas
        console.log('🔍 [startPrivateChat] Atualizando lista de grupos...');
        await loadGroups();
        
        showAlert(`Conversa iniciada com ${usuario}`, 'success');
        console.log('✅ [startPrivateChat] Conversa iniciada com sucesso');
        
    } catch (error) {
        console.error('❌ [startPrivateChat] Erro ao iniciar conversa privada:', error);
        showAlert('Erro ao iniciar conversa privada', 'danger');
    }
}

// Função para enviar mensagem privada (antiga - removida)
async function sendPrivateMessage() {
    console.log('🔍 [sendPrivateMessage-old] Função antiga chamada');
    // Esta função foi substituída por sendPrivateMessage
    showAlert('Use a área de chat para enviar mensagens privadas', 'info');
    console.log('✅ [sendPrivateMessage-old] Alerta exibido');
}

// ===============================
// FUNCIONALIDADES DE USUÁRIO
// ===============================

// Função para abrir modal de configuração de nome
function openUserNameModal() {
    console.log('🔍 [openUserNameModal] Abrindo modal de configuração de nome...');
    const userNameModal = new bootstrap.Modal(document.getElementById('userNameModal'));
    const userNameInput = document.getElementById('userNameInput');
    
    // Preenche com o nome atual se existir
    userNameInput.value = CONFIG.USUARIO;
    
    userNameModal.show();
    console.log('✅ [openUserNameModal] Modal aberto com sucesso');
}

// Função para salvar o nome do usuário
function saveUserName() {
    console.log('🔍 [saveUserName] Salvando nome do usuário...');
    const userLoginInput = document.getElementById('userLoginInput');
    const userPasswordInput = document.getElementById('userPasswordInput');
    const userNameInput = document.getElementById('userNameInput');
    const login = userLoginInput.value.trim();
    const senha = userPasswordInput.value.trim();
    const nome = userNameInput.value.trim();

    console.log('🔍 [saveUserName] Dados:', { login, senha: '***', nome });

    if (!login || !senha || !nome) {
        console.log('❌ [saveUserName] Campos não preenchidos');
        showAlert('Preencha todos os campos!', 'warning');
        return;
    }
    if (nome.length < 2) {
        console.log('❌ [saveUserName] Nome muito curto');
        showAlert('O nome deve ter pelo menos 2 caracteres', 'warning');
        return;
    }
    if (login.length < 3) {
        console.log('❌ [saveUserName] Login muito curto');
        showAlert('O login deve ter pelo menos 3 caracteres', 'warning');
        return;
    }
    if (senha.length < 3) {
        console.log('❌ [saveUserName] Senha muito curta');
        showAlert('A senha deve ter pelo menos 3 caracteres', 'warning');
        return;
    }

    console.log('🔍 [saveUserName] Enviando requisição...');
    fetch(`${CONFIG.API_BASE_URL}/usuarios/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, senha, nome })
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao salvar usuário');
        
        console.log('✅ [saveUserName] Usuário salvo com sucesso');
        
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
        
        console.log('✅ [saveUserName] Processo finalizado com sucesso');
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

// Função para carregar nome do usuário do localStorage
function loadUserName() {
    console.log('🔍 [loadUserName] Carregando nome do usuário...');
    const savedName = localStorage.getItem('kchat_user_name');
    if (savedName) {
        CONFIG.USUARIO = savedName;
        console.log('✅ [loadUserName] Nome carregado:', savedName);
    } else {
        console.log('🔍 [loadUserName] Nenhum nome salvo encontrado');
    }
}

// Função para verificar se o usuário já configurou o nome
function checkUserName() {
    console.log('🔍 [checkUserName] Verificando nome do usuário...');
    const savedName = localStorage.getItem('kchat_user_name');
    console.log('🔍 [checkUserName] Nome salvo:', savedName);
    
    if (!savedName || savedName === 'Usuário Teste') {
        console.log('🔍 [checkUserName] Nome não configurado, abrindo modal...');
        // Abre modal para configurar nome na primeira vez
        setTimeout(() => {
            openUserNameModal();
        }, 1000);
    } else {
        console.log('✅ [checkUserName] Nome já configurado');
    }
}

// ===============================
// FUNÇÕES AUXILIARES
// ===============================

// Lida com seleção de arquivo
function handleFileSelect(event) {
    console.log('🔍 [handleFileSelect] Arquivo selecionado...');
    const file = event.target.files[0];
    if (file) {
        console.log('🔍 [handleFileSelect] Processando arquivo:', file.name, 'Tamanho:', file.size, 'bytes');
        
        // Mostra feedback visual do arquivo selecionado
        const fileBtn = document.querySelector('label[for="fileInput"]');
        const originalText = fileBtn.innerHTML;
        
        // Atualiza o botão para mostrar o nome do arquivo
        fileBtn.innerHTML = `<i class="fas fa-file"></i> ${file.name.substring(0, 15)}${file.name.length > 15 ? '...' : ''}`;
        fileBtn.classList.add('btn-success');
        fileBtn.classList.remove('btn-outline-secondary');
        
        // Restaura o botão após 3 segundos
        setTimeout(() => {
            fileBtn.innerHTML = originalText;
            fileBtn.classList.remove('btn-success');
            fileBtn.classList.add('btn-outline-secondary');
        }, 3000);
        
        console.log('✅ [handleFileSelect] Arquivo processado com sucesso');
    } else {
        console.log('🔍 [handleFileSelect] Nenhum arquivo selecionado');
    }
}

// Mostra um loading em um elemento
function showLoading(elementId) {
    console.log('🔍 [showLoading] Mostrando loading para:', elementId);
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.add('loading');
        console.log('✅ [showLoading] Loading adicionado');
    } else {
        console.error('❌ [showLoading] Elemento não encontrado:', elementId);
    }
}

function hideLoading(elementId) {
    console.log('🔍 [hideLoading] Escondendo loading para:', elementId);
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.remove('loading');
        console.log('✅ [hideLoading] Loading removido');
    } else {
        console.error('❌ [hideLoading] Elemento não encontrado:', elementId);
    }
}

// Mostra um alerta na tela
function showAlert(message, type = 'info') {
    console.log('🔍 [showAlert] Mostrando alerta:', type, message);
    
    // Verifica estado do painel antes do alerta
    const chatPanel = document.getElementById('chatPanel');
    const displayBefore = chatPanel ? chatPanel.style.display : 'elemento não encontrado';
    console.log('🔍 [showAlert] Estado do painel ANTES do alerta:', displayBefore);
    
    alert(message); // Simples, pode ser melhorado
    
    // Verifica estado do painel depois do alerta
    const displayAfter = chatPanel ? chatPanel.style.display : 'elemento não encontrado';
    console.log('🔍 [showAlert] Estado do painel DEPOIS do alerta:', displayAfter);
    
    if (displayBefore !== displayAfter) {
        console.error('❌ [showAlert] ATENÇÃO: Estado do painel mudou durante o alerta!');
    }
    
    console.log('✅ [showAlert] Alerta exibido');
}

// Quando o usuário troca de grupo
async function handleGroupChange(event) {
    console.log('🔍 [handleGroupChange] Troca de grupo iniciada...');
    const groupId = event.target.value;
    const deleteGroupBtn = document.getElementById('deleteGroupBtn');
    
    console.log('🔍 [handleGroupChange] ID do grupo selecionado:', groupId);
    
    if (!groupId) {
        console.log('🔍 [handleGroupChange] Nenhum grupo selecionado, limpando estado...');
        appState.currentGroup = null;
        appState.messages = [];
        showEmptyMessages();
        deleteGroupBtn.style.display = 'none'; // Esconde botão de remover
        console.log('✅ [handleGroupChange] Estado limpo');
        return;
    }
    
    // Atualiza grupo atual e carrega mensagens
    appState.currentGroup = appState.groups.find(g => g.id == groupId);
    deleteGroupBtn.style.display = 'block'; // Mostra botão de remover
    console.log('🔍 [handleGroupChange] Carregando mensagens do grupo:', groupId);
    await loadMessages(groupId);
    console.log('✅ [handleGroupChange] Grupo alterado com sucesso');
} 