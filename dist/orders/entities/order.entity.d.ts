import { Company } from '../../companies/entities/company.entity';
import { User } from '../../users/entities/user.entity';
export declare enum OrderStatus {
    PENDING_APPROVAL = "PENDING_APPROVAL",
    PROCESSING = "PROCESSING",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
}
export declare enum PaymentMethod {
    STRIPE = "STRIPE",
    PO = "PO",
    BANK_TRANSFER = "BANK_TRANSFER"
}
export declare class Order {
    id: string;
    company: Company;
    salesperson: User;
    total: number;
    paymentMethod: PaymentMethod;
    poNumber: string;
    poFilePath: string;
    status: OrderStatus;
    trackingNumber: string;
    carrier: string;
    items: any;
    shippingAddress: any;
    billingAddress: any;
    createdAt: Date;
    airtableRecordId: string;
    xeroInvoiceId: string;
    get friendlyId(): string;
}
