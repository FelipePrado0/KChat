const CONFIG = {
    api: {
        baseUrl: 'http://localhost:3000/api',
        timeout: 10000,
        retries: 3
    },
    
    app: {
        empresa: 'Krolik',
        usuario: 'Usuário Teste',
        maxMessageLength: 2000,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFileTypes: ['image/*', 'application/pdf', 'text/plain', 'audio/*']
    },
    
    ui: {
        messageMaxHeight: 120,
        autoResizeDelay: 100,
        animationDuration: 300,
        notificationDuration: 5000
    },
    
    socket: {
        url: 'http://localhost:3000',
        reconnectAttempts: 5,
        reconnectDelay: 1000
    },
    
    storage: {
        userKey: 'kchat_user_name',
        loginKey: 'kchat_user_login',
        tokenKey: 'kchat_token'
    }
};

export default CONFIG; 