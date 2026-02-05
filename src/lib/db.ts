

import { ContentState } from '../contexts/GlobalContent';
import { Product, Order, FormSubmission } from '../types';

const DB_KEYS = {
  CONTENT: 'stc_global_content_v2',
  ORDERS: 'stc_orders',
  SUBMISSIONS: 'stc_submissions',
  USERS: 'stc_users',
  PRODUCTS: 'stc_products',
};

// Helper to safely set items in localStorage with Quota handling
const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.error("Local Storage Quota Exceeded. Cannot save changes.");
      alert("Storage Limit Reached: The image or data you are trying to save is too large for the browser's local storage. Please try a smaller image (under 500KB) or clear old data.");
    } else {
      console.error("Local Storage Error", e);
    }
  }
};

interface DbUser {
    id: string;
    name: string;
    email: string;
    role: string;
    target?: number;
    quarterlyTarget?: number;
    totalSales?: number;
    joinedAt?: string;
    password?: string; // For local creation
}

const createDbCollection = <T extends { id: string }>(key: string) => {
    const getAll = (): T[] => {
      if (typeof window === 'undefined') return [];
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        console.error(`Error reading ${key} from DB`, e);
        return [];
      }
    };
  
    const saveAll = (data: T[]) => {
      safeSetItem(key, JSON.stringify(data));
    };
  
    const add = (item: Omit<T, 'id'> & { id?: string }): T => {
      const all = getAll();
      const newItem = {
        ...item,
        id: item.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      } as T;
      saveAll([...all, newItem]);
      return newItem;
    };
  
    const update = (id: string, updates: Partial<T>) => {
      const all = getAll();
      const updated = all.map(item => (item.id === id ? { ...item, ...updates } : item));
      saveAll(updated);
    };
  
    const del = (id: string) => {
      const all = getAll();
      saveAll(all.filter(item => item.id !== id));
    };
    
    return { getAll, add, update, delete: del, saveAll };
};

export const db = {
  content: {
    get: (defaultContent: any): ContentState => {
      if (typeof window === 'undefined') return defaultContent;
      
      let data = '';
      try { data = localStorage.getItem(DB_KEYS.CONTENT) || ''; } catch (_e) { void _e; return defaultContent; }
      if (!data) return defaultContent;
      
      try {
        const local = JSON.parse(data);
        // Deep merge to ensure all keys from default are present
        return {
           ...defaultContent,
           ...local,
           general: { ...defaultContent.general, ...local.general },
           home: { ...defaultContent.home, ...local.home },
           footer: { ...defaultContent.footer, ...local.footer },
           settings: { ...defaultContent.settings, ...local.settings },
           payment: { ...defaultContent.payment, ...local.payment },
           categories: Array.isArray(local.categories) ? local.categories : defaultContent.categories,
        };
      } catch (e) {
        console.error("DB Error parsing content", e);
        return defaultContent;
      }
    },
    save: (content: any) => {
      if (typeof window === 'undefined') return;
      safeSetItem(DB_KEYS.CONTENT, JSON.stringify(content));
    }
  },
  orders: createDbCollection<Order>(DB_KEYS.ORDERS),
  submissions: {
      ...createDbCollection<FormSubmission>(DB_KEYS.SUBMISSIONS),
      updateStatus: (id: string, status: FormSubmission['status']) => {
        const collection = createDbCollection<FormSubmission>(DB_KEYS.SUBMISSIONS);
        collection.update(id, { status });
      }
  },
  users: {
      ...createDbCollection<DbUser>(DB_KEYS.USERS),
      getBuyers: (): DbUser[] => createDbCollection<DbUser>(DB_KEYS.USERS).getAll().filter(u => u.role === 'BUYER'),
      getSalespeople: (): DbUser[] => createDbCollection<DbUser>(DB_KEYS.USERS).getAll().filter(u => u.role === 'SALESPERSON'),
  },
  products: createDbCollection<Product>(DB_KEYS.PRODUCTS),
};
