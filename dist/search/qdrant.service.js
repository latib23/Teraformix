"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var QdrantService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QdrantService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const js_client_rest_1 = require("@qdrant/js-client-rest");
const openai_1 = __importDefault(require("openai"));
let QdrantService = QdrantService_1 = class QdrantService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(QdrantService_1.name);
        this.collectionName = 'products';
        this.vectorSize = 1536;
        const url = this.configService.get('QDRANT_URL') || 'http://localhost:6333';
        const apiKey = this.configService.get('QDRANT_API_KEY');
        const openaiKey = this.configService.get('OPENAI_API_KEY');
        this.client = new js_client_rest_1.QdrantClient({ url, apiKey });
        if (openaiKey) {
            this.openai = new openai_1.default({ apiKey: openaiKey });
        }
        else {
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
        }
        catch (e) {
            this.logger.error(`Failed to initialize Qdrant: ${e.message}`);
        }
    }
    async getEmbedding(text) {
        if (!this.openai)
            return null;
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
            });
            return response.data[0].embedding;
        }
        catch (e) {
            this.logger.error(`OpenAI Embedding failed: ${e.message}`);
            return null;
        }
    }
    async upsertProduct(product) {
        if (!this.openai)
            return;
        const text = `
      Product: ${product.name}
      SKU: ${product.sku}
      Brand: ${product.brand || 'Generic'}
      Category: ${product.category}
      Description: ${product.description || ''}
      Specs: ${JSON.stringify(product.attributes || {})}
    `.trim().replace(/\s+/g, ' ');
        const vector = await this.getEmbedding(text);
        if (!vector)
            return;
        try {
            await this.client.upsert(this.collectionName, {
                wait: true,
                points: [
                    {
                        id: product.id,
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
        }
        catch (e) {
            this.logger.error(`Qdrant Upsert failed for ${product.sku}: ${e.message}`);
        }
    }
    async removeProduct(id) {
        try {
            await this.client.delete(this.collectionName, {
                points: [id],
            });
        }
        catch (e) {
            this.logger.error(`Qdrant Delete failed for ${id}: ${e.message}`);
        }
    }
    async search(query, limit = 50) {
        if (!this.openai)
            return [];
        const vector = await this.getEmbedding(query);
        if (!vector)
            return [];
        try {
            const results = await this.client.search(this.collectionName, {
                vector,
                limit,
                with_payload: false,
            });
            return results.map((r) => String(r.id));
        }
        catch (e) {
            this.logger.error(`Qdrant Search failed: ${e.message}`);
            return [];
        }
    }
};
exports.QdrantService = QdrantService;
exports.QdrantService = QdrantService = QdrantService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], QdrantService);
//# sourceMappingURL=qdrant.service.js.map