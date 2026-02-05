export declare class Product {
    id: string;
    sku: string;
    name: string;
    brand: string;
    category: string;
    image: string;
    description: string;
    basePrice: number;
    stockLevel: number;
    weight: string;
    dimensions: string;
    attributes: Record<string, any>;
    schema: Record<string, any>;
    tierPrices: Array<{
        qty: number;
        price: number;
    }>;
    compatibleIds: string[];
    overview: string;
    warranty: string;
    compatibility: string;
    datasheet: string;
    metaTitle: string;
    metaDescription: string;
    redirectTo: string;
    redirectPermanent: boolean;
    showPrice: boolean;
}
