export interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    stockLevel?: number;
    stockStatus: 'IN_STOCK' | 'BACKORDER' | 'OUT_OF_STOCK';
    image: string;
    category: string;
    brand: string;
    description: string;
    specs: Record<string, string>;
    schema?: Record<string, any>;
    metaTitle?: string;
    metaDescription?: string;
    showPrice?: boolean;
    weight?: string;
    dimensions?: string;
    compatibility?: string;
    warranty?: string;
    overview?: string;
    datasheet?: string;
    redirectTo?: string;
    redirectPermanent?: boolean;
}
export interface CartItem extends Product {
    quantity: number;
}
export interface Category {
    id: string;
    name: string;
    description: string;
    image: string;
    isActive: boolean;
    seoTitle?: string;
    seoDescription?: string;
    seoH1?: string;
    seoText?: string;
    redirectTo?: string;
    redirectPermanent?: boolean;
}
export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    image?: string;
    tags?: string[];
    author?: string;
    publishDate?: string;
    isPublished: boolean;
    metaTitle?: string;
    metaDescription?: string;
}
export interface Company {
    id: string;
    name: string;
    taxId: string;
}
export interface Address {
    firstName: string;
    lastName: string;
    company?: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
    phone: string;
    email?: string;
    shippingCost?: number;
    shipmentService?: string;
}
export interface Order {
    id: string;
    company: Company | null;
    total: number;
    paymentMethod: 'STRIPE' | 'PO' | 'BANK_TRANSFER';
    poNumber: string | null;
    status: 'PENDING_APPROVAL' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    items: CartItem[];
    createdAt: string;
    shippingAddress?: Address;
    billingAddress?: Address;
    salespersonName?: string;
    trackingNumber?: string;
    carrier?: string;
    airtableRecordId?: string;
}
export type SubmissionType = 'CONCIERGE' | 'BULK_QUOTE' | 'BOM_UPLOAD' | 'ABANDONED_CHECKOUT' | 'ABANDONED_FORM' | 'QUOTE_BEATING' | 'STANDARD_CART' | 'CONTACT_US';
export interface FormSubmission {
    id: string;
    type: SubmissionType;
    submittedAt: string;
    sourceUrl: string;
    status: 'NEW' | 'READ' | 'QUOTE_READY' | 'COMPLETED' | 'ARCHIVED' | 'PENDING' | 'AWAITING_PAYMENT' | 'PAID';
    data: {
        name?: string;
        email: string;
        phone?: string;
        company?: string;
        subject?: string;
        message?: string;
        parts?: string;
        timeline?: string;
        fileName?: string;
        fileContent?: string;
        notes?: string;
        quoteNumber?: string;
        competitorPrice?: string;
        shipping?: Address;
        billing?: Address;
        cartCount?: number;
        source?: string;
        cart?: Array<{
            name?: string;
            sku?: string;
            quantity?: number;
            unitPrice?: number;
        }>;
        shippingCost?: number;
        discount?: number;
        subtotal?: number;
        total?: number;
        paymentTerms?: string;
    };
}
