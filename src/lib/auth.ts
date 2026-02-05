
import { getApiBase } from './api';

export const AUTH_TOKEN_KEY = 'stc_auth_token';
export const AUTH_ROLE_KEY = 'stc_auth_role';
export const AUTH_USER_KEY = 'stc_auth_user';
export const AUTH_USER_ID_KEY = 'stc_auth_user_id';

const safeSetItem = (k: string, v: string) => { try { if (typeof localStorage !== 'undefined') localStorage.setItem(k, v); } catch (_e) { void _e; } };
const safeGetItem = (k: string): string | null => { try { if (typeof localStorage !== 'undefined') return localStorage.getItem(k); } catch (_e) { void _e; } return null; };
const safeRemoveItem = (k: string) => { try { if (typeof localStorage !== 'undefined') localStorage.removeItem(k); } catch (_e) { void _e; } };

export const auth = {
  login: async (email: string, password: string) => {
    try {
      const apiBase = getApiBase();
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
        safeSetItem(AUTH_TOKEN_KEY, data.accessToken);

        // Decode JWT to get user info without another request
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));

        safeSetItem(AUTH_ROLE_KEY, payload.role);
        safeSetItem(AUTH_USER_ID_KEY, payload.sub);
        safeSetItem(AUTH_USER_KEY, JSON.stringify({
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          name: payload.name || payload.email.split('@')[0]
        }));

        return { success: true, role: payload.role };
      }
      throw new Error('Login failed: No access token received.');

    } catch (err: any) {
      console.error("Login failed:", err);
      return { success: false, message: err.message };
    }
  },

  register: async (name: string, email: string, password: string) => {
    try {
      const apiBase = getApiBase();
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
        safeSetItem(AUTH_TOKEN_KEY, data.accessToken);
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
        safeSetItem(AUTH_ROLE_KEY, payload.role);
        safeSetItem(AUTH_USER_ID_KEY, payload.sub);
        safeSetItem(AUTH_USER_KEY, JSON.stringify({
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          name: payload.name || payload.email.split('@')[0]
        }));
        return { success: true };
      }
      return { success: false, message: 'Registration failed: No access token received.' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  logout: () => {
    safeRemoveItem(AUTH_TOKEN_KEY);
    safeRemoveItem(AUTH_ROLE_KEY);
    safeRemoveItem(AUTH_USER_KEY);
    safeRemoveItem(AUTH_USER_ID_KEY);
    window.dispatchEvent(new Event('auth-change'));
  },

  isAuthenticated: () => {
    return !!safeGetItem(AUTH_TOKEN_KEY);
  },

  getUserRole: (): string | null => {
    return safeGetItem(AUTH_ROLE_KEY);
  },

  getUserId: (): string | null => {
    return safeGetItem(AUTH_USER_ID_KEY);
  },

  getUser: () => {
    const stored = safeGetItem(AUTH_USER_KEY);
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
