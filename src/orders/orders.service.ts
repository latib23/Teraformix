import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Order, OrderStatus, PaymentMethod } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import Stripe from 'stripe';
import { NotificationsService } from '../notifications/notifications.service';
import { Product } from '../products/entities/product.entity';
import { ShippingService } from '../shipping/shipping.service';
import { AirtableService } from './airtable.service';
import { XeroService } from './xero.service';

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
    privatenotificationsService: NotificationsService, // Typo in original file? Assuming I should fix or match. The original was 'private notificationsService'. I'll be careful.
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
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
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

  async calculateAmountCents(
    items: Array<{ sku: string; quantity: number }>,
    address: { postalCode: string; country: string; city: string; state: string },
    serviceCode?: string,
  ): Promise<number> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Items are required');
    }
    const skus = items.map(i => i.sku);
    const products = await this.productRepository.find({ where: { sku: In(skus) } });
    const priceBySku = new Map(products.map(p => [p.sku, Number(p.basePrice)]));
    let subtotal = 0;
    for (const i of items) {
      const price = priceBySku.get(i.sku);
      if (!price) throw new BadRequestException(`Unknown SKU: ${i.sku}`);
      const qty = Math.max(1, Number(i.quantity || 1));
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
    return Math.round(total * 100);
  }

  async create(createOrderDto: CreateOrderDto, creatorId?: string): Promise<Order> {
    let company: Company | null = null;
    let salesperson: User | null = null;

    if (createOrderDto.companyId) {
      company = await this.companyRepository.findOneBy({ id: createOrderDto.companyId });
    }

    if (creatorId) {
      const creator = await this.userRepository.findOneBy({ id: creatorId });
      if (!creator) throw new NotFoundException('Creator user not found');
      // Only assign if the creator is a salesperson
      if (creator.role === 'SALESPERSON') {
        salesperson = creator;
      }
    }

    const order = this.orderRepository.create({
      ...createOrderDto,
      company,
      salesperson,
      status: createOrderDto.status || OrderStatus.PROCESSING,
    });

    if (createOrderDto.paymentMethod === PaymentMethod.STRIPE) {
      // Stripe payment logic remains the same
    } else if (createOrderDto.paymentMethod === PaymentMethod.PO) {
      if (!createOrderDto.poNumber) {
        throw new BadRequestException('PO Number is required for Purchase Order payments');
      }
      order.status = createOrderDto.status || OrderStatus.PENDING_APPROVAL;
    } else if (createOrderDto.paymentMethod === PaymentMethod.BANK_TRANSFER) {
      // Manual payment method; move to pending approval and await confirmation
      order.status = createOrderDto.status || OrderStatus.PENDING_APPROVAL;
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
              <div style="font-size:14px;color:${text}">Questions? Call (888) 787-4795 or email <a href="mailto:sales@servertechcentral.com" style="color:${accent};text-decoration:none">sales@servertechcentral.com</a>.</div>
            </div>
          </div>
          <div style="background:${lightNavy};color:#cbd5e1;padding:16px 24px;text-align:center;font-size:12px">© ${new Date().getFullYear()} Server Tech Central</div>
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
