
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import Airtable from 'airtable';
import { Order } from './entities/order.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class AirtableService {
    private readonly logger = new Logger(AirtableService.name);
    private base: Airtable.Base;
    private formsBase: Airtable.Base;
    private customersTable: string;
    private ordersTable: string;
    private leadsTable: string;

    constructor(
        private configService: ConfigService,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
    ) {
        const apiKey = this.configService.get<string>('AIRTABLE_API_KEY');
        const baseId = this.configService.get<string>('AIRTABLE_BASE_ID');
        const formsBaseId = this.configService.get<string>('AIRTABLE_FORMS_BASE_ID') || 'app3aiGNMpvuzDsSQ'; // User provided ID
        this.customersTable = this.configService.get<string>('AIRTABLE_CUSTOMERS_TABLE') || 'Customers';
        this.ordersTable = this.configService.get<string>('AIRTABLE_ORDERS_TABLE') || 'Orders';
        this.leadsTable = this.configService.get<string>('AIRTABLE_FORMS_TABLE_NAME') || 'Leads';

        if (apiKey) {
            Airtable.configure({ apiKey });
            if (baseId) {
                this.base = Airtable.base(baseId);
            }
            if (formsBaseId) {
                if (!formsBaseId.startsWith('app')) {
                    this.logger.error(`Invalid Airtable Base ID format: "${formsBaseId}". Base IDs usually start with 'app'. Please replace the Name with the ID.`);
                }
                try {
                    this.formsBase = Airtable.base(formsBaseId);
                    this.logger.log(`Initialized Forms Airtable Base: ${formsBaseId.slice(0, 8)}...`);
                } catch (e) {
                    this.logger.error('Invalid Forms Base ID', e);
                }
            } else {
                // Fallback if user put name "STC Leads" but meant ID, or if we need to use same base
                if (baseId) {
                    this.formsBase = Airtable.base(baseId);
                    this.logger.log(`Using Default Base for Forms: ${baseId.slice(0, 8)}...`);
                }
            }
        } else {
            this.logger.warn('Airtable credentials not found. Integration disabled.');
        }
    }

    async createOrderRecord(order: Order): Promise<void> {
        // ... (existing code, unchanged) ...
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

            // 1. Find or Create Customer
            let customerRecordId: string;

            this.logger.log(`Searching for customer ${customerEmail} in Airtable...`);

            // Search for existing customer
            const existingRecords = await new Promise<any[]>((resolve, reject) => {
                this.base(this.customersTable).select({
                    filterByFormula: `{Email} = '${customerEmail}'`,
                    maxRecords: 1
                }).firstPage((err, records) => {
                    if (err) reject(err);
                    else resolve((records as any) || []);
                });
            });

            if (existingRecords.length > 0) {
                customerRecordId = existingRecords[0].id;
                this.logger.log(`Found existing customer: ${customerRecordId}`);
            } else {
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

                const createdCustomer = await new Promise<any>((resolve, reject) => {
                    this.base(this.customersTable).create([{ fields: customerFields }], (err, records) => {
                        if (err) reject(err);
                        else resolve(records?.[0]);
                    });
                });
                customerRecordId = createdCustomer.id;
                this.logger.log(`Created new customer: ${customerRecordId}`);
            }

            // 2. Prepare Order Details (Product Info)
            const items = Array.isArray(order.items) ? order.items : [];
            const skus = items.map((i: any) => i.sku).filter(Boolean);

            // Fetch Products to get MPNs
            let skuToMpnMap = new Map<string, string>();
            if (skus.length > 0) {
                const products = await this.productRepository.find({
                    where: { sku: In(skus) },
                    select: ['sku', 'schema']
                });

                products.forEach(p => {
                    const mpn = p.schema?.mpn || p.schema?.__schema_mpn || '';
                    if (mpn) skuToMpnMap.set(p.sku, mpn);
                });
            }

            const mpnList: string[] = [];
            const itemDetails: string[] = [];

            items.forEach((item: any) => {
                const qty = item.quantity || 1;
                const sku = item.sku || 'N/A';
                const name = item.name || 'Unknown Item';
                itemDetails.push(`${qty}x [${sku}] ${name}`);
                const mpn = skuToMpnMap.get(sku);
                if (mpn) mpnList.push(mpn);
            });

            // 3. Create Order Record
            this.logger.log(`Creating order record linked to Customer ${customerRecordId}...`);

            const orderFields = {
                'Order ID': order.friendlyId,
                'Status': order.status,
                'Date': order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                'Total Amount': Number(order.total),
                'Payment Method': order.paymentMethod,
                'Items': itemDetails.join('\n'),
                'Part Number': Array.from(new Set(mpnList)).join(', '),
                'Customer': [customerRecordId] // Linking to the customer record
            };

            await new Promise((resolve, reject) => {
                this.base(this.ordersTable).create([{ fields: orderFields }], async (err, records) => {
                    if (err) {
                        reject(err);
                    } else {
                        const record = records?.[0];
                        if (record) {
                            order.airtableRecordId = record.id;
                            await this.orderRepository.save(order);
                        }
                        resolve(records);
                    }
                });
            });

            this.logger.log(`Successfully synced Order ${order.id} to Airtable.`);

        } catch (error) {
            this.logger.error(`Failed to sync order to Airtable: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async createLeadRecord(data: any): Promise<void> {
        if (!this.formsBase) {
            this.logger.warn('Airtable Forms Base not configured or failed to initialize.');
            return;
        }

        try {
            const fields: any = {
                'Form Type': data.type,
                'Name': data.name || 'Unknown',
                'Email': data.email,
                'Phone': data.phone || '',
                'Company': data.company || '',
                'Notes': data.notes || data.message || '',
                'Submission Date': new Date().toISOString().split('T')[0],
                'Reference Number': data.referenceNumber,
                'Status': 'New',
                // Specifics
                'Details': data.parts || '',
                'Timeline': data.timeline || '',
                'Target Part Number': data.partNumber || '',
            };

            if (data.competitorPrice) {
                fields['Competitor Price'] = Number(data.competitorPrice);
            }

            // Handle file attachments if URL provided
            if (data.fileUrl) {
                fields['File Attachment'] = [{ url: data.fileUrl }];
            }

            this.logger.log(`Attempting to sync lead to table "${this.leadsTable}"...`);

            await new Promise((resolve, reject) => {
                this.formsBase.table(this.leadsTable).create([{ fields }], (err, records) => {
                    if (err) {
                        this.logger.error(`Error creating Airtable Lead in table "${this.leadsTable}". Check Base ID and Field Names. Error: ${err.message}`, err);
                        reject(err);
                    } else {
                        this.logger.log(`Created Lead in Airtable: ${records?.[0]?.id}`);
                        resolve(records);
                    }
                });
            });
        } catch (error) {
            // Rethrow error so the caller knows it failed (e.g. the manual sync button)
            this.logger.error(`Failed to sync lead to Airtable`, error);
            throw error;
        }
    }
}
