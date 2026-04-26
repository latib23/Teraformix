import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Order, OrderStatus, PaymentMethod } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Company } from '../companies/entities/company.entity';
import { User, UserRole } from '../users/entities/user.entity';
import Stripe from 'stripe';
import { NotificationsService } from '../notifications/notifications.service';
import { Product } from '../products/entities/product.entity';
import { ShippingService } from '../shipping/shipping.service';
import { AirtableService } from './airtable.service';
import { XeroService } from './xero.service';
import { sanitizePlainText } from '../lib/security';

@Injectable()
export class OrdersService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private shippingService: ShippingService,
    private airtableService: AirtableService,
    private xeroService: XeroService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
        maxNetworkRetries: 2,
        timeout: 30000,
      });
    }
  }

  // ... (keeping existing methods)

  async createPaymentIntent(amountInCents: number, currency: string, metadata: Record<string, any> = {}) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }
    const amount = Math.round(Number(amountInCents || 0));
    if (!Number.isSafeInteger(amount) || amount < 50) {
      throw new BadRequestException('Invalid payment amount');
    }
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        capture_method: 'manual',
        automatic_payment_methods: { enabled: true },
        metadata,
      });
      return intent;
    } catch (e: any) {
      const msg = String(e?.message || 'Stripe request failed');
      throw new BadRequestException(msg);
    }
  }

  async getPaymentIntent(paymentIntentId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }
    const id = String(paymentIntentId || '').trim();
    if (!id.startsWith('pi_')) {
      throw new BadRequestException('Invalid payment intent');
    }
    try {
      return await this.stripe.paymentIntents.retrieve(id);
    } catch (e: any) {
      throw new BadRequestException(String(e?.message || 'Unable to verify payment'));
    }
  }

  async calculateAmountCents(
    items: Array<{ sku: string; quantity: number }>,
    address: { postalCode: string; country: string; city: string; state: string },
    serviceCode?: string,
  ): Promise<number> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Items are required');
    }
    const skus = items.map(i => String(i.sku || '').trim()).filter(Boolean);
    if (skus.length !== items.length) {
      throw new BadRequestException('Every order item must include a SKU');
    }
    const products = await this.productRepository.find({ where: { sku: In(skus) } });
    const priceBySku = new Map(products.map(p => [p.sku, Number(p.basePrice)]));
    let subtotal = 0;
    for (const i of items) {
      const sku = String(i.sku || '').trim();
      const price = priceBySku.get(sku);
      if (!Number.isFinite(price)) throw new BadRequestException(`Unknown SKU: ${sku}`);
      const qty = Number(i.quantity);
      if (!Number.isSafeInteger(qty) || qty < 1 || qty > 1000) {
        throw new BadRequestException(`Invalid quantity for SKU: ${sku}`);
      }
      subtotal += price * qty;
    }

    let shipmentCost = 0;
    if (address && address.postalCode && address.country && address.city && address.state) {
      try {
        const rates = await this.shippingService.getRates(
          { postalCode: address.postalCode, country: address.country, city: address.city, state: address.state },
          items.map(i => ({ sku: i.sku, quantity: i.quantity, weight: '1 lb' })),
        );
        if (serviceCode) {
          const sel = rates.find((r: any) => r.serviceCode === serviceCode);
          if (sel) shipmentCost = Number(sel.shipmentCost || 0);
        }
      } catch (_e) { void _e; }
    }

    const total = subtotal + shipmentCost;
    const cents = Math.round(total * 100);
    if (!Number.isSafeInteger(cents) || cents < 50) {
      throw new BadRequestException('Invalid order total');
    }
    return cents;
  }

  private async buildServerPricedItems(items: Array<{ sku: string; quantity: number }>) {
    const normalized = items.map((i) => ({
      sku: String(i.sku || '').trim(),
      quantity: Number(i.quantity),
    }));
    const skus = normalized.map((i) => i.sku);
    const products = await this.productRepository.find({ where: { sku: In(skus) } });
    const productBySku = new Map(products.map((p) => [p.sku, p]));

    return normalized.map((item) => {
      const product = productBySku.get(item.sku);
      if (!product) throw new BadRequestException(`Unknown SKU: ${item.sku}`);
      return {
        id: product.id,
        sku: sanitizePlainText(product.sku, 120),
        name: sanitizePlainText(product.name, 200),
        price: Number(product.basePrice),
        basePrice: Number(product.basePrice),
        quantity: item.quantity,
      };
    });
  }

  private getOrderRateAddress(shippingAddress: any) {
    const ship = shippingAddress || {};
    return {
      postalCode: String(ship.postalCode || ship.zip || '').trim(),
      country: String(ship.country || 'US').trim(),
      city: String(ship.city || '').trim(),
      state: String(ship.state || '').trim(),
    };
  }

  private sanitizeOrderAddress(input: any) {
    const allowed = [
      'firstName',
      'lastName',
      'company',
      'street',
      'city',
      'state',
      'zip',
      'postalCode',
      'country',
      'phone',
      'email',
      'shippingCost',
      'shipmentService',
      'shipmentServiceCode',
    ];
    const output: Record<string, any> = {};

    for (const key of allowed) {
      const value = input?.[key];
      if (value === undefined || value === null) continue;
      if (key === 'shippingCost') {
        const cost = Number(value);
        if (Number.isFinite(cost) && cost >= 0) output[key] = cost;
        continue;
      }
      const limit = key === 'email' ? 254 : key === 'street' ? 200 : 120;
      const text = sanitizePlainText(value, limit);
      if (text) output[key] = key === 'email' ? text.toLowerCase() : text;
    }

    return output;
  }

  async create(createOrderDto: CreateOrderDto, creatorId?: string): Promise<Order> {
    let company: Company | null = null;
    let salesperson: User | null = null;
    let creator: User | null = null;

    if (createOrderDto.companyId) {
      company = await this.companyRepository.findOneBy({ id: createOrderDto.companyId });
    }

    if (creatorId) {
      creator = await this.userRepository.findOneBy({ id: creatorId });
      if (!creator) throw new NotFoundException('Creator user not found');
      // Only assign if the creator is a salesperson
      if (creator.role === UserRole.SALESPERSON) {
        salesperson = creator;
      }
    }

    const requestedStatus =
      creator && [UserRole.SUPER_ADMIN, UserRole.SALESPERSON].includes(creator.role)
        ? createOrderDto.status
        : undefined;
    const shippingAddress = this.sanitizeOrderAddress(createOrderDto.shippingAddress || {});
    const billingAddress = this.sanitizeOrderAddress(createOrderDto.billingAddress || {});
    const serviceCode = String(
      (shippingAddress as any).shipmentServiceCode ||
      (shippingAddress as any).serviceCode ||
      (createOrderDto as any).serviceCode ||
      '',
    ).trim() || undefined;
    const expectedAmountCents = await this.calculateAmountCents(
      createOrderDto.items,
      this.getOrderRateAddress(shippingAddress),
      serviceCode,
    );
    const serverItems = await this.buildServerPricedItems(createOrderDto.items);
    const serverTotal = Number((expectedAmountCents / 100).toFixed(2));

    const order = this.orderRepository.create({
      items: serverItems,
      total: serverTotal,
      paymentMethod: createOrderDto.paymentMethod,
      poNumber: createOrderDto.poNumber ? sanitizePlainText(createOrderDto.poNumber, 80) : undefined,
      shippingAddress,
      billingAddress,
      company,
      salesperson,
      status: requestedStatus || OrderStatus.PROCESSING,
    });

    if (createOrderDto.paymentMethod === PaymentMethod.STRIPE) {
      const intent = await this.getPaymentIntent((createOrderDto as any).paymentIntentId);
      if (intent.status !== 'requires_capture' && intent.status !== 'succeeded') {
        throw new BadRequestException('Stripe payment has not been authorized');
      }
      if (intent.currency !== 'usd') {
        throw new BadRequestException('Unsupported payment currency');
      }
      if (intent.amount < expectedAmountCents) {
        throw new BadRequestException('Stripe payment amount does not match the order total');
      }
      order.total = Number((intent.amount / 100).toFixed(2));
    } else if (createOrderDto.paymentMethod === PaymentMethod.PO) {
      if (!createOrderDto.poNumber) {
        throw new BadRequestException('PO Number is required for Purchase Order payments');
      }
      order.status = requestedStatus || OrderStatus.PENDING_APPROVAL;
    } else if (createOrderDto.paymentMethod === PaymentMethod.BANK_TRANSFER) {
      // Manual payment method; move to pending approval and await confirmation
      order.status = requestedStatus || OrderStatus.PENDING_APPROVAL;
    }

    // Validate customer email in shipping address
    const rawEmail = String((order as any)?.shippingAddress?.email || '').trim();
    const emailOk = !!rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);
    if (!emailOk) {
      throw new BadRequestException('A valid customer email is required');
    }

    const savedOrder = await this.orderRepository.save(order);

    // Sync to Airtable (Non-blocking)
    this.airtableService.createOrderRecord(savedOrder).catch(err => {
      // Already logged in service
    });

    // Sync to Xero (Non-blocking)
    this.xeroService.syncOrder(savedOrder).catch(err => {
      // Already logged in service
    });

    try {
      const ref = savedOrder.friendlyId;
      const subject = `Order Confirmation ${ref}`;
      const items = Array.isArray(savedOrder.items) ? savedOrder.items : [];
      const rows = items.map((i: any) => {
        const qty = Math.max(1, Number(i.quantity || 1));
        const price = Number(i.price || i.basePrice || 0);
        const line = qty * price;
        const name = String(i.name || i.sku || '').trim();
        const sku = String(i.sku || '').trim();
        return { name, sku, qty, price, line };
      });
      const subtotal = rows.reduce((sum: number, r: any) => sum + r.line, 0); // Added types to reduce
      const total = Number(savedOrder.total || subtotal);
      const ship = savedOrder.shippingAddress || {};
      const shippingCost = Number((ship as any).shippingCost || 0);
      const shipmentService = String((ship as any).shipmentService || '');
      const bill = savedOrder.billingAddress || {};
      const customerEmail = String(ship?.email || '').trim();
      const customerName = [ship?.firstName, ship?.lastName].filter(Boolean).join(' ').trim();
      const trackingNumber = String((savedOrder as any).trackingNumber || '').trim();
      const carrier = String((savedOrder as any).carrier || '').trim();
      const trackingUrl = this.getTrackingUrl(carrier, trackingNumber);
      const pm = savedOrder.paymentMethod;
      const po = String((savedOrder as any).poNumber || '').trim();
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
            <div style="font-weight:800;letter-spacing:0.04em;font-size:16px">Teraformix</div>
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
                  ${rows.map((r: any) => `
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
              <div style="font-size:14px;color:${text}">Questions? Call (888) 787-4795 or email <a href="mailto:sales@teraformix.com" style="color:${accent};text-decoration:none">sales@teraformix.com</a>.</div>
            </div>
          </div>
          <div style="background:${lightNavy};color:#cbd5e1;padding:16px 24px;text-align:center;font-size:12px">© ${new Date().getFullYear()} Teraformix</div>
        </div>
      </div>`;
      await this.notificationsService.sendEmail(subject, html, [customerEmail]);
    } catch (_e) { void _e; }

    return savedOrder;
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['company', 'salesperson'],
      order: { createdAt: 'DESC' }
    });
  }

  async findBySalesperson(salespersonId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { salesperson: { id: salespersonId } },
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByBuyerEmail(email: string): Promise<Order[]> {
    const all = await this.orderRepository.find({
      relations: ['company', 'salesperson'],
      order: { createdAt: 'DESC' },
    });
    const target = (email || '').toLowerCase();
    return all.filter(o => {
      const shipEmail = (o.shippingAddress?.email || '').toLowerCase();
      return shipEmail && target && shipEmail === target;
    });
  }

  async findAccessible(id: string, user: { userId: string; role: string; email?: string }): Promise<Order | null> {
    const order = await this.orderRepository.findOne({ where: { id }, relations: ['company', 'salesperson'] });
    if (!order) return null;
    if (user.role === 'SUPER_ADMIN') return order;
    if (user.role === 'SALESPERSON') {
      if (order.salesperson && order.salesperson.id === user.userId) return order;
      return null;
    }
    if (user.role === 'BUYER') {
      const targetEmail = (order.shippingAddress)?.email?.toLowerCase() || '';
      const userEmail = (user as any)?.email?.toLowerCase() || '';
      if (targetEmail && userEmail && targetEmail === userEmail) return order;
      return null;
    }
    return null;
  }

  private getTrackingUrl(carrier: string, trackingNumber: string): string | null {
    const code = (carrier || '').toLowerCase();
    const tn = encodeURIComponent(trackingNumber || '');
    if (!tn) return null;
    if (code.includes('fedex')) return `https://www.fedex.com/fedextrack/?tracknumbers=${tn}`;
    if (code.includes('ups')) return `https://www.ups.com/track?loc=en_US&tracknum=${tn}`;
    if (code.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tn}`;
    return null;
  }

  async updateOrder(id: string, patch: Partial<Order>, user: { userId: string; role: string; email?: string }): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const prevTracking = order.trackingNumber || '';
    const prevCarrier = order.carrier || '';

    if (patch.status) order.status = patch.status as OrderStatus;
    if (typeof patch.trackingNumber === 'string') order.trackingNumber = patch.trackingNumber;
    if (typeof patch.carrier === 'string') order.carrier = patch.carrier;

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
        const customerEmail = String(updated?.shippingAddress?.email || '').trim();
        await this.notificationsService.sendEmail(subject, html, customerEmail ? [customerEmail] : undefined);
      } catch (_e) { void _e; }
    }

    return updated;
  }



  async syncToAirtable(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['company', 'salesperson']
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    try {
      await this.airtableService.createOrderRecord(order);
    } catch (error) {
      throw new BadRequestException(`Airtable sync failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  async syncToXero(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['company', 'salesperson']
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    try {
      await this.xeroService.syncOrder(order);
    } catch (error) {
      throw new BadRequestException(`Xero sync failed: ${error instanceof Error ? error.message : error}`);
    }
  }
}
