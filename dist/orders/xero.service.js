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
var XeroService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.XeroService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const order_entity_1 = require("./entities/order.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let XeroService = XeroService_1 = class XeroService {
    constructor(configService, orderRepository) {
        this.configService = configService;
        this.orderRepository = orderRepository;
        this.logger = new common_1.Logger(XeroService_1.name);
        this.accessToken = null;
        this.tokenExpiry = 0;
    }
    async getAccessToken() {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }
        const clientId = this.configService.get('XERO_CLIENT_ID') || '2163355D601E494E82513B828470B488';
        const clientSecret = this.configService.get('XERO_CLIENT_SECRET');
        const refreshToken = this.configService.get('XERO_REFRESH_TOKEN');
        if (!clientId || !clientSecret || !refreshToken) {
            throw new Error('Xero credentials not configured');
        }
        const url = 'https://identity.xero.com/connect/token';
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken
                })
            });
            const data = await response.json();
            if (data.error) {
                throw new Error(`Xero OAuth Error: ${data.error}`);
            }
            this.accessToken = data.access_token;
            this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
            return this.accessToken;
        }
        catch (error) {
            this.logger.error('Failed to refresh Xero access token', error);
            throw error;
        }
    }
    async makeRequest(endpoint, method = 'GET', body) {
        const token = await this.getAccessToken();
        const tenantId = this.configService.get('XERO_TENANT_ID');
        if (!tenantId) {
            throw new Error('XERO_TENANT_ID not configured');
        }
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'xero-tenant-id': tenantId,
            'Accept': 'application/json'
        };
        const url = `https://api.xero.com/api.xro/2.0/${endpoint}`;
        try {
            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });
            const data = await response.json();
            if (!response.ok) {
                this.logger.error(`Xero API Error: ${JSON.stringify(data)}`);
                throw new Error(`Xero API Error: ${data.Message || response.statusText}`);
            }
            return data;
        }
        catch (error) {
            this.logger.error(`Request failed to ${endpoint}`, error);
            throw error;
        }
    }
    async syncOrder(order) {
        const clientId = this.configService.get('XERO_CLIENT_ID') || '2163355D601E494E82513B828470B488';
        if (!clientId) {
            this.logger.warn('Xero integration skipped: No credentials');
            return;
        }
        try {
            if (order.xeroInvoiceId) {
                this.logger.warn(`Order ${order.friendlyId} already synced to Xero (${order.xeroInvoiceId})`);
                return;
            }
            this.logger.log(`Syncing Order ${order.friendlyId} to Xero...`);
            const contactId = await this.ensureContact(order);
            const invoiceId = await this.createInvoice(order, contactId);
            order.xeroInvoiceId = invoiceId;
            await this.orderRepository.save(order);
            this.logger.log(`Successfully synced Order ${order.friendlyId} to Xero (Invoice: ${invoiceId})`);
        }
        catch (error) {
            this.logger.error(`Failed to sync order ${order.friendlyId} to Xero`, error);
            throw error;
        }
    }
    async ensureContact(order) {
        const ship = order.shippingAddress || {};
        const email = (ship.email || '').trim();
        const name = [ship.firstName, ship.lastName].filter(Boolean).join(' ');
        if (!email)
            throw new Error('No email in shipping address');
        const search = await this.makeRequest(`Contacts?where=EmailAddress=="${email}"`);
        if (search.Contacts && search.Contacts.length > 0) {
            return search.Contacts[0].ContactID;
        }
        const bill = order.billingAddress || {};
        const contactData = {
            Contacts: [{
                    Name: name || email,
                    EmailAddress: email,
                    Phones: [{
                            PhoneType: 'DEFAULT',
                            PhoneNumber: ship.phone || ''
                        }],
                    Addresses: [
                        {
                            AddressType: 'STREET',
                            AddressLine1: ship.street || '',
                            City: ship.city || '',
                            Region: ship.state || '',
                            PostalCode: ship.zip || '',
                            Country: ship.country || ''
                        },
                        {
                            AddressType: 'POBOX',
                            AddressLine1: bill.street || '',
                            City: bill.city || '',
                            Region: bill.state || '',
                            PostalCode: bill.zip || '',
                            Country: bill.country || ''
                        }
                    ]
                }]
        };
        const created = await this.makeRequest('Contacts', 'POST', contactData);
        return created.Contacts[0].ContactID;
    }
    async createInvoice(order, contactId) {
        const items = Array.isArray(order.items) ? order.items : [];
        const lineItems = items.map((item) => ({
            Description: `${item.name || item.sku || 'Unknown Item'} (SKU: ${item.sku || 'N/A'})`,
            UnitAmount: Number(item.price || item.basePrice || 0),
            Quantity: Number(item.quantity || 1),
            AccountCode: '200'
        }));
        const ship = order.shippingAddress || {};
        const shippingCost = Number(ship.shippingCost || 0);
        if (shippingCost > 0) {
            lineItems.push({
                Description: `Shipping & Handling (${ship.shipmentService || 'Shipping'})`,
                UnitAmount: shippingCost,
                Quantity: 1,
                AccountCode: '200'
            });
        }
        const invoiceData = {
            Invoices: [{
                    Type: 'ACCREC',
                    Contact: { ContactID: contactId },
                    Date: new Date().toISOString().split('T')[0],
                    DueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    Reference: order.friendlyId,
                    LineItems: lineItems,
                    Status: 'AUTHORISED'
                }]
        };
        const created = await this.makeRequest('Invoices', 'POST', invoiceData);
        return created.Invoices[0].InvoiceID;
    }
};
exports.XeroService = XeroService;
exports.XeroService = XeroService = XeroService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository])
], XeroService);
//# sourceMappingURL=xero.service.js.map