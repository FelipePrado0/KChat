/**
 * KChat - Autenticação JavaScript
 * Gerencia login, registro e autenticação
 */

class AuthManager {
    constructor() {
        this.api = window.KChatUtils.api;
        this.notifications = window.KChatUtils.notifications;
        this.loading = window.KChatUtils.loading;
        this.Validator = window.KChatUtils.Validator;
        this.StorageManager = window.KChatUtils.StorageManager;
        
        this.currentUser = null;
        this.init();
    }

    /**
     * Inicializar gerenciador de autenticação
     */
    init() {
        this.bindEvents();
        this.checkAuthStatus();
        this.setupPasswordToggles();
    }

    /**
     * Vincular eventos dos formulários
     */
    bindEvents() {
        // Formulário de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Formulário de registro
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    /**
     * Configurar toggles de senha
     */
    setupPasswordToggles() {
        // Toggle para senha de login
        const toggleLoginPassword = document.getElementById('toggleLoginPassword');
        const loginPassword = document.getElementById('loginPassword');
        
        if (toggleLoginPassword && loginPassword) {
            toggleLoginPassword.addEventListener('click', () => {
                this.togglePasswordVisibility(loginPassword, toggleLoginPassword);
            });
        }

        // Toggle para senha de registro
        const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
        const registerPassword = document.getElementById('registerPassword');
        
        if (toggleRegisterPassword && registerPassword) {
            toggleRegisterPassword.addEventListener('click', () => {
                this.togglePasswordVisibility(registerPassword, toggleRegisterPassword);
            });
        }
    }

    /**
     * Alternar visibilidade da senha
     * @param {HTMLInputElement} input - Campo de senha
     * @param {HTMLButtonElement} button - Botão de toggle
     */
    togglePasswordVisibility(input, button) {
        const type = input.type === 'password' ? 'text' : 'password';
        const icon = type === 'password' ? 'bi-eye' : 'bi-eye-slash';
        
        input.type = type;
        button.innerHTML = `<i class="${icon}"></i>`;
    }

    /**
     * Verificar status de autenticação
     */
    async checkAuthStatus() {
        if (this.api.isAuthenticated()) {
            try {
                const response = await this.api.get(API_CONFIG.ENDPOINTS.AUTH.VERIFY);
                if (response.success) {
                    this.currentUser = response.data.user;
                    this.redirectToChat();
                } else {
                    this.logout();
                }
            } catch (error) {
                console.error('Erro ao verificar autenticação:', error);
                this.logout();
            }
        }
    }

    /**
     * Manipular login
     * @param {Event} e - Evento do formulário
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Validações
        if (!this.Validator.isValidEmail(email)) {
            this.notifications.error('Por favor, insira um email válido');
            return;
        }

        if (password.length < 6) {
            this.notifications.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        try {
            await this.loading.withLoading(async () => {
                const response = await this.api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
                    email,
                    password
                });

                if (response.success) {
                    this.api.setToken(response.data.token);
                    this.currentUser = response.data.user;
                    
                    this.notifications.success('Login realizado com sucesso!');
                    
                    // Redirecionar para chat após um breve delay
                    setTimeout(() => {
                        this.redirectToChat();
                    }, 1000);
                }
            });
        } catch (error) {
            this.notifications.error(error.message || 'Erro ao fazer login');
        }
    }

    /**
     * Manipular registro
     * @param {Event} e - Evento do formulário
     */
    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const companyId = document.getElementById('registerCompany').value;

        // Validações
        if (!this.Validator.isValidName(name)) {
            this.notifications.error('O nome deve ter pelo menos 2 caracteres');
            return;
        }

        if (!this.Validator.isValidEmail(email)) {
            this.notifications.error('Por favor, insira um email válido');
            return;
        }

        const passwordValidation = this.Validator.validatePassword(password);
        if (!passwordValidation.isValid) {
            this.notifications.error(passwordValidation.errors[0]);
            return;
        }

        if (!companyId) {
            this.notifications.error('Por favor, selecione uma empresa');
            return;
        }

        try {
            await this.loading.withLoading(async () => {
                const response = await this.api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
                    name,
                    email,
                    password,
                    company_id: parseInt(companyId)
                });

                if (response.success) {
                    this.api.setToken(response.data.token);
                    this.currentUser = response.data.user;
                    
                    this.notifications.success('Conta criada com sucesso!');
                    
                    // Redirecionar para chat após um breve delay
                    setTimeout(() => {
                        this.redirectToChat();
                    }, 1000);
                }
            });
        } catch (error) {
            this.notifications.error(error.message || 'Erro ao criar conta');
        }
    }

    /**
     * Fazer logout
     */
    async logout() {
        try {
            if (this.api.isAuthenticated()) {
                await this.api.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
            }
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        } finally {
            this.api.removeToken();
            this.currentUser = null;
            this.StorageManager.clear();
            
            // Redirecionar para página de login
            if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
                window.location.href = '/index.html';
            }
        }
    }

    /**
     * Redirecionar para página de chat
     */
    redirectToChat() {
        if (window.location.pathname !== '/chat.html') {
            window.location.href = '/chat.html';
        }
    }

    /**
     * Obter usuário atual
     * @returns {Object|null} Dados do usuário
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Verificar se está autenticado
     * @returns {boolean} True se autenticado
     */
    isAuthenticated() {
        return this.api.isAuthenticated() && this.currentUser;
    }

    /**
     * Atualizar dados do usuário
     * @param {Object} userData - Novos dados do usuário
     */
    updateCurrentUser(userData) {
        this.currentUser = { ...this.currentUser, ...userData };
    }

    /**
     * Limpar formulários
     */
    clearForms() {
        const forms = ['loginForm', 'registerForm'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.reset();
            }
        });
    }

    /**
     * Mostrar erro de validação
     * @param {string} fieldId - ID do campo
     * @param {string} message - Mensagem de erro
     */
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('is-invalid');
            
            // Remover feedback anterior
            const existingFeedback = field.parentNode.querySelector('.invalid-feedback');
            if (existingFeedback) {
                existingFeedback.remove();
            }
            
            // Adicionar novo feedback
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = message;
            field.parentNode.appendChild(feedback);
        }
    }

    /**
     * Limpar erro de validação
     * @param {string} fieldId - ID do campo
     */
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('is-invalid');
            
            const feedback = field.parentNode.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.remove();
            }
        }
    }

    /**
     * Validar campo em tempo real
     * @param {string} fieldId - ID do campo
     * @param {string} fieldType - Tipo do campo (email, password, name)
     */
    validateField(fieldId, fieldType) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (fieldType) {
            case 'email':
                isValid = this.Validator.isValidEmail(value);
                errorMessage = 'Por favor, insira um email válido';
                break;
            case 'password':
                isValid = value.length >= 6;
                errorMessage = 'A senha deve ter pelo menos 6 caracteres';
                break;
            case 'name':
                isValid = this.Validator.isValidName(value);
                errorMessage = 'O nome deve ter pelo menos 2 caracteres';
                break;
        }

        if (isValid) {
            this.clearFieldError(fieldId);
        } else {
            this.showFieldError(fieldId, errorMessage);
        }

        return isValid;
    }

    /**
     * Configurar validação em tempo real
     */
    setupRealTimeValidation() {
        const fields = [
            { id: 'loginEmail', type: 'email' },
            { id: 'loginPassword', type: 'password' },
            { id: 'registerName', type: 'name' },
            { id: 'registerEmail', type: 'email' },
            { id: 'registerPassword', type: 'password' }
        ];

        fields.forEach(({ id, type }) => {
            const field = document.getElementById(id);
            if (field) {
                field.addEventListener('blur', () => this.validateField(id, type));
                field.addEventListener('input', () => this.clearFieldError(id));
            }
        });
    }
}

// Inicializar gerenciador de autenticação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
    
    // Configurar validação em tempo real
    if (window.authManager) {
        window.authManager.setupRealTimeValidation();
    }
});

// Exportar para uso global
window.AuthManager = AuthManager;
