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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("./products.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const ip_whitelist_guard_1 = require("../auth/guards/ip-whitelist.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
let ProductsController = class ProductsController {
    constructor(productsService) {
        this.productsService = productsService;
    }
    create(createProductDto) {
        return this.productsService.create(createProductDto);
    }
    bulk(items) {
        return this.productsService.bulkUpsert(Array.isArray(items) ? items : []);
    }
    update(id, updateProductDto) {
        return this.productsService.update(id, updateProductDto);
    }
    remove(id) {
        return this.productsService.remove(id);
    }
    async addReview(id, body) {
        const product = await this.productsService.findOne(id);
        const review = {
            author: body.author || 'Anonymous',
            datePublished: new Date().toISOString().split('T')[0],
            reviewBody: body.reviewBody,
            ratingValue: body.ratingValue,
            status: 'PENDING'
        };
        const schema = product.schema || {};
        let reviews = [];
        try {
            if (typeof schema.reviews === 'string')
                reviews = JSON.parse(schema.reviews);
            else if (Array.isArray(schema.reviews))
                reviews = schema.reviews;
        }
        catch (_a) { }
        reviews.push(review);
        schema.reviews = reviews;
        await this.productsService.update(product.id, { schema });
        return { success: true, message: 'Review submitted for approval' };
    }
    async findAll() {
        const products = await this.productsService.findAll();
        return products.map(this.mapToFrontend);
    }
    async paginated(limit, offset, q, brand, category, sort) {
        const { items, total } = await this.productsService.findPaginated({
            limit: Number(limit !== null && limit !== void 0 ? limit : 30),
            offset: Number(offset !== null && offset !== void 0 ? offset : 0),
            q,
            brand,
            category,
            sort,
        });
        return { items: items.map(this.mapToFrontend), total };
    }
    async search(query) {
        const products = await this.productsService.search(query);
        return products.map(this.mapToFrontend);
    }
    async byIds(idsParam) {
        const ids = String(idsParam || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        const products = await this.productsService.findByIds(ids);
        return products.map(this.mapToFrontend);
    }
    async findOne(id) {
        const p = await this.productsService.findOne(id);
        return this.mapToFrontend(p);
    }
    mapToFrontend(p) {
        const a = p.attributes || {};
        const derived = {
            mpn: a.__schema_mpn,
            itemCondition: a.__schema_itemCondition,
            gtin13: a.__schema_gtin13,
            gtin14: a.__schema_gtin14,
            priceValidUntil: a.__schema_priceValidUntil,
            seller: a.__schema_seller,
            ratingValue: a.__schema_ratingValue,
            reviewCount: a.__schema_reviewCount,
            reviews: a.__schema_reviews,
        };
        const hasSchema = p.schema && Object.keys(p.schema || {}).length > 0;
        const schema = hasSchema ? p.schema : derived;
        return Object.assign(Object.assign({}, p), { price: Number(p.basePrice), specs: a, schema, stockStatus: p.stockLevel > 0 ? 'IN_STOCK' : 'BACKORDER', brand: p.brand || 'Generic', category: p.category || 'Uncategorized', image: p.image || '' });
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, ip_whitelist_guard_1.IpWhitelistGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new product' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, ip_whitelist_guard_1.IpWhitelistGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk upsert products by SKU' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "bulk", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, ip_whitelist_guard_1.IpWhitelistGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, ip_whitelist_guard_1.IpWhitelistGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a product' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/reviews'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "addReview", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('paginated'),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'brand', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('offset')),
    __param(2, (0, common_1.Query)('q')),
    __param(3, (0, common_1.Query)('brand')),
    __param(4, (0, common_1.Query)('category')),
    __param(5, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "paginated", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('by-ids'),
    (0, swagger_1.ApiQuery)({ name: 'ids', required: true, description: 'Comma-separated product UUIDs' }),
    __param(0, (0, common_1.Query)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "byIds", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "findOne", null);
exports.ProductsController = ProductsController = __decorate([
    (0, swagger_1.ApiTags)('products'),
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map