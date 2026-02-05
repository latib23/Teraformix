"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.NetworkError = exports.getApiBase = void 0;
exports.fetchJson = fetchJson;
const auth_1 = require("./auth");
const FALLBACK_API_URL = '';
const getApiBase = () => {
    var _a;
    if (typeof window !== 'undefined') {
        let apiBase = '';
        let override = '';
        try {
            override = String(localStorage.getItem('stc_api_url') || '').trim();
        }
        catch (_e) {
            void _e;
        }
        try {
            if (override) {
                const o = new URL(override);
                const curr = new URL(window.location.origin);
                const oh = o.hostname.replace(/^www\./, '');
                const ch = curr.hostname.replace(/^www\./, '');
                if (oh !== ch) {
                    override = '';
                }
            }
        }
        catch (_e) {
            void _e;
        }
        if (!override && ((_a = import.meta.env) === null || _a === void 0 ? void 0 : _a.VITE_API_URL)) {
            apiBase = import.meta.env.VITE_API_URL;
        }
        else if (!override) {
            apiBase = window.location.origin;
        }
        else {
            apiBase = override;
        }
        apiBase = apiBase.replace(/\/+$/, '');
        if (apiBase && !apiBase.startsWith('http')) {
            apiBase = `https://${apiBase}`;
        }
        if (apiBase && !apiBase.endsWith('/api')) {
            apiBase = `${apiBase}/api`;
        }
        if (!apiBase)
            return '/api';
        return apiBase;
    }
    return 'http://localhost:3000/api';
};
exports.getApiBase = getApiBase;
class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
    }
}
exports.NetworkError = NetworkError;
async function fetchJson(endpoint, options) {
    const apiBase = (0, exports.getApiBase)();
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    const url = `${apiBase}/${cleanEndpoint}`;
    try {
        let token = null;
        try {
            token = auth_1.auth.isAuthenticated() ? localStorage.getItem(auth_1.AUTH_TOKEN_KEY) : null;
        }
        catch (_e) {
            void _e;
        }
        const method = String((options === null || options === void 0 ? void 0 : options.method) || 'GET').toUpperCase();
        const headers = Object.assign({}, options === null || options === void 0 ? void 0 : options.headers);
        if (method !== 'GET' && !(options.body instanceof FormData))
            headers['Content-Type'] = 'application/json';
        if (token)
            headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(url, Object.assign(Object.assign({}, options), { headers: Object.assign({ 'Accept': 'application/json' }, headers) }));
        if (!res.ok) {
            if (res.status === 401 && !window.location.pathname.includes('/login')) {
                window.dispatchEvent(new Event('auth-error'));
            }
            const ct = res.headers.get('content-type') || '';
            const errorBody = await res.text();
            let errorMessage = errorBody;
            if (ct.includes('application/json')) {
                try {
                    const json = JSON.parse(errorBody);
                    errorMessage = (json && (json.message || json.error)) || JSON.stringify(json);
                }
                catch (_e) {
                    void _e;
                }
            }
            else if (ct.includes('text/html')) {
                if (res.status === 403)
                    errorMessage = 'Access restricted';
                else if (res.status === 404)
                    errorMessage = `API endpoint not found (${url})`;
                else
                    errorMessage = `Request failed with ${res.status}`;
            }
            else {
                if (res.status === 404)
                    errorMessage = `API endpoint not found (${url})`;
            }
            throw new Error(errorMessage || `Request failed with ${res.status}`);
        }
        if (res.status === 204)
            return null;
        const ctOk = res.headers.get('content-type') || '';
        const bodyText = await res.text();
        const looksHtml = /<!doctype html|<html|<head|<body/i.test(bodyText.trim());
        if (ctOk.includes('application/json') && !looksHtml) {
            try {
                return JSON.parse(bodyText);
            }
            catch (_a) {
                throw new Error('Invalid JSON response from API');
            }
        }
        if (looksHtml || ctOk.includes('text/html')) {
            const candidates = ['https://servertechcentral.com/api', 'https://servertechcentral.com/api'];
            for (const base of candidates) {
                try {
                    if (base.replace(/\/+$/, '') === apiBase.replace(/\/+$/, ''))
                        continue;
                    const testUrl = `${base}/${cleanEndpoint}`;
                    const retryRes = await fetch(testUrl, Object.assign(Object.assign({}, options), { headers: Object.assign({ 'Accept': 'application/json' }, headers) }));
                    if (!retryRes.ok)
                        continue;
                    const retryCt = retryRes.headers.get('content-type') || '';
                    const retryBody = await retryRes.text();
                    const retryLooksHtml = /<!doctype html|<html|<head|<body/i.test(retryBody.trim());
                    if (retryCt.includes('application/json') && !retryLooksHtml) {
                        try {
                            const json = JSON.parse(retryBody);
                            try {
                                localStorage.setItem('stc_api_url', base);
                            }
                            catch (_e) {
                                void _e;
                            }
                            return json;
                        }
                        catch (_b) {
                            continue;
                        }
                    }
                }
                catch (_e) {
                    void _e;
                }
            }
            throw new Error('Unexpected HTML response from API');
        }
        throw new Error(`Unexpected response format: ${ctOk || 'unknown'}`);
    }
    catch (err) {
        const isNetworkError = err.message === 'Failed to fetch' || err.name === 'TypeError';
        if (isNetworkError) {
            throw new NetworkError(`Could not connect to server at ${apiBase}`);
        }
        throw err;
    }
}
exports.api = {
    get: (endpoint) => fetchJson(endpoint, { method: 'GET' }),
    post: (endpoint, body) => fetchJson(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => fetchJson(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    patch: (endpoint, body) => fetchJson(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (endpoint) => fetchJson(endpoint, { method: 'DELETE' }),
    upload: (endpoint, body) => fetchJson(endpoint, { method: 'POST', body }),
};
//# sourceMappingURL=api.js.map