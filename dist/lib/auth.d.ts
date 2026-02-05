export declare const AUTH_TOKEN_KEY = "stc_auth_token";
export declare const AUTH_ROLE_KEY = "stc_auth_role";
export declare const AUTH_USER_KEY = "stc_auth_user";
export declare const AUTH_USER_ID_KEY = "stc_auth_user_id";
export declare const auth: {
    login: (email: string, password: string) => Promise<{
        success: boolean;
        role: any;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        role?: undefined;
    }>;
    register: (name: string, email: string, password: string) => Promise<{
        success: boolean;
        message: any;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    logout: () => void;
    isAuthenticated: () => boolean;
    getUserRole: () => string | null;
    getUserId: () => string | null;
    getUser: () => any;
};
