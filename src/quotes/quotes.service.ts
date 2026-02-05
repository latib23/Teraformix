
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote, QuoteStatus, QuoteType } from './entities/quote.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ConciergeRequestDto } from './dto/concierge-request.dto';
import { BulkQuoteRequestDto } from './dto/bulk-quote-request.dto';
import { BomUploadRequestDto } from './dto/bom-upload-request.dto';
import { QuoteBeatingRequestDto } from './dto/quote-beating-request.dto';
import { ContactRequestDto } from './dto/contact-request.dto';
import { AirtableService } from '../orders/airtable.service';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    private notificationsService: NotificationsService,
    private airtableService: AirtableService,
  ) { }

  private generateReferenceNumber(): string {
    // Format: QTE-TIMESTAMP-RANDOM (e.g., QTE-1699999-4821)
    return `QTE-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  async requestQuote(user: User, items: any[]): Promise<Quote> {
    const quote = this.quoteRepository.create({
      user,
      items,
      type: QuoteType.STANDARD_CART,
      referenceNumber: this.generateReferenceNumber(),
      status: QuoteStatus.PENDING,
    });
    return this.quoteRepository.save(quote);
  }

  async findAll(): Promise<Quote[]> {
    return this.quoteRepository.find({
      relations: ['user', 'user.company'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Quote> {
    return this.quoteRepository.findOne({ where: { id }, relations: ['user'] });
  }

  async findForUser(userId: string, email?: string): Promise<Quote[]> {
    const all = await this.quoteRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    const targetId = userId || '';
    const targetEmail = (email || '').toLowerCase();
    return all.filter(q => {
      const byUser = !!(q.user && q.user.id && q.user.id === targetId);
      const guestEmail = (q.guestEmail || '').toLowerCase();
      const byEmail = !!(guestEmail && targetEmail && guestEmail === targetEmail);
      return byUser || byEmail;
    });
  }

  async approveQuote(id: string, negotiatedTotal: number): Promise<Quote> {
    const quote = await this.findOne(id);
    if (!quote) throw new NotFoundException('Quote not found');

    quote.status = QuoteStatus.REVIEWED;
    quote.negotiatedTotal = negotiatedTotal;

    const email = quote.user?.email || quote.guestEmail;
    if (email) {
      // Trigger notification
      console.log(`Email sent to ${email}: Quote ${quote.referenceNumber} reviewed.`);
    }

    return this.quoteRepository.save(quote);
  }

  async acceptQuote(id: string): Promise<Quote> {
    const quote = await this.findOne(id);
    quote.status = QuoteStatus.ACCEPTED;
    return this.quoteRepository.save(quote);
  }

  async update(id: string, updateData: any): Promise<Quote> {
    const quote = await this.findOne(id);
    if (!quote) throw new NotFoundException('Quote not found');

    // If updating submission data related fields, recalculate totals
    if (updateData.cart || updateData.shippingCost !== undefined || updateData.discount !== undefined) {
      const currentData = quote.submissionData || {};
      const cart = updateData.cart || currentData.cart || [];
      const shippingCost = Number(updateData.shippingCost !== undefined ? updateData.shippingCost : (currentData.shippingCost || 0));
      const discount = Number(updateData.discount !== undefined ? updateData.discount : (currentData.discount || 0));

      const subtotal = cart.reduce((acc: number, item: any) => acc + (Number(item.quantity || 1) * Number(item.unitPrice || 0)), 0);
      const total = subtotal + shippingCost - discount;

      quote.submissionData = {
        ...currentData,
        ...updateData, // Merge other fields
        cart, // Ensure cart is set
        shippingCost,
        discount,
        subtotal,
        total
      };

      // Specifically ensure these objects are updated if present
      if (updateData.shipping) quote.submissionData.shipping = updateData.shipping;
      if (updateData.billing) quote.submissionData.billing = updateData.billing;
      if (updateData.notes) quote.submissionData.notes = updateData.notes;

      quote.negotiatedTotal = total;
    }

    // Handle top-level fields
    if (updateData.status) quote.status = updateData.status;
    if (updateData.paymentTerms) quote.paymentTerms = updateData.paymentTerms;
    if (updateData.name) quote.guestName = updateData.name;
    if (updateData.email) quote.guestEmail = updateData.email;
    if (updateData.company) quote.guestCompany = updateData.company;
    if (updateData.phone) quote.guestPhone = updateData.phone;

    // Fallback for any other top-level fields passed that match the entity
    // We filter out fields that shouldn't be directly assigned if necessary, but for now Object.assign for the rest is fine if we are careful
    // However, since we handled specific logic above, let's just save.

    return this.quoteRepository.save(quote);
  }

  async createManual(data: any): Promise<Quote> {
    const cart = data.cart || [];
    const subtotal = cart.reduce((acc: number, item: any) => acc + (Number(item.quantity || 1) * Number(item.unitPrice || 0)), 0);
    const shippingCost = Number(data.shippingCost || 0);
    const discount = Number(data.discount || 0);
    const total = subtotal + shippingCost - discount;

    const quote = this.quoteRepository.create({
      type: QuoteType.STANDARD_CART,
      referenceNumber: this.generateReferenceNumber(),
      guestName: data.name,
      guestEmail: data.email,
      guestPhone: data.phone,
      guestCompany: data.company,
      submissionData: {
        cart: cart,
        shipping: data.shipping || {},
        billing: data.billing || {},
        notes: data.notes || '',
        paymentTerms: data.paymentTerms || 'Net 30',
        shippingCost,
        discount,
        subtotal,
        total
      },
      negotiatedTotal: total,
      status: QuoteStatus.PENDING,
      paymentTerms: data.paymentTerms || 'Net 30'
    });

    return this.quoteRepository.save(quote);
  }

  async handleConciergeRequest(data: ConciergeRequestDto): Promise<Quote> {
    const quote = this.quoteRepository.create({
      type: QuoteType.CONCIERGE,
      referenceNumber: this.generateReferenceNumber(),
      guestEmail: data.email,
      submissionData: {
        parts: data.parts,
        timeline: data.timeline
      },
      status: QuoteStatus.PENDING
    });

    await this.quoteRepository.save(quote);

    // Send Notification
    const subject = `Concierge Sourcing Request ${quote.referenceNumber}`;
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
            <div style="margin-top:4px;font-size:13px;color:#cbd5e1">Concierge Sourcing Request</div>
          </div>
          <div style="padding:24px">
            <h1 style="margin:0;font-size:20px;line-height:28px;color:${text}">Request Received</h1>
            <p style="margin:8px 0 16px;color:${muted};font-size:14px">Reference <strong>${quote.referenceNumber}</strong>. Our team will review your sourcing needs and respond shortly.</p>
            <div style="display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:16px">
              <div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Details</div>
                <div style="font-size:14px;color:${text}"><strong>Email:</strong> ${data.email}</div>
                <div style="font-size:14px;color:${text}"><strong>Parts:</strong> ${data.parts}</div>
                <div style="font-size:14px;color:${text}"><strong>Timeline:</strong> ${data.timeline}</div>
              </div>
            </div>
            <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px">
              <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Support</div>
              <div style="font-size:14px;color:${text}">Questions? Call (888) 787-4795 or email <a href="mailto:sales@teraformix.com" style="color:${accent};text-decoration:none">sales@teraformix.com</a>.</div>
            </div>
          </div>
          <div style="background:${lightNavy};color:#cbd5e1;padding:16px 24px;text-align:center;font-size:12px">© ${new Date().getFullYear()} Teraformix</div>
        </div>
      </div>`;
    await this.notificationsService.sendEmail(subject, html, [data.email]);
    this.syncToAirtable(quote.id).catch(err => console.error('Auto-sync failed', err));
    return quote;
  }

  async handleBulkQuoteRequest(data: BulkQuoteRequestDto): Promise<Quote> {
    const quote = this.quoteRepository.create({
      type: QuoteType.BULK_QUOTE,
      referenceNumber: this.generateReferenceNumber(),
      guestEmail: data.email,
      guestPhone: data.phone,
      guestName: data.name,
      submissionData: {
        parts: data.parts,
        timeline: data.timeline,
        email: data.email,
        phone: data.phone,
        name: data.name,
      },
      status: QuoteStatus.PENDING,
    });

    await this.quoteRepository.save(quote);

    const subject = `Bulk Quote Request ${quote.referenceNumber}`;
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
            <div style="margin-top:4px;font-size:13px;color:#cbd5e1">Bulk Quote Request</div>
          </div>
          <div style="padding:24px">
            <h1 style="margin:0;font-size:20px;line-height:28px;color:${text}">Request Received</h1>
            <p style="margin:8px 0 16px;color:${muted};font-size:14px">Reference <strong>${quote.referenceNumber}</strong>. We will prepare your volume pricing and lead times.</p>
            <div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:16px">
              <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Contact</div>
              <div style="font-size:14px;color:${text}"><strong>Email:</strong> ${data.email}</div>
              <div style="font-size:14px;color:${text}"><strong>Phone:</strong> ${data.phone || ''}</div>
            </div>
            <div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:16px">
              <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Requirements</div>
              <div style="font-size:14px;color:${text}">${data.parts}</div>
              ${data.timeline ? `<div style="font-size:14px;color:${text}"><strong>Timeline:</strong> ${data.timeline}</div>` : ''}
            </div>
            <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px">
              <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Support</div>
              <div style="font-size:14px;color:${text}">Questions? Call (888) 787-4795 or email <a href="mailto:sales@teraformix.com" style="color:${accent};text-decoration:none">sales@teraformix.com</a>.</div>
            </div>
          </div>
          <div style="background:${lightNavy};color:#cbd5e1;padding:16px 24px;text-align:center;font-size:12px">© ${new Date().getFullYear()} Teraformix</div>
        </div>
      </div>`;
    await this.notificationsService.sendEmail(subject, html, [data.email]);
    this.syncToAirtable(quote.id).catch(err => console.error('Auto-sync failed', err));
    return quote;
  }

  private extractCategoriesFromText(text: string): string[] {
    const out = new Set<string>();
    if (!text) return [];
    const matches = Array.from(text.matchAll(/category\s*:\s*([^\n]+)/ig));
    for (const m of matches) {
      const raw = String(m[1] || '').trim();
      if (raw) {
        out.add(raw.replace(/[^A-Za-z0-9 &()/-]/g, '').trim());
      }
    }
    return Array.from(out).slice(0, 20);
  }

  private slugify(name: string): string {
    return String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  }

  async handleBomUpload(data: BomUploadRequestDto): Promise<Quote> {
    const quote = this.quoteRepository.create({
      type: QuoteType.BOM_UPLOAD,
      referenceNumber: this.generateReferenceNumber(),
      guestName: data.name,
      guestEmail: data.email,
      guestPhone: data.phone,
      guestCompany: data.company,
      submissionData: {
        fileName: data.fileName,
        // In production, you might store the file URL here instead of base64 if uploading to S3
        // Keeping base64 data URL inline for admin download in this implementation
        notes: data.notes,
        fileContent: data.fileContent,
      },
      status: QuoteStatus.PENDING
    });

    await this.quoteRepository.save(quote);

    const subject = `BOM Upload ${quote.referenceNumber}`;
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
            <div style="margin-top:4px;font-size:13px;color:#cbd5e1">BOM Upload Received</div>
          </div>
          <div style="padding:24px">
            <h1 style="margin:0;font-size:20px;line-height:28px;color:${text}">Submission Received</h1>
            <p style="margin:8px 0 16px;color:${muted};font-size:14px">Reference <strong>${quote.referenceNumber}</strong>. We will process your file and follow up with pricing.</p>
            <div style="display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:16px">
              <div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Company</div>
                <div style="font-size:14px;color:${text}">${data.company}</div>
              </div>
              <div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Contact</div>
                <div style="font-size:14px;color:${text}">${data.name} (${data.email})</div>
                ${data.phone ? `<div style="font-size:14px;color:${text}">${data.phone}</div>` : ''}
              </div>
              <div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">File</div>
                <div style="font-size:14px;color:${text}">${data.fileName}</div>
              </div>
              ${data.notes ? `<div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px"><div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Notes</div><div style="font-size:14px;color:${text}">${data.notes}</div></div>` : ''}
            </div>
            <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px">
              <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Support</div>
              <div style="font-size:14px;color:${text}">Questions? Call (888) 787-4795 or email <a href="mailto:sales@teraformix.com" style="color:${accent};text-decoration:none">sales@teraformix.com</a>.</div>
            </div>
          </div>
          <div style="background:${lightNavy};color:#cbd5e1;padding:16px 24px;text-align:center;font-size:12px">© ${new Date().getFullYear()} Teraformix</div>
        </div>
      </div>`;
    await this.notificationsService.sendEmail(subject, html, [data.email]);
    this.syncToAirtable(quote.id).catch(err => console.error('Auto-sync failed', err));
    return quote;
  }

  async handleQuoteBeatingRequest(data: QuoteBeatingRequestDto): Promise<Quote> {
    const quote = this.quoteRepository.create({
      type: QuoteType.QUOTE_BEATING,
      referenceNumber: this.generateReferenceNumber(),
      guestName: data.name,
      guestEmail: data.email,
      guestPhone: data.phone,
      guestCompany: data.company,
      submissionData: {
        competitorPrice: data.competitorPrice,
        partNumber: data.partNumber,
        fileName: data.fileName,
        fileContent: data.fileContent,
        notes: data.notes,
      },
      status: QuoteStatus.PENDING
    });

    await this.quoteRepository.save(quote);

    const subject = `Quote Beating Request ${quote.referenceNumber}`;
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
            <div style="margin-top:4px;font-size:13px;color:#cbd5e1">Quote Beating Request</div>
          </div>
          <div style="padding:24px">
            <h1 style="margin:0;font-size:20px;line-height:28px;color:${text}">Submission Received</h1>
            <p style="margin:8px 0 16px;color:${muted};font-size:14px">Reference <strong>${quote.referenceNumber}</strong>. We will review your request and do our best to beat the price.</p>
            <div style="display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:16px">
              <div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Company</div>
                <div style="font-size:14px;color:${text}">${data.company}</div>
              </div>
              <div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Contact</div>
                <div style="font-size:14px;color:${text}">${data.name} (${data.email})</div>
                ${data.phone ? `<div style="font-size:14px;color:${text}">${data.phone}</div>` : ''}
              </div>
              ${data.competitorPrice ? `<div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px"><div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Target Price</div><div style="font-size:14px;color:${text}">${data.competitorPrice}</div></div>` : ''}
              ${data.partNumber ? `<div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px"><div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Part Number</div><div style="font-size:14px;color:${text}">${data.partNumber}</div></div>` : ''}
              ${data.fileName ? `<div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px"><div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">File</div><div style="font-size:14px;color:${text}">${data.fileName}</div></div>` : ''}
              ${data.notes ? `<div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px"><div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Notes</div><div style="font-size:14px;color:${text}">${data.notes}</div></div>` : ''}
            </div>
            <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px">
              <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Support</div>
              <div style="font-size:14px;color:${text}">Questions? Call (888) 787-4795 or email <a href="mailto:sales@teraformix.com" style="color:${accent};text-decoration:none">sales@teraformix.com</a>.</div>
            </div>
          </div>
          <div style="background:${lightNavy};color:#cbd5e1;padding:16px 24px;text-align:center;font-size:12px">© ${new Date().getFullYear()} Teraformix</div>
        </div>
      </div>`;
    await this.notificationsService.sendEmail(subject, html, [data.email]);
    this.syncToAirtable(quote.id).catch(err => console.error('Auto-sync failed', err));
    return quote;
  }



  async handleContactRequest(data: ContactRequestDto): Promise<Quote> {
    const quote = this.quoteRepository.create({
      type: QuoteType.CONTACT_US,
      referenceNumber: this.generateReferenceNumber(),
      guestName: data.name,
      guestEmail: data.email,
      guestPhone: data.phone,
      guestCompany: data.company,
      submissionData: {
        subject: data.subject,
        message: data.message
      },
      status: QuoteStatus.PENDING
    });

    await this.quoteRepository.save(quote);

    const subject = `Contact Request: ${data.subject} [${quote.referenceNumber}]`;
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
            <div style="margin-top:4px;font-size:13px;color:#cbd5e1">Contact Request Received</div>
          </div>
          <div style="padding:24px">
            <h1 style="margin:0;font-size:20px;line-height:28px;color:${text}">New Message</h1>
            <p style="margin:8px 0 16px;color:${muted};font-size:14px">Reference <strong>${quote.referenceNumber}</strong>. We have received your message.</p>
            <div style="display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:16px">
              <div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Sender</div>
                <div style="font-size:14px;color:${text}"><strong>Name:</strong> ${data.name}</div>
                <div style="font-size:14px;color:${text}"><strong>Email:</strong> ${data.email}</div>
                ${data.phone ? `<div style="font-size:14px;color:${text}"><strong>Phone:</strong> ${data.phone}</div>` : ''}
                ${data.company ? `<div style="font-size:14px;color:${text}"><strong>Company:</strong> ${data.company}</div>` : ''}
              </div>
              <div style="background:${gray};border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Message</div>
                <div style="font-size:14px;color:${text} font-weight:700;margin-bottom:4px">${data.subject}</div>
                <div style="font-size:14px;color:${text} white-space:pre-wrap;">${data.message}</div>
              </div>
            </div>
            <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px">
              <div style="font-size:12px;color:${muted};text-transform:uppercase;font-weight:700;margin-bottom:6px">Support</div>
              <div style="font-size:14px;color:${text}">Questions? Call (888) 787-4795 or email <a href="mailto:sales@teraformix.com" style="color:${accent};text-decoration:none">sales@teraformix.com</a>.</div>
            </div>
          </div>
          <div style="background:${lightNavy};color:#cbd5e1;padding:16px 24px;text-align:center;font-size:12px">© ${new Date().getFullYear()} Teraformix</div>
        </div>
      </div>`;

    // Send to admin as well if needed, but for now sending acknowledgment to user
    await this.notificationsService.sendEmail(subject, html, [data.email]);
    this.syncToAirtable(quote.id).catch(err => console.error('Auto-sync failed', err));
    return quote;
  }

  async captureAbandon(payload: any): Promise<Quote> {
    const type = payload?.type === 'CHECKOUT' ? QuoteType.ABANDONED_CHECKOUT : QuoteType.ABANDONED_FORM;
    const quote = this.quoteRepository.create({
      type,
      referenceNumber: this.generateReferenceNumber(),
      guestName: payload?.name,
      guestEmail: payload?.email,
      guestPhone: payload?.phone,
      guestCompany: payload?.company,
      submissionData: {
        source: payload?.source || 'unknown',
        cart: payload?.cart || [],
        shipping: payload?.shipping || null,
        billing: payload?.billing || null,
        notes: payload?.notes || '',
      },
      status: QuoteStatus.PENDING
    });

    const saved = await this.quoteRepository.save(quote);
    return saved;
  }

  async syncToAirtable(id: string): Promise<void> {
    const quote = await this.findOne(id);
    if (!quote) throw new NotFoundException('Quote not found');

    const data = quote.submissionData || {};
    const basePayload = {
      name: quote.guestName || quote.user?.name || 'Unknown',
      email: quote.guestEmail || quote.user?.email,
      phone: quote.guestPhone,
      company: quote.guestCompany || quote.user?.company?.name,
      referenceNumber: quote.referenceNumber,
    };

    let payload: any = {};

    switch (quote.type) {
      case QuoteType.CONCIERGE:
        payload = {
          ...basePayload,
          type: 'CONCIERGE',
          parts: data.parts,
          timeline: data.timeline,
        };
        break;
      case QuoteType.BULK_QUOTE:
        payload = {
          ...basePayload,
          type: 'BULK_QUOTE',
          parts: data.parts,
          timeline: data.timeline,
        };
        break;
      case QuoteType.BOM_UPLOAD:
        payload = {
          ...basePayload,
          type: 'BOM_UPLOAD',
          notes: data.notes,
          fileName: data.fileName,
          // fileUrl would need to be handled if we stored it
        };
        break;
      case QuoteType.QUOTE_BEATING:
        payload = {
          ...basePayload,
          type: 'QUOTE_BEATING',
          competitorPrice: data.competitorPrice,
          partNumber: data.partNumber,
          notes: data.notes,
          fileName: data.fileName,
        };
        break;
      case QuoteType.CONTACT_US:
        payload = {
          ...basePayload,
          type: 'CONTACT_US',
          message: data.message,
          notes: `Subject: ${data.subject}`,
        };
        break;
      default:
        // Generic or Abandoned
        payload = {
          ...basePayload,
          type: quote.type === QuoteType.STANDARD_CART ? 'MANUAL_QUOTE' : 'OTHER',
          notes: data.notes || '',
        };
    }

    await this.airtableService.createLeadRecord(payload);
  }
}
