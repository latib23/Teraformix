import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';

@Injectable()
export class QdrantService implements OnModuleInit {
    private readonly logger = new Logger(QdrantService.name);
    private client: QdrantClient;
    private openai: OpenAI;
    private readonly collectionName = 'products';
    private readonly vectorSize = 1536; // text-embedding-3-small

    constructor(private readonly configService: ConfigService) {
        const url = this.configService.get<string>('QDRANT_URL') || 'http://localhost:6333';
        const apiKey = this.configService.get<string>('QDRANT_API_KEY');
        const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

        this.client = new QdrantClient({ url, apiKey });

        if (openaiKey) {
            this.openai = new OpenAI({ apiKey: openaiKey });
        } else {
            this.logger.warn('OPENAI_API_KEY not found. Semantic search will not work.');
        }
    }

    async onModuleInit() {
        try {
            const result = await this.client.getCollections();
            const exists = result.collections.some((c) => c.name === this.collectionName);

            if (!exists) {
                this.logger.log(`Creating Qdrant collection '${this.collectionName}'...`);
                await this.client.createCollection(this.collectionName, {
                    vectors: {
                        size: this.vectorSize,
                        distance: 'Cosine',
                    },
                });
            }
        } catch (e) {
            this.logger.error(`Failed to initialize Qdrant: ${e.message}`);
        }
    }

    async getEmbedding(text: string): Promise<number[] | null> {
        if (!this.openai) return null;
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
            });
            return response.data[0].embedding;
        } catch (e) {
            this.logger.error(`OpenAI Embedding failed: ${e.message}`);
            return null;
        }
    }

    async upsertProduct(product: any) {
        if (!this.openai) return;

        // Create a rich text representation for embedding
        const text = `
      Product: ${product.name}
      SKU: ${product.sku}
      Brand: ${product.brand || 'Generic'}
      Category: ${product.category}
      Description: ${product.description || ''}
      Specs: ${JSON.stringify(product.attributes || {})}
    `.trim().replace(/\s+/g, ' ');

        const vector = await this.getEmbedding(text);
        if (!vector) return;

        try {
            await this.client.upsert(this.collectionName, {
                wait: true,
                points: [
                    {
                        id: product.id, // Ensure ID is UUID
                        vector,
                        payload: {
                            name: product.name,
                            sku: product.sku,
                            brand: product.brand,
                            category: product.category,
                            price: product.basePrice
                        }
                    },
                ],
            });
        } catch (e) {
            this.logger.error(`Qdrant Upsert failed for ${product.sku}: ${e.message}`);
        }
    }

    async removeProduct(id: string) {
        try {
            await this.client.delete(this.collectionName, {
                points: [id],
            });
        } catch (e) {
            this.logger.error(`Qdrant Delete failed for ${id}: ${e.message}`);
        }
    }

    async search(query: string, limit = 50): Promise<string[]> {
        if (!this.openai) return [];

        const vector = await this.getEmbedding(query);
        if (!vector) return [];

        try {
            const results = await this.client.search(this.collectionName, {
                vector,
                limit,
                with_payload: false,
            });

            return results.map((r) => String(r.id));
        } catch (e) {
            this.logger.error(`Qdrant Search failed: ${e.message}`);
            return [];
        }
    }
}
