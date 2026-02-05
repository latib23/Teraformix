import { auth, AUTH_TOKEN_KEY } from './auth';

// --- CONFIGURATION ---
const FALLBACK_API_URL = '';
// ---------------------

export const getApiBase = () => {
  if (typeof window !== 'undefined') {
    let apiBase = '';
    let override = '';
    try { override = String(localStorage.getItem('tfx_api_url') || '').trim(); } catch (_e) { void _e; }
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
    } catch (_e) { void _e; }

    // 1. Build-time environment variable (Vercel → Railway)
    // @ts-expect-error env-compat
    if (!override && import.meta.env?.VITE_API_URL) {
      // @ts-expect-error env-compat
      apiBase = import.meta.env.VITE_API_URL;
    }

    // 2. Default to same-origin when no explicit API URL is provided
    else if (!override) {
      apiBase = window.location.origin;
    }
    else {
      apiBase = override;
    }

    // Sanitize - remove trailing slashes
    apiBase = apiBase.replace(/\/+$/, '');

    // If missing protocol, auto-add https
    if (apiBase && !apiBase.startsWith('http')) {
      apiBase = `https://${apiBase}`;
    }

    // Ensure it ends with /api (NestJS global prefix)
    if (apiBase && !apiBase.endsWith('/api')) {
      apiBase = `${apiBase}/api`;
    }

    // 4. Last fallback for local dev
    if (!apiBase) return '/api';

    return apiBase;
  }

  // SSR fallback
  return 'http://localhost:3000/api';
};

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  const apiBase = getApiBase();

  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const url = `${apiBase}/${cleanEndpoint}`;

  try {
    let token: string | null = null;
    try {
      token = auth.isAuthenticated() ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    } catch (_e) { void _e; }

    const method = String(options?.method || 'GET').toUpperCase();
    const headers: HeadersInit = {
      ...options?.headers,
    };
    if (method !== 'GET' && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { ...options, headers: { 'Accept': 'application/json', ...headers } });

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
        } catch (_e) { void _e; }
      } else if (ct.includes('text/html')) {
        if (res.status === 403) errorMessage = 'Access restricted';
        else if (res.status === 404) errorMessage = `API endpoint not found (${url})`;
        else errorMessage = `Request failed with ${res.status}`;
      } else {
        if (res.status === 404) errorMessage = `API endpoint not found (${url})`;
      }

      throw new Error(errorMessage || `Request failed with ${res.status}`);
    }

    if (res.status === 204) return null;

    const ctOk = res.headers.get('content-type') || '';
    const bodyText = await res.text();
    const looksHtml = /<!doctype html|<html|<head|<body/i.test(bodyText.trim());

    if (ctOk.includes('application/json') && !looksHtml) {
      try {
        return JSON.parse(bodyText) as any;
      } catch {
        throw new Error('Invalid JSON response from API');
      }
    }

    if (looksHtml || ctOk.includes('text/html')) {
      const candidates = ['https://teraformix.com/api', 'https://teraformix.com/api'];
      for (const base of candidates) {
        try {
          if (base.replace(/\/+$/, '') === apiBase.replace(/\/+$/, '')) continue;
          const testUrl = `${base}/${cleanEndpoint}`;
          const retryRes = await fetch(testUrl, { ...options, headers: { 'Accept': 'application/json', ...headers } });
          if (!retryRes.ok) continue;
          const retryCt = retryRes.headers.get('content-type') || '';
          const retryBody = await retryRes.text();
          const retryLooksHtml = /<!doctype html|<html|<head|<body/i.test(retryBody.trim());
          if (retryCt.includes('application/json') && !retryLooksHtml) {
            try {
              const json = JSON.parse(retryBody) as any;
              try { localStorage.setItem('tfx_api_url', base); } catch (_e) { void _e; }
              return json;
            } catch { continue; }
          }
        } catch (_e) { void _e; }
      }
      throw new Error('Unexpected HTML response from API');
    }

    throw new Error(`Unexpected response format: ${ctOk || 'unknown'}`);
  } catch (err: any) {
    const isNetworkError =
      err.message === 'Failed to fetch' || err.name === 'TypeError';

    if (isNetworkError) {
      throw new NetworkError(`Could not connect to server at ${apiBase}`);
    }

    throw err;
  }
}

export const api = {
  get: <T>(endpoint: string) => fetchJson<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: any) =>
    fetchJson<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: any) =>
    fetchJson<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: any) =>
    fetchJson<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) =>
    fetchJson<T>(endpoint, { method: 'DELETE' }),
  upload: <T>(endpoint: string, body: FormData) =>
    fetchJson<T>(endpoint, { method: 'POST', body }),
};
