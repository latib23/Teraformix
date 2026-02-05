import { ContentState } from '../contexts/GlobalContent';
import { Product, Order, FormSubmission } from '../types';
interface DbUser {
    id: string;
    name: string;
    email: string;
    role: string;
    target?: number;
    quarterlyTarget?: number;
    totalSales?: number;
    joinedAt?: string;
    password?: string;
}
export declare const db: {
    content: {
        get: (defaultContent: any) => ContentState;
        save: (content: any) => void;
    };
    orders: {
        getAll: () => Order[];
        add: (item: Omit<Order, "id"> & {
            id?: string;
        }) => Order;
        update: (id: string, updates: Partial<Order>) => void;
        delete: (id: string) => void;
        saveAll: (data: Order[]) => void;
    };
    submissions: {
        updateStatus: (id: string, status: FormSubmission["status"]) => void;
        getAll: () => FormSubmission[];
        add: (item: Omit<FormSubmission, "id"> & {
            id?: string;
        }) => FormSubmission;
        update: (id: string, updates: Partial<FormSubmission>) => void;
        delete: (id: string) => void;
        saveAll: (data: FormSubmission[]) => void;
    };
    users: {
        getBuyers: () => DbUser[];
        getSalespeople: () => DbUser[];
        getAll: () => DbUser[];
        add: (item: Omit<DbUser, "id"> & {
            id?: string;
        }) => DbUser;
        update: (id: string, updates: Partial<DbUser>) => void;
        delete: (id: string) => void;
        saveAll: (data: DbUser[]) => void;
    };
    products: {
        getAll: () => Product[];
        add: (item: Omit<Product, "id"> & {
            id?: string;
        }) => Product;
        update: (id: string, updates: Partial<Product>) => void;
        delete: (id: string) => void;
        saveAll: (data: Product[]) => void;
    };
};
export {};
