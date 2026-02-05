import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class QdrantService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private client;
    private openai;
    private readonly collectionName;
    private readonly vectorSize;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    getEmbedding(text: string): Promise<number[] | null>;
    upsertProduct(product: any): Promise<void>;
    removeProduct(id: string): Promise<void>;
    search(query: string, limit?: number): Promise<string[]>;
}
