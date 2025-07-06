// ===============================
// main.js — Lógica principal do chat KChat
// Comentários detalhados para facilitar o entendimento de iniciantes
// ===============================

// Configurações globais do sistema (ajuste conforme necessário)
const CONFIG = {
    API_BASE_URL: 'http://localhost:3008/api', // URL base da API backend
    EMPRESA: 'Krolik', // Nome da empresa (pode ser alterado)
    USUARIO: 'Usuário Teste' // Nome do usuário (pode ser alterado)
};

// Estado global da aplicação (guarda grupo atual, mensagens, etc)
let appState = {
    currentGroup: null, // Grupo selecionado
    groups: [],        // Lista de grupos
    messages: [],      // Mensagens do grupo atual
    isModalOpen: false // Se o modal do chat está aberto
};

// Inicialização da aplicação ao carregar a página
// Adiciona listeners para abrir modal, enviar mensagem, trocar grupo, etc
// DOMContentLoaded garante que o HTML já foi carregado
// ---------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 KChat inicializado');
    
    // Carrega grupos ao abrir o modal do chat
    const chatModal = document.getElementById('chatModal');
    if (chatModal) {
        chatModal.addEventListener('show.bs.modal', function() {
            loadGroups(); // Busca grupos do backend
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
});

// Função para abrir o modal do chat
function openChatModal() {
    const chatModal = new bootstrap.Modal(document.getElementById('chatModal'));
    chatModal.show();
    appState.isModalOpen = true;
}

// Função para buscar grupos do backend e popular o select
async function loadGroups() {
    try {
        showLoading('groupSelect'); // Mostra loading
        
        // Faz requisição para listar grupos da empresa
        const response = await fetch(`${CONFIG.API_BASE_URL}/conversations/empresa/${CONFIG.EMPRESA}`);
        const data = await response.json();
        
        if (data.success) {
            appState.groups = data.data;
            populateGroupSelect(data.data); // Preenche o select
        } else {
            showAlert('Erro ao carregar grupos: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Erro ao carregar grupos:', error);
        showAlert('Erro ao carregar grupos', 'danger');
    } finally {
        hideLoading('groupSelect');
    }
}

// Preenche o select de grupos com os dados recebidos
function populateGroupSelect(groups) {
    const groupSelect = document.getElementById('groupSelect');
    if (!groupSelect) return;
    
    // Limpa opções existentes (mantém a primeira)
    groupSelect.innerHTML = '<option value="">Selecione um grupo...</option>';
    
    // Adiciona cada grupo como opção
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.nome_grupo;
        groupSelect.appendChild(option);
    });
}

// Quando o usuário troca de grupo
async function handleGroupChange(event) {
    const groupId = event.target.value;
    
    if (!groupId) {
        appState.currentGroup = null;
        appState.messages = [];
        showEmptyMessages(); // Mostra mensagem "nenhuma mensagem"
        return;
    }
    
    // Atualiza grupo atual e carrega mensagens
    appState.currentGroup = appState.groups.find(g => g.id == groupId);
    await loadMessages(groupId);
}

// Busca mensagens do grupo selecionado
async function loadMessages(groupId) {
    try {
        showLoading('messagesContainer');
        
        // Faz requisição para buscar mensagens do grupo
        const response = await fetch(`${CONFIG.API_BASE_URL}/chat/conversations/${groupId}/messages?empresa=${CONFIG.EMPRESA}`);
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
    // Aplica classe diferente se for mensagem do próprio usuário
    messageDiv.className = `message ${message.usuario === CONFIG.USUARIO ? 'own' : 'other'}`;
    
    // Formata o horário da mensagem
    const time = new Date(message.hora).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Monta HTML de anexo/link se existir
    let attachmentHtml = '';
    if (message.anexo_link) {
        attachmentHtml = `
            <div class="message-attachment">
                <i class="fas fa-link"></i>
                <a href="${message.anexo_link}" target="_blank">${message.anexo_link}</a>
            </div>
        `;
    } else if (message.anexo_arquivo) {
        attachmentHtml = `
            <div class="message-attachment">
                <i class="fas fa-paperclip"></i>
                <a href="${CONFIG.API_BASE_URL}/uploads/${message.anexo_arquivo}" target="_blank">${message.anexo_arquivo}</a>
            </div>
        `;
    }
    
    // Indica se a mensagem foi editada
    const editedText = message.editada ? ' <small>(editada)</small>' : '';
    
    // Monta o HTML da mensagem
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-user">${message.usuario}</span>
            <span class="message-time">${time}${editedText}</span>
        </div>
        <div class="message-content">${message.mensagem}</div>
        ${attachmentHtml}
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

    // Valida se há grupo selecionado
    if (!appState.currentGroup) {
        showAlert('Selecione um grupo para enviar mensagens', 'warning');
        return;
    }

    // Monta os dados do formulário
    const formData = new FormData();
    formData.append('conversation_id', appState.currentGroup.id);
    formData.append('empresa', CONFIG.EMPRESA);
    formData.append('usuario', CONFIG.USUARIO);
    formData.append('mensagem', messageInput.value);
    if (linkInput && linkInput.value) {
        formData.append('anexo_link', linkInput.value);
    }
    if (fileInput && fileInput.files.length > 0) {
        formData.append('anexo_arquivo', fileInput.files[0]);
    }

    try {
        showLoading('messagesContainer');
        // Envia a mensagem para o backend
        const response = await fetch(`${CONFIG.API_BASE_URL}/chat/messages`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            // Limpa campos após envio
            messageInput.value = '';
            if (linkInput) linkInput.value = '';
            if (fileInput) fileInput.value = '';
            hideLinkInput();
            // Atualiza mensagens
            await loadMessages(appState.currentGroup.id);
        } else {
            showAlert('Erro ao enviar mensagem: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showAlert('Erro ao enviar mensagem', 'danger');
    } finally {
        hideLoading('messagesContainer');
    }
}

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
        showLoading('groupSelect');
        // Envia requisição para criar grupo
        const response = await fetch(`${CONFIG.API_BASE_URL}/conversations`, {
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
        hideLoading('groupSelect');
    }
}

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

// Lida com seleção de arquivo (pode adicionar validação extra aqui)
function handleFileSelect(event) {
    // Exemplo: pode mostrar nome do arquivo selecionado
    // const file = event.target.files[0];
    // if (file) { ... }
}

// Mostra um loading em um elemento (pode ser melhorado)
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

// Mostra um alerta na tela (pode customizar para usar NotificationManager do utils.js)
function showAlert(message, type = 'info') {
    alert(message); // Simples, pode ser melhorado
} 