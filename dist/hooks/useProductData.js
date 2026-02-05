"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProductData = void 0;
const react_1 = require("react");
const api_1 = require("../lib/api");
const productCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;
const useProductData = (identifier) => {
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchData = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const cacheKey = identifier || 'all-products';
            const cached = productCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
                setData(cached.data);
                setLoading(false);
                return;
            }
            if (identifier) {
                const serverData = await (0, api_1.fetchJson)(`/products/${identifier}`);
                if (serverData) {
                    productCache.set(cacheKey, { data: serverData, timestamp: Date.now() });
                    setData(serverData);
                }
                else {
                    throw new Error("Product not found");
                }
            }
            else {
                const result = await (0, api_1.fetchJson)(`/products/paginated?limit=100000&offset=0`);
                if (result && Array.isArray(result.items)) {
                    productCache.set(cacheKey, { data: result.items, timestamp: Date.now() });
                    setData(result.items);
                }
                else {
                    throw new Error('Unexpected response while loading products');
                }
            }
        }
        catch (err) {
            console.error("Fetching from backend failed.", err);
            setError(err);
        }
        finally {
            setLoading(false);
        }
    }, [identifier]);
    (0, react_1.useEffect)(() => {
        fetchData();
    }, [fetchData]);
    return { data, loading, error, refresh: fetchData };
};
exports.useProductData = useProductData;
//# sourceMappingURL=useProductData.js.map