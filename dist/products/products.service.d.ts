import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { QdrantService } from '../search/qdrant.service';
import { CreateProductDto } from './dto/create-product.dto';
export declare class ProductsService implements OnModuleInit {
    private productRepository;
    private readonly qdrantService;
    private readonly logger;
    constructor(productRepository: Repository<Product>, qdrantService: QdrantService);
    onModuleInit(): Promise<void>;
    private runBackgroundTasks;
    private syncToQdrant;
    private seedProductReviews;
    private normalizeCategory;
    create(createProductDto: CreateProductDto): Promise<Product>;
    update(id: string, updateData: any): Promise<Product>;
    remove(id: string): Promise<void>;
    findAll(): Promise<Product[]>;
    findPaginated(options: {
        limit?: number;
        offset?: number;
        q?: string;
        brand?: string;
        category?: string;
        sort?: string;
    }): Promise<{
        items: Product[];
        total: number;
    }>;
    findOne(identifier: string): Promise<Product>;
    search(query: string): Promise<Product[]>;
    findByIds(ids: string[]): Promise<Product[]>;
    bulkUpsert(items: any[]): Promise<{
        created: number;
        updated: number;
        failed: number;
        skipped: number;
        details: any[];
    }>;
    private generateRandomReviews;
}
