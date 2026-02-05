"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.AUTH_USER_ID_KEY = exports.AUTH_USER_KEY = exports.AUTH_ROLE_KEY = exports.AUTH_TOKEN_KEY = void 0;
const api_1 = require("./api");
exports.AUTH_TOKEN_KEY = 'stc_auth_token';
exports.AUTH_ROLE_KEY = 'stc_auth_role';
exports.AUTH_USER_KEY = 'stc_auth_user';
exports.AUTH_USER_ID_KEY = 'stc_auth_user_id';
const safeSetItem = (k, v) => { try {
    if (typeof localStorage !== 'undefined')
        localStorage.setItem(k, v);
}
catch (_e) {
    void _e;
} };
const safeGetItem = (k) => { try {
    if (typeof localStorage !== 'undefined')
        return localStorage.getItem(k);
}
catch (_e) {
    void _e;
} return null; };
const safeRemoveItem = (k) => { try {
    if (typeof localStorage !== 'undefined')
        localStorage.removeItem(k);
}
catch (_e) {
    void _e;
} };
exports.auth = {
    login: async (email, password) => {
        try {
            const apiBase = (0, api_1.getApiBase)();
            const res = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Invalid credentials');
            }
            const data = await res.json();
            if (data.accessToken) {
                safeSetItem(exports.AUTH_TOKEN_KEY, data.accessToken);
                const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
                safeSetItem(exports.AUTH_ROLE_KEY, payload.role);
                safeSetItem(exports.AUTH_USER_ID_KEY, payload.sub);
                safeSetItem(exports.AUTH_USER_KEY, JSON.stringify({
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role,
                    name: payload.name || payload.email.split('@')[0]
                }));
                return { success: true, role: payload.role };
            }
            throw new Error('Login failed: No access token received.');
        }
        catch (err) {
            console.error("Login failed:", err);
            return { success: false, message: err.message };
        }
    },
    register: async (name, email, password) => {
        try {
            const apiBase = (0, api_1.getApiBase)();
            const res = await fetch(`${apiBase}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                return { success: false, message: errorData.message || 'Registration failed' };
            }
            const data = await res.json();
            if (data.accessToken) {
                safeSetItem(exports.AUTH_TOKEN_KEY, data.accessToken);
                const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
                safeSetItem(exports.AUTH_ROLE_KEY, payload.role);
                safeSetItem(exports.AUTH_USER_ID_KEY, payload.sub);
                safeSetItem(exports.AUTH_USER_KEY, JSON.stringify({
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role,
                    name: payload.name || payload.email.split('@')[0]
                }));
                return { success: true };
            }
            return { success: false, message: 'Registration failed: No access token received.' };
        }
        catch (err) {
            return { success: false, message: err.message };
        }
    },
    logout: () => {
        safeRemoveItem(exports.AUTH_TOKEN_KEY);
        safeRemoveItem(exports.AUTH_ROLE_KEY);
        safeRemoveItem(exports.AUTH_USER_KEY);
        safeRemoveItem(exports.AUTH_USER_ID_KEY);
        window.dispatchEvent(new Event('auth-change'));
    },
    isAuthenticated: () => {
        return !!safeGetItem(exports.AUTH_TOKEN_KEY);
    },
    getUserRole: () => {
        return safeGetItem(exports.AUTH_ROLE_KEY);
    },
    getUserId: () => {
        return safeGetItem(exports.AUTH_USER_ID_KEY);
    },
    getUser: () => {
        const stored = safeGetItem(exports.AUTH_USER_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            id: '',
            name: 'Guest',
            email: '',
            role: 'GUEST'
        };
    }
};
//# sourceMappingURL=auth.js.map