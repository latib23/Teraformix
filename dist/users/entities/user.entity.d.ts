import { Company } from '../../companies/entities/company.entity';
import { Quote } from '../../quotes/entities/quote.entity';
import { Order } from '../../orders/entities/order.entity';
export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    COMPANY_ADMIN = "COMPANY_ADMIN",
    BUYER = "BUYER",
    SALESPERSON = "SALESPERSON",
    BLOG_MANAGER = "BLOG_MANAGER"
}
export declare class User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    permissions: string[];
    target: number;
    quarterlyTarget: number;
    company: Company;
    quotes: Quote[];
    createdOrders: Order[];
}
