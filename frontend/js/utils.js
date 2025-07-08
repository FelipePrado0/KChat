/**
 * KChat - Utilitários JavaScript
 * Funções auxiliares para o frontend
 */

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
            MESSAGES: '/messages',
            RECENT: '/messages/recent',
            STATS: '/stats'
        }
    }
};

class ApiClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }

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

class NotificationManager {
    constructor() {
        this.container = this.createContainer();
    }
    
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
    
    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        this.container.appendChild(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }
    }
    
    remove(notification) {
        if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }
    
    success(message, duration = 5000) { this.show(message, 'success', duration); }
    error(message, duration = 8000) { this.show(message, 'danger', duration); }
    warning(message, duration = 6000) { this.show(message, 'warning', duration); }
    info(message, duration = 5000) { this.show(message, 'info', duration); }
}

class LoadingManager {
    constructor() {
        this.loadingElement = null;
    }
    
    show() {
        if (!this.loadingElement) {
            this.loadingElement = document.createElement('div');
            this.loadingElement.className = 'loading-overlay';
            this.loadingElement.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';
            document.body.appendChild(this.loadingElement);
        }
    }
    
    hide() {
        if (this.loadingElement) {
            this.loadingElement.remove();
            this.loadingElement = null;
        }
    }
    
    async withLoading(callback) {
        this.show();
        try {
            await callback();
        } finally {
            this.hide();
        }
    }
}

class Formatter {
    static formatDate(date, format = 'datetime') {
        const d = new Date(date);
        if (format === 'date') {
            return d.toLocaleDateString('pt-BR');
        } else if (format === 'time') {
            return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else {
            return d.toLocaleString('pt-BR');
        }
    }

    static formatName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }

    static getInitials(name) {
        return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
    }

    static truncate(text, maxLength = 50) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

class Validator {
    static isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    static validatePassword(password) {
        return password.length >= 6;
    }

    static isValidName(name) {
        return name && name.trim().length >= 2;
    }
}

class StorageManager {
    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static get(key, defaultValue = null) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    }

    static remove(key) {
        localStorage.removeItem(key);
    }

    static clear() {
        localStorage.clear();
    }
}

class Debouncer {
    constructor(delay = 300) {
        this.delay = delay;
        this.timeoutId = null;
    }

    debounce(func, ...args) {
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => func.apply(null, args), this.delay);
    }
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-BR');
}

function formatRelativeDate(date) {
    const now = new Date();
    const target = new Date(date);
    const diffInHours = (now - target) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
        return target.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
        return 'Ontem';
    } else {
        return target.toLocaleDateString('pt-BR');
    }
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Erro ao copiar para clipboard:', err);
        return false;
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function truncateText(text, length = 100) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function unescapeHtml(text) {
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText || '';
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
    const targetPosition = target.offsetTop;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
}

function isMobile() {
    return window.innerWidth <= 768;
}

function isOnline() {
    return navigator.onLine;
}

function onConnectivityChange(callback) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
}

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

async function retry(fn, retries = 3, delay = 1000) {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return retry(fn, retries - 1, delay * 2);
        }
        throw error;
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
