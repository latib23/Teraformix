export declare const getApiBase: () => string;
export declare class NetworkError extends Error {
    constructor(message: string);
}
export declare function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T | null>;
export declare const api: {
    get: <T>(endpoint: string) => Promise<T>;
    post: <T>(endpoint: string, body: any) => Promise<T>;
    put: <T>(endpoint: string, body: any) => Promise<T>;
    patch: <T>(endpoint: string, body: any) => Promise<T>;
    delete: <T>(endpoint: string) => Promise<T>;
    upload: <T>(endpoint: string, body: FormData) => Promise<T>;
};
