import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto): Promise<import("./entities/product.entity").Product>;
    bulk(items: any[]): Promise<{
        created: number;
        updated: number;
        failed: number;
        skipped: number;
        details: any[];
    }>;
    update(id: string, updateProductDto: any): Promise<import("./entities/product.entity").Product>;
    remove(id: string): Promise<void>;
    addReview(id: string, body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    findAll(): Promise<any[]>;
    paginated(limit?: string, offset?: string, q?: string, brand?: string, category?: string, sort?: string): Promise<{
        items: any[];
        total: number;
    }>;
    search(query: string): Promise<any[]>;
    byIds(idsParam: string): Promise<any[]>;
    findOne(id: string): Promise<any>;
    private mapToFrontend;
}
