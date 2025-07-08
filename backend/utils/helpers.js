const fs = require('fs');
const path = require('path');

function extractEmpresa(req) {
    return req.body?.empresa || req.query?.empresa || req.headers?.empresa || null;
}

function validateFileType(file, allowedTypes) {
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    return mimetype && extname;
}

function createUploadDirectory(uploadPath) {
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
}

function generateUniqueFilename(originalname) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    return `anexo_arquivo-${uniqueSuffix}${path.extname(originalname)}`;
}

function formatDate(date) {
    return new Date(date).toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo' 
    });
}

function sanitizeString(str) {
    if (!str) return '';
    return str.trim().replace(/[<>]/g, '');
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function truncateText(text, maxLength = 100) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function generateRandomId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

module.exports = {
    extractEmpresa,
    validateFileType,
    createUploadDirectory,
    generateUniqueFilename,
    formatDate,
    sanitizeString,
    isValidEmail,
    isValidUrl,
    truncateText,
    generateRandomId,
    debounce,
    throttle
}; 