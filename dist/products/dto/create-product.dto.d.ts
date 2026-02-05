export declare class CreateProductDto {
    sku: string;
    name: string;
    description: string;
    basePrice: number;
    stockLevel: number;
    weight?: string;
    dimensions?: string;
    attributes: Record<string, any>;
    tierPrices: Array<{
        qty: number;
        price: number;
    }>;
    showPrice?: boolean;
}
