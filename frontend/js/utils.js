/**
 * KChat - Utilitários JavaScript
 * Funções auxiliares para o frontend
 */

// ===============================
// utils.js — Funções auxiliares do frontend KChat
// Comentários detalhados para facilitar o entendimento de iniciantes
// ===============================

// Configurações da API (ajuste BASE_URL se necessário)
const API_CONFIG = {
    BASE_URL: 'http://localhost:3008/api', // URL base do backend
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
 * Classe para gerenciar requisições HTTP de forma padronizada
 * Permite GET, POST, PUT, DELETE e já trata token JWT se necessário
 */
class ApiClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }

    /**
     * Faz uma requisição HTTP genérica
     * @param {string} endpoint - Caminho do endpoint
     * @param {Object} options - Opções fetch (headers, body, etc)
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken(); // Busca token salvo (se existir)

        // Headers padrão (JSON + token se existir)
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        // Junta opções padrão e customizadas
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

    // Métodos auxiliares para GET, POST, PUT, DELETE
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Métodos para manipular token JWT no localStorage
    getToken() {
        return localStorage.getItem('kchat_token');
    }
    setToken(token) {
        localStorage.setItem('kchat_token', token);
    }
    removeToken() {
        localStorage.removeItem('kchat_token');
    }
    isAuthenticated() {
        return !!this.getToken();
    }
}

/**
 * Classe para mostrar notificações na tela
 * Usa Bootstrap para estilizar os alerts
 */
class NotificationManager {
    constructor() {
        this.container = this.createContainer();
    }
    // Cria o container fixo no topo da tela
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
    // Mostra uma notificação
    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        this.container.appendChild(notification);
        // Remove automaticamente após duration
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }
    }
    // Remove notificação
    remove(notification) {
        if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }
    // Atalhos para tipos de notificação
    success(message, duration = 5000) { this.show(message, 'success', duration); }
    error(message, duration = 8000) { this.show(message, 'danger', duration); }
    warning(message, duration = 6000) { this.show(message, 'warning', duration); }
    info(message, duration = 5000) { this.show(message, 'info', duration); }
}

/**
 * Classe para mostrar loading/spinner na tela
 */
class LoadingManager {
    constructor() {
        this.loadingElement = null;
    }
    // Mostra spinner
    show() {
        if (!this.loadingElement) {
            this.loadingElement = document.createElement('div');
            this.loadingElement.className = 'loading-overlay';
            this.loadingElement.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';
            document.body.appendChild(this.loadingElement);
        }
    }
    // Esconde spinner
    hide() {
        if (this.loadingElement) {
            this.loadingElement.remove();
            this.loadingElement = null;
        }
    }
    // Executa função com loading automático
    async withLoading(callback) {
        this.show();
        try {
            await callback();
        } finally {
            this.hide();
        }
    }
}

/**
 * Classe para formatação de datas, nomes, textos, etc
 */
class Formatter {
    // Formata data para string legível
    static formatDate(date, format = 'datetime') {
        const d = new Date(date);
        if (format === 'date') {
            return d.toLocaleDateString('pt-BR');
        } else if (format === 'time') {
            return d.toLocaleTimeString('pt-BR');
        } else {
            return d.toLocaleString('pt-BR');
        }
    }
    // Formata nome (primeira letra maiúscula)
    static formatName(name) {
        if (!name) return '';
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    // Retorna as iniciais do nome
    static getInitials(name) {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    // Limita tamanho do texto
    static truncate(text, maxLength = 50) {
        if (!text) return '';
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    }
    // Escapa HTML para evitar XSS
    static escapeHtml(text) {
        if (!text) return '';
        return text.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
    }
}

/**
 * Classe para validação de dados
 */
class Validator {
    static isValidEmail(email) {
        return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    }
    static validatePassword(password) {
        return password.length >= 6;
    }
    static isValidName(name) {
        return name && name.length >= 2;
    }
}

/**
 * Classe para manipular dados no localStorage
 */
class StorageManager {
    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
    static get(key, defaultValue = null) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    }
    static remove(key) {
        localStorage.removeItem(key);
    }
    static clear() {
        localStorage.clear();
    }
}

/**
 * Classe para debouncing (evita execuções repetidas rápidas)
 */
class Debouncer {
    constructor(delay = 300) {
        this.delay = delay;
        this.timeout = null;
    }
    debounce(func, ...args) {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => func(...args), this.delay);
    }
}

// Funções utilitárias avulsas (formatação, validação, etc)
function formatDate(date) {
    return Formatter.formatDate(date);
}
function formatRelativeDate(date) {
    // Exemplo: "há 2 horas"
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return 'agora';
    if (diff < 3600) return `há ${Math.floor(diff/60)} min`;
    if (diff < 86400) return `há ${Math.floor(diff/3600)} h`;
    return Formatter.formatDate(date, 'date');
}
function isValidUrl(url) {
    try { new URL(url); return true; } catch { return false; }
}
function isValidEmail(email) {
    return Validator.isValidEmail(email);
}
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}
function truncateText(text, length = 100) {
    return Formatter.truncate(text, length);
}
function escapeHtml(text) {
    return Formatter.escapeHtml(text);
}
function unescapeHtml(text) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return doc.documentElement.textContent;
}
function isElementVisible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}
function smoothScrollTo(target, duration = 500) {
    const start = window.scrollY;
    const change = target - start;
    let currentTime = 0;
    const increment = 20;
    function animation(currentTime) {
        currentTime += increment;
        const val = ease(currentTime, start, change, duration);
        window.scrollTo(0, val);
        if (currentTime < duration) {
            setTimeout(() => animation(currentTime), increment);
        }
    }
    function ease(t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t + b;
        t--;
        return -c/2 * (t*(t-2) - 1) + b;
    }
    animation(0);
}
function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
}
function isOnline() {
    return navigator.onLine;
}
function onConnectivityChange(callback) {
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);
}
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
    ]);
}
async function retry(fn, retries = 3, delay = 1000) {
    try {
        return await fn();
    } catch (err) {
        if (retries <= 0) throw err;
        await new Promise(res => setTimeout(res, delay));
        return retry(fn, retries - 1, delay);
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
