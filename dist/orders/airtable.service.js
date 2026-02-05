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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AirtableService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirtableService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const airtable_1 = __importDefault(require("airtable"));
const order_entity_1 = require("./entities/order.entity");
const product_entity_1 = require("../products/entities/product.entity");
let AirtableService = AirtableService_1 = class AirtableService {
    constructor(configService, productRepository, orderRepository) {
        this.configService = configService;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.logger = new common_1.Logger(AirtableService_1.name);
        const apiKey = this.configService.get('AIRTABLE_API_KEY');
        const baseId = this.configService.get('AIRTABLE_BASE_ID');
        const formsBaseId = this.configService.get('AIRTABLE_FORMS_BASE_ID') || 'app3aiGNMpvuzDsSQ';
        this.customersTable = this.configService.get('AIRTABLE_CUSTOMERS_TABLE') || 'Customers';
        this.ordersTable = this.configService.get('AIRTABLE_ORDERS_TABLE') || 'Orders';
        this.leadsTable = this.configService.get('AIRTABLE_FORMS_TABLE_NAME') || 'Leads';
        if (apiKey) {
            airtable_1.default.configure({ apiKey });
            if (baseId) {
                this.base = airtable_1.default.base(baseId);
            }
            if (formsBaseId) {
                if (!formsBaseId.startsWith('app')) {
                    this.logger.error(`Invalid Airtable Base ID format: "${formsBaseId}". Base IDs usually start with 'app'. Please replace the Name with the ID.`);
                }
                try {
                    this.formsBase = airtable_1.default.base(formsBaseId);
                    this.logger.log(`Initialized Forms Airtable Base: ${formsBaseId.slice(0, 8)}...`);
                }
                catch (e) {
                    this.logger.error('Invalid Forms Base ID', e);
                }
            }
            else {
                if (baseId) {
                    this.formsBase = airtable_1.default.base(baseId);
                    this.logger.log(`Using Default Base for Forms: ${baseId.slice(0, 8)}...`);
                }
            }
        }
        else {
            this.logger.warn('Airtable credentials not found. Integration disabled.');
        }
    }
    async createOrderRecord(order) {
        if (!this.base) {
            throw new Error('Airtable credentials not configured');
        }
        try {
            if (order.airtableRecordId) {
                this.logger.warn(`Order ${order.id} already synced to Airtable (${order.airtableRecordId})`);
                return;
            }
            const ship = order.shippingAddress || {};
            const bill = order.billingAddress || {};
            const customerEmail = (ship.email || '').trim().toLowerCase();
            if (!customerEmail) {
                throw new Error('Cannot sync order without customer email');
            }
            let customerRecordId;
            this.logger.log(`Searching for customer ${customerEmail} in Airtable...`);
            const existingRecords = await new Promise((resolve, reject) => {
                this.base(this.customersTable).select({
                    filterByFormula: `{Email} = '${customerEmail}'`,
                    maxRecords: 1
                }).firstPage((err, records) => {
                    if (err)
                        reject(err);
                    else
                        resolve(records || []);
                });
            });
            if (existingRecords.length > 0) {
                customerRecordId = existingRecords[0].id;
                this.logger.log(`Found existing customer: ${customerRecordId}`);
            }
            else {
                this.logger.log(`Creating new customer: ${customerEmail}`);
                const customerFields = {
                    'Name': [ship.firstName, ship.lastName].filter(Boolean).join(' '),
                    'Company Name': ship.company || '',
                    'Email': customerEmail,
                    'Phone': ship.phone || '',
                    'Shipping Street': [ship.street, ship.address2].filter(Boolean).join(', '),
                    'Shipping City': ship.city || '',
                    'Shipping State': ship.state || '',
                    'Shipping Zip': ship.zip || '',
                    'Shipping Country': ship.country || '',
                    'Billing Name': [bill.firstName, bill.lastName].filter(Boolean).join(' '),
                    'Billing Street': [bill.street, bill.address2].filter(Boolean).join(', '),
                    'Billing City': bill.city || '',
                    'Billing State': bill.state || '',
                    'Billing Zip': bill.zip || '',
                    'Billing Country': bill.country || '',
                };
                const createdCustomer = await new Promise((resolve, reject) => {
                    this.base(this.customersTable).create([{ fields: customerFields }], (err, records) => {
                        if (err)
                            reject(err);
                        else
                            resolve(records === null || records === void 0 ? void 0 : records[0]);
                    });
                });
                customerRecordId = createdCustomer.id;
                this.logger.log(`Created new customer: ${customerRecordId}`);
            }
            const items = Array.isArray(order.items) ? order.items : [];
            const skus = items.map((i) => i.sku).filter(Boolean);
            let skuToMpnMap = new Map();
            if (skus.length > 0) {
                const products = await this.productRepository.find({
                    where: { sku: (0, typeorm_2.In)(skus) },
                    select: ['sku', 'schema']
                });
                products.forEach(p => {
                    var _a, _b;
                    const mpn = ((_a = p.schema) === null || _a === void 0 ? void 0 : _a.mpn) || ((_b = p.schema) === null || _b === void 0 ? void 0 : _b.__schema_mpn) || '';
                    if (mpn)
                        skuToMpnMap.set(p.sku, mpn);
                });
            }
            const mpnList = [];
            const itemDetails = [];
            items.forEach((item) => {
                const qty = item.quantity || 1;
                const sku = item.sku || 'N/A';
                const name = item.name || 'Unknown Item';
                itemDetails.push(`${qty}x [${sku}] ${name}`);
                const mpn = skuToMpnMap.get(sku);
                if (mpn)
                    mpnList.push(mpn);
            });
            this.logger.log(`Creating order record linked to Customer ${customerRecordId}...`);
            const orderFields = {
                'Order ID': order.friendlyId,
                'Status': order.status,
                'Date': order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                'Total Amount': Number(order.total),
                'Payment Method': order.paymentMethod,
                'Items': itemDetails.join('\n'),
                'Part Number': Array.from(new Set(mpnList)).join(', '),
                'Customer': [customerRecordId]
            };
            await new Promise((resolve, reject) => {
                this.base(this.ordersTable).create([{ fields: orderFields }], async (err, records) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const record = records === null || records === void 0 ? void 0 : records[0];
                        if (record) {
                            order.airtableRecordId = record.id;
                            await this.orderRepository.save(order);
                        }
                        resolve(records);
                    }
                });
            });
            this.logger.log(`Successfully synced Order ${order.id} to Airtable.`);
        }
        catch (error) {
            this.logger.error(`Failed to sync order to Airtable: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
    async createLeadRecord(data) {
        if (!this.formsBase) {
            this.logger.warn('Airtable Forms Base not configured or failed to initialize.');
            return;
        }
        try {
            const fields = {
                'Form Type': data.type,
                'Name': data.name || 'Unknown',
                'Email': data.email,
                'Phone': data.phone || '',
                'Company': data.company || '',
                'Notes': data.notes || data.message || '',
                'Submission Date': new Date().toISOString().split('T')[0],
                'Reference Number': data.referenceNumber,
                'Status': 'New',
                'Details': data.parts || '',
                'Timeline': data.timeline || '',
                'Target Part Number': data.partNumber || '',
            };
            if (data.competitorPrice) {
                fields['Competitor Price'] = Number(data.competitorPrice);
            }
            if (data.fileUrl) {
                fields['File Attachment'] = [{ url: data.fileUrl }];
            }
            this.logger.log(`Attempting to sync lead to table "${this.leadsTable}"...`);
            await new Promise((resolve, reject) => {
                this.formsBase.table(this.leadsTable).create([{ fields }], (err, records) => {
                    var _a;
                    if (err) {
                        this.logger.error(`Error creating Airtable Lead in table "${this.leadsTable}". Check Base ID and Field Names. Error: ${err.message}`, err);
                        reject(err);
                    }
                    else {
                        this.logger.log(`Created Lead in Airtable: ${(_a = records === null || records === void 0 ? void 0 : records[0]) === null || _a === void 0 ? void 0 : _a.id}`);
                        resolve(records);
                    }
                });
            });
        }
        catch (error) {
            this.logger.error(`Failed to sync lead to Airtable`, error);
            throw error;
        }
    }
};
exports.AirtableService = AirtableService;
exports.AirtableService = AirtableService = AirtableService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(2, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AirtableService);
//# sourceMappingURL=airtable.service.js.map