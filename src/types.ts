
export interface Product {
  id: string;
  name: string;
  sku: string; // MPN
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
  // New Editable Fields
  showPrice?: boolean;
  weight?: string;
  dimensions?: string;
  compatibility?: string;
  warranty?: string;
  overview?: string; // The long technical description underneath the main product area
  datasheet?: string; // URL to PDF datasheet
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
  image: string; // Base64 or URL
  isActive: boolean;
  // SEO Fields
  seoTitle?: string;
  seoDescription?: string;
  seoH1?: string;
  seoText?: string; // Long text content for the category top block
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

// Frontend type for Company
export interface Company {
  id: string;
  name: string;
  taxId: string;
}

// Address interface for shipping/billing
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

// Frontend type for Order
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

// Form Submissions
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
    parts?: string; // For concierge/bulk
    timeline?: string;
    fileName?: string; // For BOM
    fileContent?: string; // Base64 string for BOM download
    notes?: string;
    quoteNumber?: string; // Reference number generated for the user
    competitorPrice?: string; // For Quote Beating
    shipping?: Address;
    billing?: Address;
    cartCount?: number;
    source?: string;
    cart?: Array<{ name?: string; sku?: string; quantity?: number; unitPrice?: number }>;
    // Financials
    shippingCost?: number;
    discount?: number;
    subtotal?: number;
    total?: number;
    paymentTerms?: string;
  };
}
