import { Product } from '../types';
export declare const useProductData: (identifier?: string) => {
    data: Product | Product[];
    loading: boolean;
    error: any;
    refresh: () => Promise<void>;
};
