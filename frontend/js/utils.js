/**
 * KChat - Utilitários JavaScript
 * Funções auxiliares para o frontend
 */

// Configurações da API
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api',
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            PROFILE: '/auth/profile',
            LOGOUT: '/auth/logout',
            VERIFY: '/auth/verify'
        },
        CHAT: {
            MESSAGES: '/chat/messages',
            RECENT: '/chat/messages/recent',
            STATS: '/chat/stats'
        }
    }
};

/**
 * Classe para gerenciar requisições HTTP
 */
class ApiClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }

    /**
     * Fazer requisição HTTP
     * @param {string} endpoint - Endpoint da API
     * @param {Object} options - Opções da requisição
     * @returns {Promise} Promise com a resposta
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Erro ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    }

    /**
     * Requisição GET
     * @param {string} endpoint - Endpoint da API
     * @param {Object} params - Parâmetros da query string
     * @returns {Promise} Promise com a resposta
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, { method: 'GET' });
    }

    /**
     * Requisição POST
     * @param {string} endpoint - Endpoint da API
     * @param {Object} data - Dados para enviar
     * @returns {Promise} Promise com a resposta
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Requisição PUT
     * @param {string} endpoint - Endpoint da API
     * @param {Object} data - Dados para enviar
     * @returns {Promise} Promise com a resposta
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Requisição DELETE
     * @param {string} endpoint - Endpoint da API
     * @returns {Promise} Promise com a resposta
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * Obter token do localStorage
     * @returns {string|null} Token JWT
     */
    getToken() {
        return localStorage.getItem('kchat_token');
    }

    /**
     * Salvar token no localStorage
     * @param {string} token - Token JWT
     */
    setToken(token) {
        localStorage.setItem('kchat_token', token);
    }

    /**
     * Remover token do localStorage
     */
    removeToken() {
        localStorage.removeItem('kchat_token');
    }

    /**
     * Verificar se o usuário está autenticado
     * @returns {boolean} True se autenticado
     */
    isAuthenticated() {
        return !!this.getToken();
    }
}

/**
 * Classe para gerenciar notificações
 */
class NotificationManager {
    constructor() {
        this.container = this.createContainer();
    }

    /**
     * Criar container para notificações
     * @returns {HTMLElement} Container das notificações
     */
    createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }

    /**
     * Mostrar notificação
     * @param {string} message - Mensagem da notificação
     * @param {string} type - Tipo da notificação (success, error, warning, info)
     * @param {number} duration - Duração em milissegundos
     */
    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        this.container.appendChild(notification);

        // Auto-remover após duração
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    }

    /**
     * Remover notificação
     * @param {HTMLElement} notification - Elemento da notificação
     */
    remove(notification) {
        if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }

    /**
     * Notificação de sucesso
     * @param {string} message - Mensagem
     * @param {number} duration - Duração
     */
    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    /**
     * Notificação de erro
     * @param {string} message - Mensagem
     * @param {number} duration - Duração
     */
    error(message, duration = 8000) {
        return this.show(message, 'danger', duration);
    }

    /**
     * Notificação de aviso
     * @param {string} message - Mensagem
     * @param {number} duration - Duração
     */
    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    /**
     * Notificação informativa
     * @param {string} message - Mensagem
     * @param {number} duration - Duração
     */
    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
}

/**
 * Classe para gerenciar loading
 */
class LoadingManager {
    constructor() {
        this.spinner = document.getElementById('loadingSpinner');
    }

    /**
     * Mostrar loading
     */
    show() {
        if (this.spinner) {
            this.spinner.classList.remove('d-none');
        }
    }

    /**
     * Ocultar loading
     */
    hide() {
        if (this.spinner) {
            this.spinner.classList.add('d-none');
        }
    }

    /**
     * Mostrar loading com callback
     * @param {Function} callback - Função a executar
     * @returns {Promise} Promise do callback
     */
    async withLoading(callback) {
        this.show();
        try {
            const result = await callback();
            return result;
        } finally {
            this.hide();
        }
    }
}

/**
 * Classe para formatação de dados
 */
class Formatter {
    /**
     * Formatar data
     * @param {string|Date} date - Data para formatar
     * @param {string} format - Formato desejado
     * @returns {string} Data formatada
     */
    static formatDate(date, format = 'datetime') {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const oneDay = 24 * 60 * 60 * 1000;

        // Se for hoje, mostrar apenas hora
        if (diff < oneDay && d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }

        // Se for ontem
        if (diff < 2 * oneDay && d.toDateString() === new Date(now - oneDay).toDateString()) {
            return `Ontem às ${d.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`;
        }

        // Se for este ano
        if (d.getFullYear() === now.getFullYear()) {
            return d.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Data completa
        return d.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Formatar nome
     * @param {string} name - Nome para formatar
     * @returns {string} Nome formatado
     */
    static formatName(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Obter iniciais do nome
     * @param {string} name - Nome
     * @returns {string} Iniciais
     */
    static getInitials(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }

    /**
     * Truncar texto
     * @param {string} text - Texto para truncar
     * @param {number} maxLength - Comprimento máximo
     * @returns {string} Texto truncado
     */
    static truncate(text, maxLength = 50) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Escapar HTML
     * @param {string} text - Texto para escapar
     * @returns {string} Texto escapado
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/**
 * Classe para validação
 */
class Validator {
    /**
     * Validar email
     * @param {string} email - Email para validar
     * @returns {boolean} True se válido
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validar senha
     * @param {string} password - Senha para validar
     * @returns {Object} Resultado da validação
     */
    static validatePassword(password) {
        const errors = [];
        
        if (password.length < 6) {
            errors.push('Senha deve ter pelo menos 6 caracteres');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Senha deve conter pelo menos uma letra maiúscula');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Senha deve conter pelo menos uma letra minúscula');
        }
        
        if (!/\d/.test(password)) {
            errors.push('Senha deve conter pelo menos um número');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validar nome
     * @param {string} name - Nome para validar
     * @returns {boolean} True se válido
     */
    static isValidName(name) {
        return name.trim().length >= 2;
    }
}

/**
 * Classe para gerenciar localStorage
 */
class StorageManager {
    /**
     * Salvar dados
     * @param {string} key - Chave
     * @param {any} value - Valor
     */
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
        }
    }

    /**
     * Obter dados
     * @param {string} key - Chave
     * @param {any} defaultValue - Valor padrão
     * @returns {any} Valor salvo
     */
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Erro ao ler do localStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Remover dados
     * @param {string} key - Chave
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Erro ao remover do localStorage:', error);
        }
    }

    /**
     * Limpar todos os dados
     */
    static clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Erro ao limpar localStorage:', error);
        }
    }
}

/**
 * Classe para debounce
 */
class Debouncer {
    constructor(delay = 300) {
        this.delay = delay;
        this.timeoutId = null;
    }

    /**
     * Executar função com debounce
     * @param {Function} func - Função a executar
     * @param {...any} args - Argumentos da função
     */
    debounce(func, ...args) {
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, this.delay);
    }
}

// Instâncias globais
const api = new ApiClient();
const notifications = new NotificationManager();
const loading = new LoadingManager();

// Exportar para uso global
window.KChatUtils = {
    api,
    notifications,
    loading,
    Formatter,
    Validator,
    StorageManager,
    Debouncer
};
