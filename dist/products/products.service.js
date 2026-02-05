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
var ProductsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./entities/product.entity");
const qdrant_service_1 = require("../search/qdrant.service");
const mockData_1 = require("../lib/mockData");
const index_now_1 = require("../lib/index-now");
let ProductsService = ProductsService_1 = class ProductsService {
    constructor(productRepository, qdrantService) {
        this.productRepository = productRepository;
        this.qdrantService = qdrantService;
        this.logger = new common_1.Logger(ProductsService_1.name);
    }
    async onModuleInit() {
        try {
            const count = await this.productRepository.count();
            const firstItem = await this.productRepository.findOne({ where: {} });
            const needsUpdate = count === 0 || (firstItem && (!firstItem.category || !firstItem.brand));
            if (needsUpdate) {
                this.logger.log('Seeding/Updating Products table with rich mock data...');
                for (const p of mockData_1.mockProducts) {
                    const existing = await this.productRepository.findOne({ where: { sku: p.sku } });
                    const productData = {
                        sku: p.sku,
                        name: p.name,
                        description: p.description,
                        brand: p.brand,
                        category: p.category,
                        image: p.image,
                        basePrice: p.price,
                        stockLevel: p.stockStatus === 'IN_STOCK' ? Math.floor(Math.random() * 25) + 1 : 0,
                        weight: p.weight,
                        dimensions: p.dimensions,
                        attributes: p.specs,
                        overview: p.overview,
                        warranty: p.warranty,
                        compatibility: p.compatibility,
                        datasheet: p.datasheet,
                        metaTitle: p.metaTitle,
                        metaDescription: p.metaDescription
                    };
                    if (existing) {
                        await this.productRepository.save(Object.assign({ id: existing.id }, productData));
                    }
                    else {
                        await this.productRepository.save(this.productRepository.create(productData));
                    }
                }
                this.logger.log(`Database Seeding Complete: Synced ${mockData_1.mockProducts.length} products.`);
            }
            this.runBackgroundTasks();
        }
        catch (error) {
            this.logger.error('Error during product seeding/normalization:', error);
        }
    }
    async runBackgroundTasks() {
        try {
            const allCount = await this.productRepository.count();
            this.logger.log('[Background] Checking for products with default stock level (100)...');
            const productsWithDefaultStock = await this.productRepository.find({
                where: { stockLevel: 100 }
            });
            if (productsWithDefaultStock.length > 0) {
                this.logger.log(`[Background] Found ${productsWithDefaultStock.length} products with stockLevel = 100. Randomizing...`);
                for (const product of productsWithDefaultStock) {
                    const randomStock = Math.floor(Math.random() * 25) + 1;
                    await this.productRepository.update(product.id, { stockLevel: randomStock });
                }
                this.logger.log('[Background] Stock level randomization complete.');
            }
            else {
                this.logger.log('[Background] All products have randomized stock levels.');
            }
            if (allCount > 0) {
                this.logger.log(`[Background] Starting category normalization for ${allCount} products...`);
                const allProducts = await this.productRepository.find();
                for (const p of allProducts) {
                    const newCat = this.normalizeCategory(p.category, p.name);
                    if (newCat !== p.category) {
                        await this.productRepository.update(p.id, { category: newCat });
                    }
                }
                this.logger.log('[Background] Category normalization complete.');
            }
            this.logger.log('[Background] Auditing review statuses...');
            const auditProducts = await this.productRepository.find();
            for (const p of auditProducts) {
                let changed = false;
                if (p.schema && Array.isArray(p.schema.reviews)) {
                    for (const r of p.schema.reviews) {
                        if (!r.status) {
                            r.status = 'APPROVED';
                            changed = true;
                        }
                    }
                }
                if (p.attributes && Array.isArray(p.attributes.__schema_reviews)) {
                    for (const r of p.attributes.__schema_reviews) {
                        if (!r.status) {
                            r.status = 'APPROVED';
                            changed = true;
                        }
                    }
                }
                if (changed) {
                    await this.productRepository.save(p);
                }
            }
            await this.seedProductReviews();
            this.logger.log('[Background] Syncing all products to Qdrant...');
            const qdrantProducts = await this.productRepository.find();
            for (const p of qdrantProducts) {
                await this.syncToQdrant(p);
            }
            this.logger.log('[Background] Qdrant sync complete.');
        }
        catch (e) {
            this.logger.error('[Background] Tasks failed', e);
        }
    }
    async syncToQdrant(product) {
        await this.qdrantService.upsertProduct(product);
    }
    async seedProductReviews() {
        this.logger.log('Checking product review counts...');
        const products = await this.productRepository.find();
        let updatedCount = 0;
        const names = [
            'John D.', 'Sarah M.', 'Robert T.', 'Michael S.', 'David L.', 'Jennifer W.', 'Christopher B.', 'James K.',
            'Thomas R.', 'Daniel H.', 'Elizabeth G.', 'Matthew F.', 'Kevin O.', 'Anthony V.', 'Brian P.', 'Jason C.',
            'Mark S.', 'Paul W.', 'Steven B.', 'Richard L.', 'Nancy K.', 'Karen J.', 'Betty M.', 'Sandra T.', 'Ashley G.',
            'Donna F.', 'Emily H.', 'Michelle B.', 'Carol Z.', 'Amanda Q.'
        ];
        const techTitles = [
            'CTO', 'Senior DevOps Engineer', 'IT Manager', 'Network Architect', 'Infrastructure Lead',
            'System Admin', 'Data Center Manager', 'Procurement Officer', 'Solutions Architect', 'MSP Owner'
        ];
        const templates = [
            'Fantastic performance. We integrated this into our cluster and saw immediate improvements.',
            'Solid build quality. Exactly what you expect from enterprise-grade hardware.',
            'Server Tech Central delivered this faster than expected. Perfect condition.',
            'Reliable and robust. We have been running this for 3 months now with zero downtime.',
            'Excellent value for the price. Hard to beat this level of performance in this budget.',
            'The compatibility was spot on. Plug and play with our existing infrastructure.',
            'Great customer support from STC when we had questions about the firmware version.',
            'Packaging was very secure. Electrostatic safe and well-padded.',
            'Performance exceeds the datasheet specs in our real-world testing.',
            'Highly recommend for any data center expansion project.',
            'The SAS/SATA performance is consistent under heavy IO workloads.',
            'Thermal performance is excellent even under sustained load.',
            'Quiet and efficient. Perfect for our edge compute deployment.',
            'Genuine OEM part as advertised. Serial number verified with the manufacturer.',
            'Five stars for the shipping speed and the product quality.',
            'Seamless integration into our existing monitoring stack.',
            'The management interface is intuitive and feature-rich.',
            'Substantial upgrade over our previous generation hardware.',
            'Price to performance ratio is unbeatable right now.',
            'A workhorse for our production environment.',
            'Build quality is top-notch, feels very premium and durable.',
            'Surprising performance benchmarks for this price point.',
            'Essential for our high-availability setup.',
            'STC is now our go-to for all enterprise hardware needs.',
            'No issues during the 48-hour burn-in test.'
        ];
        for (const p of products) {
            const s = p.schema || {};
            let reviews = Array.isArray(s.reviews) ? s.reviews : [];
            if (reviews.length < 20) {
                const reviewsToAdd = 20 + Math.floor(Math.random() * 15) - reviews.length;
                const newReviews = [];
                for (let i = 0; i < reviewsToAdd; i++) {
                    const rating = 4 + Math.random();
                    const name = names[Math.floor(Math.random() * names.length)];
                    const title = techTitles[Math.floor(Math.random() * techTitles.length)];
                    const body = templates[Math.floor(Math.random() * templates.length)];
                    const date = new Date(Date.now() - Math.floor(Math.random() * 31536000000));
                    newReviews.push({
                        author: `${name} - ${title}`,
                        datePublished: date.toISOString().split('T')[0],
                        reviewBody: body,
                        ratingValue: rating.toFixed(1),
                        status: 'APPROVED'
                    });
                }
                reviews = [...reviews, ...newReviews].sort((a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime());
                const totalRating = reviews.reduce((sum, r) => sum + parseFloat(r.ratingValue), 0);
                const avgRating = (totalRating / reviews.length).toFixed(1);
                p.schema = Object.assign(Object.assign({}, s), { reviews: reviews, ratingValue: avgRating, reviewCount: reviews.length });
                p.attributes = Object.assign(Object.assign({}, (p.attributes || {})), { __schema_reviews: reviews, __schema_ratingValue: avgRating, __schema_reviewCount: reviews.length });
                await this.productRepository.save(p);
                updatedCount++;
            }
        }
        if (updatedCount > 0) {
            this.logger.log(`Reviews generated for ${updatedCount} products.`);
        }
        else {
            this.logger.log('All products already have 20+ reviews.');
        }
    }
    normalizeCategory(category, productName) {
        const cat = (category || '').toLowerCase().trim();
        const name = (productName || '').toLowerCase().trim();
        if (name.includes('server') || name.includes('poweredge') || name.includes('proliant') ||
            name.includes('blade system') || name.includes('blade enclosure') ||
            cat.includes('server')) {
            return 'Servers';
        }
        if (name.includes('hard drive') || name.includes(' hdd') || name.includes('ssd') ||
            name.includes('nvme') || name.includes('solid state') || name.includes('storage array') ||
            name.includes('nas ') || name.includes('san ') || name.includes('drive ') ||
            cat.includes('hard drive') || cat.includes('hdd') || cat.includes('ssd') ||
            cat.includes('nvme') || cat.includes('storage')) {
            return 'Storage';
        }
        if (name.includes('switch') || name.includes('router') || name.includes('firewall') ||
            name.includes('access point') || name.includes('unifi') || name.includes('sfp') ||
            name.includes('transceiver') || name.includes('network card') || name.includes('nic ') ||
            name.includes('ethernet') || cat.includes('switch') || cat.includes('router') ||
            cat.includes('firewall') || cat.includes('networking') || cat.includes('optics')) {
            return 'Networking';
        }
        if (name.includes(' ram') || name.includes('memory') || name.includes('dimm') ||
            name.includes('xeon') || name.includes('epyc') || name.includes('processor') ||
            name.includes('cpu') || name.includes('power supply') || name.includes(' psu') ||
            name.includes('adapter') || name.includes('cable') || name.includes('rail') ||
            name.includes('bezel') || name.includes('battery') || name.includes('raid') ||
            name.includes('controller') || name.includes('backplane') || name.includes('fan') ||
            cat.includes('memory') || cat.includes('ram') || cat.includes('processor') ||
            cat.includes('cpu') || cat.includes('power supply') || cat.includes('component') ||
            cat.includes('part')) {
            return 'Components';
        }
        return 'Components';
    }
    async create(createProductDto) {
        const incoming = createProductDto;
        const attributes = incoming.attributes || {};
        const category = this.normalizeCategory(incoming.category, incoming.name);
        const schema = incoming.schema || {};
        const initialReviews = this.generateRandomReviews(20 + Math.floor(Math.random() * 10));
        const totalRating = initialReviews.reduce((sum, r) => sum + parseFloat(r.ratingValue), 0);
        const avgRating = (totalRating / initialReviews.length).toFixed(1);
        const payload = Object.assign(Object.assign({}, incoming), { attributes: Object.assign(Object.assign({}, (incoming.attributes || {})), { __schema_reviews: initialReviews, __schema_ratingValue: avgRating, __schema_reviewCount: initialReviews.length }), category, schema: Object.assign(Object.assign({}, schema), { reviews: initialReviews, ratingValue: avgRating, reviewCount: initialReviews.length }) });
        const product = this.productRepository.create(payload);
        const saved = await this.productRepository.save(product);
        await this.syncToQdrant(saved);
        (0, index_now_1.pingIndexNow)(`https://servertechcentral.com/product/${encodeURIComponent(saved.sku)}`);
        return saved;
    }
    async update(id, updateData) {
        const product = await this.findOne(id);
        if (updateData.price !== undefined)
            product.basePrice = updateData.price;
        if (updateData.specs !== undefined)
            product.attributes = updateData.specs;
        if (updateData.stockStatus !== undefined) {
            product.stockLevel = updateData.stockStatus === 'IN_STOCK' ? Math.floor(Math.random() * 25) + 1 : 0;
        }
        if (updateData.weight !== undefined)
            product.weight = updateData.weight;
        if (updateData.dimensions !== undefined)
            product.dimensions = updateData.dimensions;
        if (updateData.overview !== undefined)
            product.overview = updateData.overview;
        if (updateData.warranty !== undefined)
            product.warranty = updateData.warranty;
        if (updateData.compatibility !== undefined)
            product.compatibility = updateData.compatibility;
        if (updateData.datasheet !== undefined)
            product.datasheet = updateData.datasheet;
        if (updateData.metaTitle !== undefined)
            product.metaTitle = updateData.metaTitle;
        if (updateData.metaDescription !== undefined)
            product.metaDescription = updateData.metaDescription;
        if (updateData.tags !== undefined)
            product.tags = (Array.isArray(updateData.tags) ? updateData.tags : []);
        if (updateData.redirectTo !== undefined)
            product.redirectTo = updateData.redirectTo;
        if (updateData.redirectPermanent !== undefined)
            product.redirectPermanent = !!updateData.redirectPermanent;
        if (updateData.showPrice !== undefined)
            product.showPrice = Boolean(updateData.showPrice);
        if (updateData.schema !== undefined && updateData.schema !== null) {
            product.schema = updateData.schema || {};
        }
        if (updateData.name !== undefined || updateData.category !== undefined) {
            product.category = this.normalizeCategory(updateData.category || product.category, updateData.name || product.name);
        }
        const merged = this.productRepository.merge(product, updateData);
        const saved = await this.productRepository.save(merged);
        await this.syncToQdrant(saved);
        (0, index_now_1.pingIndexNow)(`https://servertechcentral.com/product/${encodeURIComponent(saved.sku)}`);
        return saved;
    }
    async remove(id) {
        const result = await this.productRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Product ${id} not found`);
        }
        await this.qdrantService.removeProduct(id);
    }
    async findAll() {
        return this.productRepository.find({ order: { name: 'ASC' } });
    }
    async findPaginated(options) {
        var _a, _b;
        const limit = Math.min(Math.max(Number((_a = options.limit) !== null && _a !== void 0 ? _a : 30), 1), 100000);
        const offset = Math.max(Number((_b = options.offset) !== null && _b !== void 0 ? _b : 0), 0);
        const q = String(options.q || '').trim();
        const brand = String(options.brand || '').trim();
        const category = String(options.category || '').trim();
        const sort = String(options.sort || '').trim().toLowerCase();
        const qb = this.productRepository.createQueryBuilder('product');
        if (sort === 'price_asc') {
            qb.orderBy('product.basePrice', 'ASC');
        }
        else if (sort === 'price_desc') {
            qb.orderBy('product.basePrice', 'DESC');
        }
        else {
            qb.orderBy('product.name', 'ASC');
        }
        if (q) {
            qb.andWhere('(product.name ILIKE :q OR product.sku ILIKE :q OR product.description ILIKE :q OR product.brand ILIKE :q OR product.category ILIKE :q)', { q: `%${q}%` });
        }
        if (brand) {
            qb.andWhere('product.brand ILIKE :brand', { brand });
        }
        if (category) {
            qb.andWhere('product.category ILIKE :category', { category });
        }
        qb.skip(offset).take(limit);
        const [items, total] = await qb.getManyAndCount();
        return { items, total };
    }
    async findOne(identifier) {
        const raw = String(identifier || '').trim();
        const decoded = (() => {
            try {
                return decodeURIComponent(raw);
            }
            catch (_a) {
                return raw;
            }
        })();
        const norm = (s) => s
            .normalize('NFKC')
            .replace(/[–—]/g, '-')
            .replace(/\s+/g, ' ')
            .trim();
        const decodedNorm = norm(decoded);
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(decodedNorm);
        let product = null;
        if (isUuid) {
            product = await this.productRepository.findOne({
                where: [{ id: decodedNorm }, { sku: (0, typeorm_2.ILike)(decodedNorm) }, { name: (0, typeorm_2.ILike)(decodedNorm) }],
            });
        }
        else {
            product = await this.productRepository.findOne({ where: { sku: (0, typeorm_2.ILike)(decodedNorm) } });
            if (!product) {
                product = await this.productRepository.findOne({ where: { name: (0, typeorm_2.ILike)(decodedNorm) } });
            }
            if (!product) {
                const dashedToSpaces = norm(decodedNorm.replace(/-/g, ' '));
                product = await this.productRepository.findOne({
                    where: [{ sku: (0, typeorm_2.ILike)(dashedToSpaces) }, { name: (0, typeorm_2.ILike)(dashedToSpaces) }],
                });
            }
            if (!product) {
                product = await this.productRepository
                    .createQueryBuilder('product')
                    .where(`lower(regexp_replace(product.name, '\\s+', ' ', 'g')) = lower(regexp_replace(:n, '\\s+', ' ', 'g'))`, { n: decodedNorm })
                    .getOne();
            }
            if (!product) {
                product = await this.productRepository.findOne({
                    where: { name: (0, typeorm_2.ILike)(`%${decodedNorm}%`) },
                });
            }
        }
        if (!product)
            throw new common_1.NotFoundException(`Product with identifier '${decodedNorm}' not found`);
        return product;
    }
    async search(query) {
        const q = String(query || '').trim();
        if (!q)
            return [];
        try {
            const ids = await this.qdrantService.search(q, 50);
            if (ids.length > 0) {
                return this.findByIds(ids);
            }
        }
        catch (e) {
            this.logger.warn(`Qdrant search failed: ${e.message}`);
        }
        return this.productRepository.find({
            where: [
                { name: (0, typeorm_2.ILike)(`%${q}%`) },
                { sku: (0, typeorm_2.ILike)(`%${q}%`) },
                { description: (0, typeorm_2.ILike)(`%${q}%`) },
                { brand: (0, typeorm_2.ILike)(`%${q}%`) },
                { category: (0, typeorm_2.ILike)(`%${q}%`) }
            ],
            take: 50
        });
    }
    async findByIds(ids) {
        const clean = (ids || []).map((s) => String(s).trim()).filter(Boolean);
        if (clean.length === 0)
            return [];
        return this.productRepository.findBy({ id: (0, typeorm_2.In)(clean) });
    }
    async bulkUpsert(items) {
        var _a, _b, _c;
        let created = 0;
        let updated = 0;
        let failed = 0;
        let skipped = 0;
        const details = [];
        for (const raw of items) {
            try {
                const sku = String(raw.sku || '').trim();
                const name = String(raw.name || '').trim();
                const description = String(raw.description || `${raw.brand ? raw.brand + ' ' : ''}${name || sku}`).trim();
                const basePrice = Number((_a = raw.basePrice) !== null && _a !== void 0 ? _a : raw.price);
                const stockLevel = Number((_b = raw.stockLevel) !== null && _b !== void 0 ? _b : 0);
                if (!sku || !name || isNaN(basePrice)) {
                    failed++;
                    details.push({ sku, status: 'failed', reason: 'invalid_required_fields' });
                    continue;
                }
                const category = this.normalizeCategory(raw.category, name);
                const attributes = typeof raw.attributes === 'object' && raw.attributes !== null ? raw.attributes : {};
                const schema = typeof raw.schema === 'object' && raw.schema !== null ? raw.schema : {};
                const mpn = String(raw.schema_mpn || raw.mpn || schema.mpn || '').trim();
                const existing = await this.productRepository.findOne({ where: { sku } });
                let finalReviews = schema.reviews;
                let finalRating = schema.ratingValue;
                let finalCount = schema.reviewCount;
                if (!Array.isArray(finalReviews) || finalReviews.length < 20) {
                    if (existing && ((_c = existing.schema) === null || _c === void 0 ? void 0 : _c.reviews) && Array.isArray(existing.schema.reviews) && existing.schema.reviews.length >= 20) {
                        finalReviews = existing.schema.reviews;
                        finalRating = existing.schema.ratingValue;
                        finalCount = existing.schema.reviewCount;
                    }
                    else {
                        finalReviews = this.generateRandomReviews(20 + Math.floor(Math.random() * 10));
                        const totalRating = finalReviews.reduce((sum, r) => sum + parseFloat(r.ratingValue), 0);
                        finalRating = (totalRating / finalReviews.length).toFixed(1);
                        finalCount = finalReviews.length;
                    }
                }
                const payload = {
                    sku,
                    name,
                    description,
                    basePrice,
                    stockLevel,
                    weight: raw.weight || null,
                    dimensions: raw.dimensions || null,
                    attributes: Object.assign(Object.assign({}, attributes), { __schema_reviews: finalReviews, __schema_ratingValue: finalRating, __schema_reviewCount: finalCount }),
                    schema: Object.assign(Object.assign({}, schema), { mpn: mpn || sku, reviews: finalReviews, ratingValue: finalRating, reviewCount: finalCount }),
                    brand: raw.brand || null,
                    category,
                    image: raw.image || null,
                    overview: raw.overview || null,
                    warranty: raw.warranty || null,
                    compatibility: raw.compatibility || null,
                    datasheet: raw.datasheet || null,
                    metaTitle: raw.metaTitle || null,
                    metaDescription: raw.metaDescription || null,
                    tags: Array.isArray(raw.tags) ? raw.tags : String(raw.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
                    redirectTo: raw.redirectTo || null,
                    redirectPermanent: String(raw.redirectPermanent || '').toLowerCase() === 'false' ? false : true,
                };
                if (existing) {
                    const hasChanges = existing.name !== payload.name ||
                        existing.description !== payload.description ||
                        Number(existing.basePrice) !== Number(payload.basePrice) ||
                        existing.stockLevel !== payload.stockLevel ||
                        existing.brand !== payload.brand ||
                        existing.category !== payload.category ||
                        existing.image !== payload.image ||
                        existing.weight !== payload.weight ||
                        existing.dimensions !== payload.dimensions ||
                        existing.overview !== payload.overview ||
                        existing.warranty !== payload.warranty ||
                        existing.compatibility !== payload.compatibility ||
                        existing.datasheet !== payload.datasheet ||
                        existing.metaTitle !== payload.metaTitle ||
                        existing.metaDescription !== payload.metaDescription ||
                        existing.redirectTo !== payload.redirectTo ||
                        JSON.stringify(existing.attributes) !== JSON.stringify(payload.attributes) ||
                        JSON.stringify(existing.schema) !== JSON.stringify(payload.schema);
                    if (hasChanges) {
                        await this.productRepository.save(Object.assign({ id: existing.id }, payload));
                        updated++;
                        details.push({ sku, name, status: 'updated' });
                        this.logger.log(`Updated product with SKU "${sku}" - changes detected`);
                    }
                    else {
                        skipped++;
                        details.push({
                            sku,
                            name,
                            status: 'skipped',
                            reason: 'no_changes',
                            message: `Product with SKU "${sku}" already exists with identical data`
                        });
                    }
                }
                else {
                    await this.productRepository.save(this.productRepository.create(payload));
                    created++;
                    details.push({ sku, name, status: 'created' });
                }
            }
            catch (e) {
                failed++;
                details.push({ sku: raw === null || raw === void 0 ? void 0 : raw.sku, status: 'failed', reason: 'exception', error: String(e) });
            }
        }
        if (details.length > 0) {
            const urls = details
                .filter(d => d.status === 'created' || d.status === 'updated')
                .map(d => `https://servertechcentral.com/product/${encodeURIComponent(d.sku)}`);
            if (urls.length > 0)
                (0, index_now_1.pingIndexNow)(urls);
        }
        return { created, updated, failed, skipped, details };
    }
    generateRandomReviews(count) {
        const names = [
            'John D.', 'Sarah M.', 'Robert T.', 'Michael S.', 'David L.', 'Jennifer W.', 'Christopher B.', 'James K.',
            'Thomas R.', 'Daniel H.', 'Elizabeth G.', 'Matthew F.', 'Kevin O.', 'Anthony V.', 'Brian P.', 'Jason C.',
            'Mark S.', 'Paul W.', 'Steven B.', 'Richard L.', 'Nancy K.', 'Karen J.', 'Betty M.', 'Sandra T.', 'Ashley G.',
            'Donna F.', 'Emily H.', 'Michelle B.', 'Carol Z.', 'Amanda Q.'
        ];
        const techTitles = [
            'CTO', 'Senior DevOps Engineer', 'IT Manager', 'Network Architect', 'Infrastructure Lead',
            'System Admin', 'Data Center Manager', 'Procurement Officer', 'Solutions Architect', 'MSP Owner'
        ];
        const templates = [
            'Fantastic performance. We integrated this into our cluster and saw immediate improvements.',
            'Solid build quality. Exactly what you expect from enterprise-grade hardware.',
            'Server Tech Central delivered this faster than expected. Perfect condition.',
            'Reliable and robust. We have been running this for 3 months now with zero downtime.',
            'Excellent value for the price. Hard to beat this level of performance in this budget.',
            'The compatibility was spot on. Plug and play with our existing infrastructure.',
            'Great customer support from STC when we had questions about the firmware version.',
            'Packaging was very secure. Electrostatic safe and well-padded.',
            'Performance exceeds the datasheet specs in our real-world testing.',
            'Highly recommend for any data center expansion project.',
            'The SAS/SATA performance is consistent under heavy IO workloads.',
            'Thermal performance is excellent even under sustained load.',
            'Quiet and efficient. Perfect for our edge compute deployment.',
            'Genuine OEM part as advertised. Serial number verified with the manufacturer.',
            'Five stars for the shipping speed and the product quality.',
            'Seamless integration into our existing monitoring stack.',
            'The management interface is intuitive and feature-rich.',
            'Substantial upgrade over our previous generation hardware.',
            'Price to performance ratio is unbeatable right now.',
            'A workhorse for our production environment.',
            'Build quality is top-notch, feels very premium and durable.',
            'Surprising performance benchmarks for this price point.',
            'Essential for our high-availability setup.',
            'STC is now our go-to for all enterprise hardware needs.',
            'No issues during the 48-hour burn-in test.'
        ];
        const reviews = [];
        for (let i = 0; i < count; i++) {
            const rating = 4 + Math.random();
            const name = names[Math.floor(Math.random() * names.length)];
            const title = techTitles[Math.floor(Math.random() * techTitles.length)];
            const body = templates[Math.floor(Math.random() * templates.length)];
            const date = new Date(Date.now() - Math.floor(Math.random() * 31536000000));
            reviews.push({
                author: `${name} - ${title}`,
                datePublished: date.toISOString().split('T')[0],
                reviewBody: body,
                ratingValue: rating.toFixed(1),
                status: 'APPROVED'
            });
        }
        return reviews.sort((a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime());
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = ProductsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        qdrant_service_1.QdrantService])
], ProductsService);
//# sourceMappingURL=products.service.js.map