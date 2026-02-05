import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from './entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class XeroService {
    private readonly logger = new Logger(XeroService.name);
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    constructor(
        private configService: ConfigService,
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
    ) { }

    private async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        const clientId = this.configService.get<string>('XERO_CLIENT_ID') || '2163355D601E494E82513B828470B488';
        const clientSecret = this.configService.get<string>('XERO_CLIENT_SECRET');
        const refreshToken = this.configService.get<string>('XERO_REFRESH_TOKEN');

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
        } catch (error) {
            this.logger.error('Failed to refresh Xero access token', error);
            throw error;
        }
    }

    private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) {
        const token = await this.getAccessToken();
        const tenantId = this.configService.get<string>('XERO_TENANT_ID');

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
        } catch (error) {
            this.logger.error(`Request failed to ${endpoint}`, error);
            throw error;
        }
    }

    async syncOrder(order: Order): Promise<void> {
        const clientId = this.configService.get<string>('XERO_CLIENT_ID') || '2163355D601E494E82513B828470B488';
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

            // 1. Find or Create Customer (Contact)
            const contactId = await this.ensureContact(order);

            // 2. Create Invoice
            const invoiceId = await this.createInvoice(order, contactId);

            // 3. Save Xero Invoice ID to Order
            order.xeroInvoiceId = invoiceId;
            await this.orderRepository.save(order);

            this.logger.log(`Successfully synced Order ${order.friendlyId} to Xero (Invoice: ${invoiceId})`);
        } catch (error) {
            this.logger.error(`Failed to sync order ${order.friendlyId} to Xero`, error);
            throw error;
        }
    }

    private async ensureContact(order: Order): Promise<string> {
        const ship = order.shippingAddress || {};
        const email = (ship.email || '').trim();
        const name = [ship.firstName, ship.lastName].filter(Boolean).join(' ');

        if (!email) throw new Error('No email in shipping address');

        // Search for contact by email
        const search = await this.makeRequest(`Contacts?where=EmailAddress=="${email}"`);
        if (search.Contacts && search.Contacts.length > 0) {
            return search.Contacts[0].ContactID;
        }

        // Create contact
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

    private async createInvoice(order: Order, contactId: string): Promise<string> {
        const items = Array.isArray(order.items) ? order.items : [];

        const lineItems = items.map((item: any) => ({
            Description: `${item.name || item.sku || 'Unknown Item'} (SKU: ${item.sku || 'N/A'})`,
            UnitAmount: Number(item.price || item.basePrice || 0),
            Quantity: Number(item.quantity || 1),
            AccountCode: '200' // Sales account code - should be made configurable
        }));

        // Add shipping as a line item if it exists
        const ship = order.shippingAddress || {};
        const shippingCost = Number((ship as any).shippingCost || 0);
        if (shippingCost > 0) {
            lineItems.push({
                Description: `Shipping & Handling (${(ship as any).shipmentService || 'Shipping'})`,
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
                DueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Net 30
                Reference: order.friendlyId,
                LineItems: lineItems,
                Status: 'AUTHORISED'
            }]
        };

        const created = await this.makeRequest('Invoices', 'POST', invoiceData);
        return created.Invoices[0].InvoiceID;
    }
}
