import { User } from '../../users/entities/user.entity';
export declare enum QuoteStatus {
    PENDING = "PENDING",
    REVIEWED = "REVIEWED",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    AWAITING_PAYMENT = "AWAITING_PAYMENT",
    PAID = "PAID"
}
export declare enum QuoteType {
    STANDARD_CART = "STANDARD_CART",
    CONCIERGE = "CONCIERGE",
    BULK_QUOTE = "BULK_QUOTE",
    BOM_UPLOAD = "BOM_UPLOAD",
    QUOTE_BEATING = "QUOTE_BEATING",
    ABANDONED_CHECKOUT = "ABANDONED_CHECKOUT",
    ABANDONED_FORM = "ABANDONED_FORM",
    CONTACT_US = "CONTACT_US"
}
export declare class Quote {
    id: string;
    referenceNumber: string;
    type: QuoteType;
    user: User;
    items: Array<{
        productId: string;
        qty: number;
        requestedPrice?: number;
    }>;
    submissionData: any;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    guestCompany: string;
    status: QuoteStatus;
    negotiatedTotal: number;
    paymentTerms: string;
    createdAt: Date;
}
