/**
 * KChat - Chat JavaScript
 * Gerencia funcionalidades do chat
 */

class ChatManager {
    constructor() {
        this.api = window.KChatUtils.api;
        this.notifications = window.KChatUtils.notifications;
        this.loading = window.KChatUtils.loading;
        this.Formatter = window.KChatUtils.Formatter;
        this.StorageManager = window.KChatUtils.StorageManager;
        this.Debouncer = window.KChatUtils.Debouncer;
        
        this.currentUser = null;
        this.messages = [];
        this.lastMessageId = 0;
        this.isPolling = false;
        this.pollingInterval = null;
        this.debouncer = new this.Debouncer(300);
        
        this.init();
    }

    /**
     * Inicializar gerenciador de chat
     */
    async init() {
        await this.checkAuth();
        this.bindEvents();
        this.loadUserData();
        this.loadStats();
        this.startPolling();
    }

    /**
     * Verificar autenticação
     */
    async checkAuth() {
        if (!this.api.isAuthenticated()) {
            this.notifications.error('Você precisa estar logado para acessar o chat');
            window.location.href = '/index.html';
            return;
        }

        try {
            const response = await this.api.get(API_CONFIG.ENDPOINTS.AUTH.VERIFY);
            if (response.success) {
                this.currentUser = response.data.user;
                this.updateUI();
            } else {
                throw new Error('Token inválido');
            }
        } catch (error) {
            this.notifications.error('Sessão expirada. Faça login novamente.');
            this.api.removeToken();
            window.location.href = '/index.html';
        }
    }

    /**
     * Vincular eventos
     */
    bindEvents() {
        // Botão para abrir chat
        const openChatBtn = document.getElementById('openChatBtn');
        if (openChatBtn) {
            openChatBtn.addEventListener('click', () => this.openChat());
        }

        // Formulário de mensagem
        const messageForm = document.getElementById('messageForm');
        if (messageForm) {
            messageForm.addEventListener('submit', (e) => this.handleSendMessage(e));
        }

        // Input de mensagem
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', (e) => this.handleMessageInput(e));
            messageInput.addEventListener('keydown', (e) => this.handleMessageKeydown(e));
        }

        // Botão de atualizar mensagens
        const refreshBtn = document.getElementById('refreshMessagesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshMessages());
        }

        // Botão de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }

        // Botão de perfil
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => this.handleProfile(e));
        }

        // Modal de chat
        const chatModal = document.getElementById('chatModal');
        if (chatModal) {
            chatModal.addEventListener('shown.bs.modal', () => {
                this.loadMessages();
                this.scrollToBottom();
            });
        }
    }

    /**
     * Carregar dados do usuário
     */
    loadUserData() {
        if (this.currentUser) {
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.name;
            }

            const companyNameElement = document.getElementById('companyName');
            if (companyNameElement) {
                companyNameElement.textContent = this.currentUser.company_name;
            }
        }
    }

    /**
     * Atualizar interface
     */
    updateUI() {
        this.loadUserData();
        this.loadStats();
    }

    /**
     * Carregar estatísticas
     */
    async loadStats() {
        try {
            const response = await this.api.get(API_CONFIG.ENDPOINTS.CHAT.STATS);
            if (response.success) {
                this.updateStats(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    /**
     * Atualizar estatísticas na UI
     * @param {Object} data - Dados das estatísticas
     */
    updateStats(data) {
        const { stats } = data;
        
        const totalMessagesElement = document.getElementById('totalMessages');
        if (totalMessagesElement) {
            totalMessagesElement.textContent = stats.totalMessages;
        }

        const onlineUsersElement = document.getElementById('onlineUsers');
        if (onlineUsersElement) {
            onlineUsersElement.textContent = stats.totalUsers;
        }

        const todayMessagesElement = document.getElementById('todayMessages');
        if (todayMessagesElement) {
            todayMessagesElement.textContent = stats.messagesLast7Days;
        }

        // Mostrar seção de estatísticas
        const statsRow = document.getElementById('statsRow');
        if (statsRow) {
            statsRow.style.display = 'block';
        }
    }

    /**
     * Abrir modal do chat
     */
    openChat() {
        const chatModal = new bootstrap.Modal(document.getElementById('chatModal'));
        chatModal.show();
    }

    /**
     * Carregar mensagens
     */
    async loadMessages() {
        try {
            this.showLoadingMessages();
            
            const response = await this.api.get(API_CONFIG.ENDPOINTS.CHAT.RECENT, {
                limit: 50
            });

            if (response.success) {
                this.messages = response.data.messages.reverse(); // Ordenar por data mais antiga primeiro
                this.renderMessages();
                
                if (this.messages.length > 0) {
                    this.lastMessageId = Math.max(...this.messages.map(m => m.id));
                }
            }
        } catch (error) {
            this.notifications.error('Erro ao carregar mensagens');
            console.error('Erro ao carregar mensagens:', error);
        } finally {
            this.hideLoadingMessages();
        }
    }

    /**
     * Mostrar loading de mensagens
     */
    showLoadingMessages() {
        const loadingElement = document.getElementById('loadingMessages');
        const noMessagesElement = document.getElementById('noMessages');
        
        if (loadingElement) loadingElement.style.display = 'block';
        if (noMessagesElement) noMessagesElement.style.display = 'none';
    }

    /**
     * Ocultar loading de mensagens
     */
    hideLoadingMessages() {
        const loadingElement = document.getElementById('loadingMessages');
        if (loadingElement) loadingElement.style.display = 'none';
    }

    /**
     * Renderizar mensagens
     */
    renderMessages() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        if (this.messages.length === 0) {
            this.showNoMessages();
            return;
        }

        chatMessages.innerHTML = '';
        
        this.messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            chatMessages.appendChild(messageElement);
        });

        this.scrollToBottom();
    }

    /**
     * Mostrar mensagem de "nenhuma mensagem"
     */
    showNoMessages() {
        const chatMessages = document.getElementById('chatMessages');
        const noMessagesElement = document.getElementById('noMessages');
        
        if (chatMessages) chatMessages.innerHTML = '';
        if (noMessagesElement) noMessagesElement.style.display = 'block';
    }

    /**
     * Criar elemento de mensagem
     * @param {Object} message - Dados da mensagem
     * @returns {HTMLElement} Elemento da mensagem
     */
    createMessageElement(message) {
        const isOwnMessage = message.user_id === this.currentUser.id;
        const messageClass = isOwnMessage ? 'message own' : 'message other';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = messageClass;
        messageDiv.dataset.messageId = message.id;
        
        const initials = this.Formatter.getInitials(message.user_name);
        const formattedTime = this.Formatter.formatDate(message.created_at);
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${this.Formatter.escapeHtml(message.user_name)}</span>
                    <span class="message-time">${formattedTime}</span>
                </div>
                <p class="message-text">${this.Formatter.escapeHtml(message.content)}</p>
            </div>
        `;

        return messageDiv;
    }

    /**
     * Rolar para o final do chat
     */
    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    /**
     * Manipular envio de mensagem
     * @param {Event} e - Evento do formulário
     */
    async handleSendMessage(e) {
        e.preventDefault();
        
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        
        if (!content) {
            this.notifications.warning('Digite uma mensagem');
            return;
        }

        try {
            const response = await this.api.post(API_CONFIG.ENDPOINTS.CHAT.MESSAGES, {
                content
            });

            if (response.success) {
                messageInput.value = '';
                this.updateCharCount();
                
                // Adicionar mensagem à lista
                this.messages.push(response.data.message);
                this.renderMessages();
                
                // Atualizar estatísticas
                this.loadStats();
            }
        } catch (error) {
            this.notifications.error('Erro ao enviar mensagem');
            console.error('Erro ao enviar mensagem:', error);
        }
    }

    /**
     * Manipular input de mensagem
     * @param {Event} e - Evento de input
     */
    handleMessageInput(e) {
        this.updateCharCount();
        this.debouncer.debounce(() => {
            // Auto-resize do textarea
            const textarea = e.target;
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        });
    }

    /**
     * Manipular teclas no input de mensagem
     * @param {Event} e - Evento de keydown
     */
    handleMessageKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const messageForm = document.getElementById('messageForm');
            if (messageForm) {
                messageForm.dispatchEvent(new Event('submit'));
            }
        }
    }

    /**
     * Atualizar contador de caracteres
     */
    updateCharCount() {
        const messageInput = document.getElementById('messageInput');
        const charCount = document.getElementById('charCount');
        
        if (messageInput && charCount) {
            const count = messageInput.value.length;
            charCount.textContent = count;
            
            // Mudar cor se exceder limite
            if (count > 900) {
                charCount.style.color = '#dc3545';
            } else if (count > 800) {
                charCount.style.color = '#ffc107';
            } else {
                charCount.style.color = '#6c757d';
            }
        }
    }

    /**
     * Atualizar mensagens
     */
    async refreshMessages() {
        await this.loadMessages();
        this.notifications.success('Mensagens atualizadas');
    }

    /**
     * Iniciar polling para novas mensagens
     */
    startPolling() {
        if (this.isPolling) return;
        
        this.isPolling = true;
        this.pollingInterval = setInterval(async () => {
            await this.checkNewMessages();
        }, 5000); // Verificar a cada 5 segundos
    }

    /**
     * Parar polling
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isPolling = false;
    }

    /**
     * Verificar novas mensagens
     */
    async checkNewMessages() {
        try {
            const response = await this.api.get(API_CONFIG.ENDPOINTS.CHAT.RECENT, {
                limit: 10
            });

            if (response.success) {
                const newMessages = response.data.messages.filter(
                    message => message.id > this.lastMessageId
                );

                if (newMessages.length > 0) {
                    // Adicionar novas mensagens
                    this.messages.push(...newMessages);
                    this.lastMessageId = Math.max(...newMessages.map(m => m.id));
                    
                    // Atualizar UI se o chat estiver aberto
                    const chatModal = document.getElementById('chatModal');
                    if (chatModal && chatModal.classList.contains('show')) {
                        this.renderMessages();
                    }
                    
                    // Atualizar estatísticas
                    this.loadStats();
                }
            }
        } catch (error) {
            console.error('Erro ao verificar novas mensagens:', error);
        }
    }

    /**
     * Manipular logout
     * @param {Event} e - Evento de clique
     */
    async handleLogout(e) {
        e.preventDefault();
        
        if (confirm('Tem certeza que deseja sair?')) {
            this.stopPolling();
            await window.authManager.logout();
        }
    }

    /**
     * Manipular perfil
     * @param {Event} e - Evento de clique
     */
    handleProfile(e) {
        e.preventDefault();
        
        const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
        
        // Preencher dados do usuário
        if (this.currentUser) {
            const profileName = document.getElementById('profileName');
            const profileEmail = document.getElementById('profileEmail');
            const profileCompany = document.getElementById('profileCompany');
            
            if (profileName) profileName.value = this.currentUser.name;
            if (profileEmail) profileEmail.value = this.currentUser.email;
            if (profileCompany) profileCompany.value = this.currentUser.company_name;
        }
        
        profileModal.show();
    }

    /**
     * Salvar perfil
     */
    async saveProfile() {
        const name = document.getElementById('profileName').value.trim();
        const email = document.getElementById('profileEmail').value.trim();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (currentPassword && newPassword) {
            updateData.currentPassword = currentPassword;
            updateData.newPassword = newPassword;
        }

        if (Object.keys(updateData).length === 0) {
            this.notifications.warning('Nenhuma alteração foi feita');
            return;
        }

        try {
            const response = await this.api.put(API_CONFIG.ENDPOINTS.AUTH.PROFILE, updateData);
            
            if (response.success) {
                this.currentUser = response.data.user;
                this.updateUI();
                this.notifications.success('Perfil atualizado com sucesso');
                
                // Fechar modal
                const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
                if (profileModal) {
                    profileModal.hide();
                }
            }
        } catch (error) {
            this.notifications.error(error.message || 'Erro ao atualizar perfil');
        }
    }

    /**
     * Limpar dados
     */
    cleanup() {
        this.stopPolling();
        this.messages = [];
        this.lastMessageId = 0;
    }
}

// Inicializar gerenciador de chat quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos na página de chat
    if (window.location.pathname.includes('chat.html')) {
        window.chatManager = new ChatManager();
        
        // Vincular evento de salvar perfil
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn && window.chatManager) {
            saveProfileBtn.addEventListener('click', () => window.chatManager.saveProfile());
        }
    }
});

// Limpar recursos quando a página for fechada
window.addEventListener('beforeunload', () => {
    if (window.chatManager) {
        window.chatManager.cleanup();
    }
});

// Exportar para uso global
window.ChatManager = ChatManager;
