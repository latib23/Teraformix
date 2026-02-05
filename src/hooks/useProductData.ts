
import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { fetchJson } from '../lib/api';

// Simple in-memory cache
const productCache = new Map<string, { data: Product | Product[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * API-Only Hook: Network First with In-Memory Caching
 */
export const useProductData = (identifier?: string) => {
  const [data, setData] = useState<Product[] | Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cacheKey = identifier || 'all-products';
      const cached = productCache.get(cacheKey);

      // Check if we have valid cached data
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      // Network Request
      if (identifier) {
        // Single product fetch
        const serverData = await fetchJson<Product>(`/products/${identifier}`);

        if (serverData) {
          productCache.set(cacheKey, { data: serverData, timestamp: Date.now() });
          setData(serverData);
        } else {
          throw new Error("Product not found");
        }
      } else {
        // List fetch: prefer paginated endpoint which is used across the public site
        const result = await fetchJson<{ items: Product[]; total: number }>(
          `/products/paginated?limit=100000&offset=0`
        );

        if (result && Array.isArray(result.items)) {
          productCache.set(cacheKey, { data: result.items, timestamp: Date.now() });
          setData(result.items);
        } else {
          throw new Error('Unexpected response while loading products');
        }
      }

    } catch (err) {
      console.error("Fetching from backend failed.", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Expose a manual refresh function
  return { data, loading, error, refresh: fetchData };
};
