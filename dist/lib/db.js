"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const DB_KEYS = {
    CONTENT: 'stc_global_content_v2',
    ORDERS: 'stc_orders',
    SUBMISSIONS: 'stc_submissions',
    USERS: 'stc_users',
    PRODUCTS: 'stc_products',
};
const safeSetItem = (key, value) => {
    try {
        localStorage.setItem(key, value);
    }
    catch (e) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            console.error("Local Storage Quota Exceeded. Cannot save changes.");
            alert("Storage Limit Reached: The image or data you are trying to save is too large for the browser's local storage. Please try a smaller image (under 500KB) or clear old data.");
        }
        else {
            console.error("Local Storage Error", e);
        }
    }
};
const createDbCollection = (key) => {
    const getAll = () => {
        if (typeof window === 'undefined')
            return [];
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        }
        catch (e) {
            console.error(`Error reading ${key} from DB`, e);
            return [];
        }
    };
    const saveAll = (data) => {
        safeSetItem(key, JSON.stringify(data));
    };
    const add = (item) => {
        const all = getAll();
        const newItem = Object.assign(Object.assign({}, item), { id: item.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` });
        saveAll([...all, newItem]);
        return newItem;
    };
    const update = (id, updates) => {
        const all = getAll();
        const updated = all.map(item => (item.id === id ? Object.assign(Object.assign({}, item), updates) : item));
        saveAll(updated);
    };
    const del = (id) => {
        const all = getAll();
        saveAll(all.filter(item => item.id !== id));
    };
    return { getAll, add, update, delete: del, saveAll };
};
exports.db = {
    content: {
        get: (defaultContent) => {
            if (typeof window === 'undefined')
                return defaultContent;
            let data = '';
            try {
                data = localStorage.getItem(DB_KEYS.CONTENT) || '';
            }
            catch (_e) {
                void _e;
                return defaultContent;
            }
            if (!data)
                return defaultContent;
            try {
                const local = JSON.parse(data);
                return Object.assign(Object.assign(Object.assign({}, defaultContent), local), { general: Object.assign(Object.assign({}, defaultContent.general), local.general), home: Object.assign(Object.assign({}, defaultContent.home), local.home), footer: Object.assign(Object.assign({}, defaultContent.footer), local.footer), settings: Object.assign(Object.assign({}, defaultContent.settings), local.settings), payment: Object.assign(Object.assign({}, defaultContent.payment), local.payment), categories: Array.isArray(local.categories) ? local.categories : defaultContent.categories });
            }
            catch (e) {
                console.error("DB Error parsing content", e);
                return defaultContent;
            }
        },
        save: (content) => {
            if (typeof window === 'undefined')
                return;
            safeSetItem(DB_KEYS.CONTENT, JSON.stringify(content));
        }
    },
    orders: createDbCollection(DB_KEYS.ORDERS),
    submissions: Object.assign(Object.assign({}, createDbCollection(DB_KEYS.SUBMISSIONS)), { updateStatus: (id, status) => {
            const collection = createDbCollection(DB_KEYS.SUBMISSIONS);
            collection.update(id, { status });
        } }),
    users: Object.assign(Object.assign({}, createDbCollection(DB_KEYS.USERS)), { getBuyers: () => createDbCollection(DB_KEYS.USERS).getAll().filter(u => u.role === 'BUYER'), getSalespeople: () => createDbCollection(DB_KEYS.USERS).getAll().filter(u => u.role === 'SALESPERSON') }),
    products: createDbCollection(DB_KEYS.PRODUCTS),
};
//# sourceMappingURL=db.js.map