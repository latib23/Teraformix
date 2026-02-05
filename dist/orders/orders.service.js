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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const order_entity_1 = require("./entities/order.entity");
const company_entity_1 = require("../companies/entities/company.entity");
const user_entity_1 = require("../users/entities/user.entity");
const stripe_1 = __importDefault(require("stripe"));
const notifications_service_1 = require("../notifications/notifications.service");
const product_entity_1 = require("../products/entities/product.entity");
const shipping_service_1 = require("../shipping/shipping.service");
const airtable_service_1 = require("./airtable.service");
const xero_service_1 = require("./xero.service");
let OrdersService = class OrdersService {
    constructor(orderRepository, companyRepository, userRepository, productRepository, configService, privatenotificationsService, notificationsService, shippingService, airtableService, xeroService) {
        this.orderRepository = orderRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.configService = configService;
        this.notificationsService = notificationsService;
        this.shippingService = shippingService;
        this.airtableService = airtableService;
        this.xeroService = xeroService;
        const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
        if (stripeKey) {
            this.stripe = new stripe_1.default(stripeKey, {
                apiVersion: '2023-10-16',
                maxNetworkRetries: 2,
                timeout: 30000,
            });
        }
    }
    async createPaymentIntent(amountInCents, currency, metadata = {}) {
        if (!this.stripe) {
            throw new common_1.BadRequestException('Stripe not configured');
        }
        try {
            const intent = await this.stripe.paymentIntents.create({
                amount: amountInCents,
                currency,
                capture_method: 'manual',
                automatic_payment_methods: { enabled: true },
                metadata,
            });
            return intent;
        }
        catch (e) {
            const msg = String((e === null || e === void 0 ? void 0 : e.message) || 'Stripe request failed');
            throw new common_1.BadRequestException(msg);
        }
    }
    async calculateAmountCents(items, address, serviceCode) {
        if (!Array.isArray(items) || items.length === 0) {
            throw new common_1.BadRequestException('Items are required');
        }
        const skus = items.map(i => i.sku);
        const products = await this.productRepository.find({ where: { sku: (0, typeorm_2.In)(skus) } });
        const priceBySku = new Map(products.map(p => [p.sku, Number(p.basePrice)]));
        let subtotal = 0;
        for (const i of items) {
            const price = priceBySku.get(i.sku);
            if (!price)
                throw new common_1.BadRequestException(`Unknown SKU: ${i.sku}`);
            const qty = Math.max(1, Number(i.quantity || 1));
            subtotal += price * qty;
        }
        let shipmentCost = 0;
        if (address && address.postalCode && address.country && address.city && address.state) {
            try {
                const rates = await this.shippingService.getRates({ postalCode: address.postalCode, country: address.country, city: address.city, state: address.state }, items.map(i => ({ sku: i.sku, quantity: i.quantity, weight: '1 lb' })));
                if (serviceCode) {
                    const sel = rates.find((r) => r.serviceCode === serviceCode);
                    if (sel)
                        shipmentCost = Number(sel.shipmentCost || 0);
                }
            }
            catch (_e) {
                void _e;
            }
        }
        const total = subtotal + shipmentCost;
        return Math.round(total * 100);
    }
    async create(createOrderDto, creatorId) {
        var _a;
        let company = null;
        let salesperson = null;
        if (createOrderDto.companyId) {
            company = await this.companyRepository.findOneBy({ id: createOrderDto.companyId });
        }
        if (creatorId) {
            const creator = await this.userRepository.findOneBy({ id: creatorId });
            if (!creator)
                throw new common_1.NotFoundException('Creator user not found');
            if (creator.role === 'SALESPERSON') {
                salesperson = creator;
            }
        }
        const order = this.orderRepository.create(Object.assign(Object.assign({}, createOrderDto), { company,
            salesperson, status: createOrderDto.status || order_entity_1.OrderStatus.PROCESSING }));
        if (createOrderDto.paymentMethod === order_entity_1.PaymentMethod.STRIPE) {
        }
        else if (createOrderDto.paymentMethod === order_entity_1.PaymentMethod.PO) {
            if (!createOrderDto.poNumber) {
                throw new common_1.BadRequestException('PO Number is required for Purchase Order payments');
            }
            order.status = createOrderDto.status || order_entity_1.OrderStatus.PENDING_APPROVAL;
        }
        else if (createOrderDto.paymentMethod === order_entity_1.PaymentMethod.BANK_TRANSFER) {
            order.status = createOrderDto.status || order_entity_1.OrderStatus.PENDING_APPROVAL;
        }
        const rawEmail = String(((_a = order === null || order === void 0 ? void 0 : order.shippingAddress) === null || _a === void 0 ? void 0 : _a.email) || '').trim();
        const emailOk = !!rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);
        if (!emailOk) {
            throw new common_1.BadRequestException('A valid customer email is required');
        }
        const savedOrder = await this.orderRepository.save(order);
        this.airtableService.createOrderRecord(savedOrder).catch(err => {
        });
        this.xeroService.syncOrder(savedOrder).catch(err => {
        });
        try {
            const ref = savedOrder.friendlyId;
            const subject = `Order Confirmation ${ref}`;
            const items = Array.isArray(savedOrder.items) ? savedOrder.items : [];
            const rows = items.map((i) => {
                const qty = Math.max(1, Number(i.quantity || 1));
                const price = Number(i.price || i.basePrice || 0);
                const line = qty * price;
                const name = String(i.name || i.sku || '').trim();
                const sku = String(i.sku || '').trim();
                return { name, sku, qty, price, line };
            });
            const subtotal = rows.reduce((sum, r) => sum + r.line, 0);
            const total = Number(savedOrder.total || subtotal);
            const ship = savedOrder.shippingAddress || {};
            const shippingCost = Number(ship.shippingCost || 0);
            const shipmentService = String(ship.shipmentService || '');
            const bill = savedOrder.billingAddress || {};
            const customerEmail = String((ship === null || ship === void 0 ? void 0 : ship.email) || '').trim();
            const customerName = [ship === null || ship === void 0 ? void 0 : ship.firstName, ship === null || ship === void 0 ? void 0 : ship.lastName].filter(Boolean).join(' ').trim();
            const trackingNumber = String(savedOrder.trackingNumber || '').trim();
            const carrier = String(savedOrder.carrier || '').trim();
            const trackingUrl = this.getTrackingUrl(carrier, trackingNumber);
            const pm = savedOrder.paymentMethod;
            const po = String(savedOrder.poNumber || '').trim();
            const date = new Date(savedOrder.createdAt).toLocaleDateString('en-US');
            const navy = '#0a1f44';
            const lightNavy = '#122b5f';
            const accent = '#ea580c';
            const gray = '#f7fafc';
            const text = '#1f2937';
            const muted = '#6b7280';
            const html = `
      <div style="background:${gray};padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:${navy};padding:20px 24px;color:#fff">
            <div style="font-weight:800;letter-spacing:0.04em;font-size:16px">SERVER TECH CENTRAL</div>
            <div style="margin-top:4px;font-size:13px;color:#cbd5e1">Enterprise Hardware | Order Confirmation</div>
          </div>
          <div style="padding:24px">
            <h1 style="margin:0;font-size:20px;line-height:28px;color:${text}">Thank you${customerName ? `, ${customerName}` : ''}!</h1>
            <p style="margin:8px 0 16px;color:${muted};font-size:14px">Your order has been received. A confirmation has been sent to ${customerEmail || 'your email'}.</p>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
              <div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Order</div>
                <div style="font-size:14px;color:${text}"><strong>${ref}</strong></div>
                <div style="font-size:12px;color:${muted}">ID: ${savedOrder.id}</div>
                <div style="font-size:12px;color:${muted}">Date: ${date}</div>
                <div style="font-size:12px;color:${muted}">Status: ${savedOrder.status}</div>
              </div>
              <div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Payment</div>
                <div style="font-size:14px;color:${text}">${pm === 'PO' ? `Purchase Order` : pm === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Credit Card'}</div>
                ${pm === 'PO' && po ? `<div style="font-size:12px;color:${muted}">PO #: <strong>${po}</strong></div>` : ''}
                <div style="font-size:12px;color:${muted}">Total: <strong style="color:${text}">$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
              <div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Shipping Address</div>
                <div style="font-size:14px;color:${text}">${[ship.firstName, ship.lastName].filter(Boolean).join(' ')}</div>
                <div style="font-size:14px;color:${text}">${ship.company || ''}</div>
                <div style="font-size:14px;color:${text}">${ship.street || ''}</div>
                <div style="font-size:14px;color:${text}">${[ship.city, ship.state, ship.zip].filter(Boolean).join(', ')}</div>
                <div style="font-size:12px;color:${muted}">${ship.phone || ''}</div>
                <div style="font-size:12px;color:${muted}">${ship.email || ''}</div>
              </div>
              <div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Billing Address</div>
                <div style="font-size:14px;color:${text}">${[bill.firstName, bill.lastName].filter(Boolean).join(' ')}</div>
                <div style="font-size:14px;color:${text}">${bill.company || ''}</div>
                <div style="font-size:14px;color:${text}">${bill.street || ''}</div>
                <div style="font-size:14px;color:${text}">${[bill.city, bill.state, bill.zip].filter(Boolean).join(', ')}</div>
                <div style="font-size:12px;color:${muted}">${bill.phone || ''}</div>
                <div style="font-size:12px;color:${muted}">${bill.email || ''}</div>
              </div>
            </div>

            <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
                <thead>
                  <tr style="background:${gray};color:${muted};text-transform:uppercase;font-size:12px">
                    <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb">Product</th>
                    <th style="text-align:center;padding:12px;border-bottom:1px solid #e5e7eb;width:80px">Qty</th>
                    <th style="text-align:right;padding:12px;border-bottom:1px solid #e5e7eb;width:120px">Price</th>
                    <th style="text-align:right;padding:12px;border-bottom:1px solid #e5e7eb;width:120px">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.map((r) => `
                    <tr>
                      <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:${text}">
                        <div style="font-weight:600">${r.name}</div>
                        <div style="font-size:12px;color:${muted}">${r.sku}</div>
                      </td>
                      <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:${text};text-align:center">${r.qty}</td>
                      <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:${text};text-align:right">$${r.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:${text};text-align:right">$${r.line.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding:12px;text-align:right;color:${muted};font-weight:700;border-top:1px solid #e5e7eb">Subtotal:</td>
                    <td style="padding:12px;text-align:right;color:${text};font-weight:700;border-top:1px solid #e5e7eb">$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td colspan="3" style="padding:12px;text-align:right;color:${muted};font-weight:700">Shipping${shipmentService ? ` (${shipmentService})` : ''}:</td>
                    <td style="padding:12px;text-align:right;color:${text};font-weight:700">$${shippingCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td colspan="3" style="padding:12px;text-align:right;color:${muted};font-weight:700">Total:</td>
                    <td style="padding:12px;text-align:right;color:${text};font-weight:700">$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            ${trackingNumber ? `<div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:16px">
              <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Shipment</div>
              <div style="font-size:14px;color:${text}">Carrier: <strong>${carrier}</strong></div>
              <div style="font-size:14px;color:${text}">Tracking #: <strong>${trackingNumber}</strong></div>
              ${trackingUrl ? `<a href="${trackingUrl}" style="display:inline-block;margin-top:8px;background:${accent};color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700">Track Shipment</a>` : ''}
            </div>` : `<div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:16px">
              <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Shipment</div>
              <div style="font-size:14px;color:${text}">Tracking details will be provided when your order ships.</div>
            </div>`}

            <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px">
              <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Support</div>
              <div style="font-size:14px;color:${text}">Questions? Call (888) 787-4795 or email <a href="mailto:sales@servertechcentral.com" style="color:${accent};text-decoration:none">sales@servertechcentral.com</a>.</div>
            </div>
          </div>
          <div style="background:${lightNavy};color:#cbd5e1;padding:16px 24px;text-align:center;font-size:12px">© ${new Date().getFullYear()} Server Tech Central</div>
        </div>
      </div>`;
            await this.notificationsService.sendEmail(subject, html, [customerEmail]);
        }
        catch (_e) {
            void _e;
        }
        return savedOrder;
    }
    async findAll() {
        return this.orderRepository.find({
            relations: ['company', 'salesperson'],
            order: { createdAt: 'DESC' }
        });
    }
    async findBySalesperson(salespersonId) {
        return this.orderRepository.find({
            where: { salesperson: { id: salespersonId } },
            relations: ['company'],
            order: { createdAt: 'DESC' },
        });
    }
    async findByBuyerEmail(email) {
        const all = await this.orderRepository.find({
            relations: ['company', 'salesperson'],
            order: { createdAt: 'DESC' },
        });
        const target = (email || '').toLowerCase();
        return all.filter(o => {
            var _a;
            const shipEmail = (((_a = o.shippingAddress) === null || _a === void 0 ? void 0 : _a.email) || '').toLowerCase();
            return shipEmail && target && shipEmail === target;
        });
    }
    async findAccessible(id, user) {
        var _a, _b, _c;
        const order = await this.orderRepository.findOne({ where: { id }, relations: ['company', 'salesperson'] });
        if (!order)
            return null;
        if (user.role === 'SUPER_ADMIN')
            return order;
        if (user.role === 'SALESPERSON') {
            if (order.salesperson && order.salesperson.id === user.userId)
                return order;
            return null;
        }
        if (user.role === 'BUYER') {
            const targetEmail = ((_b = (_a = (order.shippingAddress)) === null || _a === void 0 ? void 0 : _a.email) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
            const userEmail = ((_c = user === null || user === void 0 ? void 0 : user.email) === null || _c === void 0 ? void 0 : _c.toLowerCase()) || '';
            if (targetEmail && userEmail && targetEmail === userEmail)
                return order;
            return null;
        }
        return null;
    }
    getTrackingUrl(carrier, trackingNumber) {
        const code = (carrier || '').toLowerCase();
        const tn = encodeURIComponent(trackingNumber || '');
        if (!tn)
            return null;
        if (code.includes('fedex'))
            return `https://www.fedex.com/fedextrack/?tracknumbers=${tn}`;
        if (code.includes('ups'))
            return `https://www.ups.com/track?loc=en_US&tracknum=${tn}`;
        if (code.includes('usps'))
            return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tn}`;
        return null;
    }
    async updateOrder(id, patch, user) {
        var _a;
        const order = await this.orderRepository.findOne({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const prevTracking = order.trackingNumber || '';
        const prevCarrier = order.carrier || '';
        if (patch.status)
            order.status = patch.status;
        if (typeof patch.trackingNumber === 'string')
            order.trackingNumber = patch.trackingNumber;
        if (typeof patch.carrier === 'string')
            order.carrier = patch.carrier;
        const updated = await this.orderRepository.save(order);
        const trackingChanged = (updated.trackingNumber || '') !== prevTracking || (updated.carrier || '') !== prevCarrier;
        if (trackingChanged && (updated.trackingNumber || '').trim()) {
            try {
                const link = this.getTrackingUrl(updated.carrier || '', updated.trackingNumber || '');
                const ref = updated.friendlyId;
                const subject = `Order ${ref} Tracking Updated`;
                const html = `
          <h1>Tracking Update</h1>
          <p><strong>Reference:</strong> ${ref}</p>
          <p><strong>Order ID:</strong> ${updated.id}</p>
          <p><strong>Carrier:</strong> ${updated.carrier || 'N/A'}</p>
          <p><strong>Tracking #:</strong> ${updated.trackingNumber}</p>
          ${link ? `<p><a href="${link}" target="_blank">Track Shipment</a></p>` : ''}
        `;
                const customerEmail = String(((_a = updated === null || updated === void 0 ? void 0 : updated.shippingAddress) === null || _a === void 0 ? void 0 : _a.email) || '').trim();
                await this.notificationsService.sendEmail(subject, html, customerEmail ? [customerEmail] : undefined);
            }
            catch (_e) {
                void _e;
            }
        }
        return updated;
    }
    async syncToAirtable(orderId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['company', 'salesperson']
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        try {
            await this.airtableService.createOrderRecord(order);
        }
        catch (error) {
            throw new common_1.BadRequestException(`Airtable sync failed: ${error instanceof Error ? error.message : error}`);
        }
    }
    async syncToXero(orderId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['company', 'salesperson']
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        try {
            await this.xeroService.syncOrder(order);
        }
        catch (error) {
            throw new common_1.BadRequestException(`Xero sync failed: ${error instanceof Error ? error.message : error}`);
        }
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        notifications_service_1.NotificationsService,
        notifications_service_1.NotificationsService,
        shipping_service_1.ShippingService,
        airtable_service_1.AirtableService,
        xero_service_1.XeroService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map