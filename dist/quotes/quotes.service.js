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
exports.QuotesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const quote_entity_1 = require("./entities/quote.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const airtable_service_1 = require("../orders/airtable.service");
let QuotesService = class QuotesService {
    constructor(quoteRepository, notificationsService, airtableService) {
        this.quoteRepository = quoteRepository;
        this.notificationsService = notificationsService;
        this.airtableService = airtableService;
    }
    generateReferenceNumber() {
        return `QTE-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    async requestQuote(user, items) {
        const quote = this.quoteRepository.create({
            user,
            items,
            type: quote_entity_1.QuoteType.STANDARD_CART,
            referenceNumber: this.generateReferenceNumber(),
            status: quote_entity_1.QuoteStatus.PENDING,
        });
        return this.quoteRepository.save(quote);
    }
    async findAll() {
        return this.quoteRepository.find({
            relations: ['user', 'user.company'],
            order: { createdAt: 'DESC' }
        });
    }
    async findOne(id) {
        return this.quoteRepository.findOne({ where: { id }, relations: ['user'] });
    }
    async findForUser(userId, email) {
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
    async approveQuote(id, negotiatedTotal) {
        var _a;
        const quote = await this.findOne(id);
        if (!quote)
            throw new common_1.NotFoundException('Quote not found');
        quote.status = quote_entity_1.QuoteStatus.REVIEWED;
        quote.negotiatedTotal = negotiatedTotal;
        const email = ((_a = quote.user) === null || _a === void 0 ? void 0 : _a.email) || quote.guestEmail;
        if (email) {
            console.log(`Email sent to ${email}: Quote ${quote.referenceNumber} reviewed.`);
        }
        return this.quoteRepository.save(quote);
    }
    async acceptQuote(id) {
        const quote = await this.findOne(id);
        quote.status = quote_entity_1.QuoteStatus.ACCEPTED;
        return this.quoteRepository.save(quote);
    }
    async update(id, updateData) {
        const quote = await this.findOne(id);
        if (!quote)
            throw new common_1.NotFoundException('Quote not found');
        if (updateData.cart || updateData.shippingCost !== undefined || updateData.discount !== undefined) {
            const currentData = quote.submissionData || {};
            const cart = updateData.cart || currentData.cart || [];
            const shippingCost = Number(updateData.shippingCost !== undefined ? updateData.shippingCost : (currentData.shippingCost || 0));
            const discount = Number(updateData.discount !== undefined ? updateData.discount : (currentData.discount || 0));
            const subtotal = cart.reduce((acc, item) => acc + (Number(item.quantity || 1) * Number(item.unitPrice || 0)), 0);
            const total = subtotal + shippingCost - discount;
            quote.submissionData = Object.assign(Object.assign(Object.assign({}, currentData), updateData), { cart,
                shippingCost,
                discount,
                subtotal,
                total });
            if (updateData.shipping)
                quote.submissionData.shipping = updateData.shipping;
            if (updateData.billing)
                quote.submissionData.billing = updateData.billing;
            if (updateData.notes)
                quote.submissionData.notes = updateData.notes;
            quote.negotiatedTotal = total;
        }
        if (updateData.status)
            quote.status = updateData.status;
        if (updateData.paymentTerms)
            quote.paymentTerms = updateData.paymentTerms;
        if (updateData.name)
            quote.guestName = updateData.name;
        if (updateData.email)
            quote.guestEmail = updateData.email;
        if (updateData.company)
            quote.guestCompany = updateData.company;
        if (updateData.phone)
            quote.guestPhone = updateData.phone;
        return this.quoteRepository.save(quote);
    }
    async createManual(data) {
        const cart = data.cart || [];
        const subtotal = cart.reduce((acc, item) => acc + (Number(item.quantity || 1) * Number(item.unitPrice || 0)), 0);
        const shippingCost = Number(data.shippingCost || 0);
        const discount = Number(data.discount || 0);
        const total = subtotal + shippingCost - discount;
        const quote = this.quoteRepository.create({
            type: quote_entity_1.QuoteType.STANDARD_CART,
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
            status: quote_entity_1.QuoteStatus.PENDING,
            paymentTerms: data.paymentTerms || 'Net 30'
        });
        return this.quoteRepository.save(quote);
    }
    async handleConciergeRequest(data) {
        const quote = this.quoteRepository.create({
            type: quote_entity_1.QuoteType.CONCIERGE,
            referenceNumber: this.generateReferenceNumber(),
            guestEmail: data.email,
            submissionData: {
                parts: data.parts,
                timeline: data.timeline
            },
            status: quote_entity_1.QuoteStatus.PENDING
        });
        await this.quoteRepository.save(quote);
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
            <div style="font-weight:800;letter-spacing:0.04em;font-size:16px">SERVER TECH CENTRAL</div>
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
              <div style="font-size:14px;color:${text}">Questions? Call (888) 787-4795 or email <a href="mailto:sales@servertechcentral.com" style="color:${accent};text-decoration:none">sales@servertechcentral.com</a>.</div>
            </div>
          </div>
          <div style="background:${lightNavy};color:#cbd5e1;padding:16px 24px;text-align:center;font-size:12px">© ${new Date().getFullYear()} Server Tech Central</div>
        </div>
      </div>`;
        await this.notificationsService.sendEmail(subject, html, [data.email]);
        this.syncToAirtable(quote.id).catch(err => console.error('Auto-sync failed', err));
        return quote;
    }
    async handleBulkQuoteRequest(data) {
        const quote = this.quoteRepository.create({
            type: quote_entity_1.QuoteType.BULK_QUOTE,
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
            status: quote_entity_1.QuoteStatus.PENDING,
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
            <div style="font-weight:800;letter-spacing:0.04em;font-size:16px">SERVER TECH CENTRAL</div>
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
              <div style="font-size:14px;color:${text}">Questions? Call (888) 787-4795 or email <a href="mailto:sales@servertechcentral.com" style="color:${accent};text-decoration:none">sales@servertechcentral.com</a>.</div>
            </div>
          </div>
          <div style="background:${lightNavy};color:#cbd5e1;padding:16px 24px;text-align:center;font-size:12px">© ${new Date().getFullYear()} Server Tech Central</div>
        </div>
      </div>`;
        await this.notificationsService.sendEmail(subject, html, [data.email]);
        this.syncToAirtable(quote.id).catch(err => console.error('Auto-sync failed', err));
        return quote;
    }
    extractCategoriesFromText(text) {
        const out = new Set();
        if (!text)
            return [];
        const matches = Array.from(text.matchAll(/category\s*:\s*([^\n]+)/ig));
        for (const m of matches) {
            const raw = String(m[1] || '').trim();
            if (raw) {
                out.add(raw.replace(/[^A-Za-z0-9 &()/-]/g, '').trim());
            }
        }
        return Array.from(out).slice(0, 20);
    }
    slugify(name) {
        return String(name || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 50);
    }
    async handleBomUpload(data) {
        const quote = this.quoteRepository.create({
            type: quote_entity_1.QuoteType.BOM_UPLOAD,
            referenceNumber: this.generateReferenceNumber(),
            guestName: data.name,
            guestEmail: data.email,
            guestPhone: data.phone,
            guestCompany: data.company,
            submissionData: {
                fileName: data.fileName,
                notes: data.notes,
                fileContent: data.fileContent,
            },
            status: quote_entity_1.QuoteStatus.PENDING
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
            <div style="font-weight:800;letter-spacing:0.04em;font-size:16px">SERVER TECH CENTRAL</div>
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
              <div style="font-size:14px;color:${text}">Questions? Call (888) 787-4795 or email <a href="mailto:sales@servertechcentral.com" style="color:${accent};text-decoration:none">sales@servertechcentral.com</a>.</div>
            </div>
          </div>
          <div style="background:${lightNavy};color:#cbd5e1;padding:16px 24px;text-align:center;font-size:12px">© ${new Date().getFullYear()} Server Tech Central</div>
        </div>
      </div>`;
        await this.notificationsService.sendEmail(subject, html, [data.email]);
        this.syncToAirtable(quote.id).catch(err => console.error('Auto-sync failed', err));
        return quote;
    }
    async handleQuoteBeatingRequest(data) {
        const quote = this.quoteRepository.create({
            type: quote_entity_1.QuoteType.QUOTE_BEATING,
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
            status: quote_entity_1.QuoteStatus.PENDING
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
            <div style="font-weight:800;letter-spacing:0.04em;font-size:16px">SERVER TECH CENTRAL</div>
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
              <div style="font-size:14px;color:${text}">Questions? Call (888) 787-4795 or email <a href="mailto:sales@servertechcentral.com" style="color:${accent};text-decoration:none">sales@servertechcentral.com</a>.</div>
            </div>
          </div>
          <div style="background:${lightNavy};color:#cbd5e1;padding:16px 24px;text-align:center;font-size:12px">© ${new Date().getFullYear()} Server Tech Central</div>
        </div>
      </div>`;
        await this.notificationsService.sendEmail(subject, html, [data.email]);
        this.syncToAirtable(quote.id).catch(err => console.error('Auto-sync failed', err));
        return quote;
    }
    async handleContactRequest(data) {
        const quote = this.quoteRepository.create({
            type: quote_entity_1.QuoteType.CONTACT_US,
            referenceNumber: this.generateReferenceNumber(),
            guestName: data.name,
            guestEmail: data.email,
            guestPhone: data.phone,
            guestCompany: data.company,
            submissionData: {
                subject: data.subject,
                message: data.message
            },
            status: quote_entity_1.QuoteStatus.PENDING
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
            <div style="font-weight:800;letter-spacing:0.04em;font-size:16px">SERVER TECH CENTRAL</div>
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
              <div style="font-size:14px;color:${text}">Questions? Call (888) 787-4795 or email <a href="mailto:sales@servertechcentral.com" style="color:${accent};text-decoration:none">sales@servertechcentral.com</a>.</div>
            </div>
          </div>
          <div style="background:${lightNavy};color:#cbd5e1;padding:16px 24px;text-align:center;font-size:12px">© ${new Date().getFullYear()} Server Tech Central</div>
        </div>
      </div>`;
        await this.notificationsService.sendEmail(subject, html, [data.email]);
        this.syncToAirtable(quote.id).catch(err => console.error('Auto-sync failed', err));
        return quote;
    }
    async captureAbandon(payload) {
        const type = (payload === null || payload === void 0 ? void 0 : payload.type) === 'CHECKOUT' ? quote_entity_1.QuoteType.ABANDONED_CHECKOUT : quote_entity_1.QuoteType.ABANDONED_FORM;
        const quote = this.quoteRepository.create({
            type,
            referenceNumber: this.generateReferenceNumber(),
            guestName: payload === null || payload === void 0 ? void 0 : payload.name,
            guestEmail: payload === null || payload === void 0 ? void 0 : payload.email,
            guestPhone: payload === null || payload === void 0 ? void 0 : payload.phone,
            guestCompany: payload === null || payload === void 0 ? void 0 : payload.company,
            submissionData: {
                source: (payload === null || payload === void 0 ? void 0 : payload.source) || 'unknown',
                cart: (payload === null || payload === void 0 ? void 0 : payload.cart) || [],
                shipping: (payload === null || payload === void 0 ? void 0 : payload.shipping) || null,
                billing: (payload === null || payload === void 0 ? void 0 : payload.billing) || null,
                notes: (payload === null || payload === void 0 ? void 0 : payload.notes) || '',
            },
            status: quote_entity_1.QuoteStatus.PENDING
        });
        const saved = await this.quoteRepository.save(quote);
        return saved;
    }
    async syncToAirtable(id) {
        var _a, _b, _c, _d;
        const quote = await this.findOne(id);
        if (!quote)
            throw new common_1.NotFoundException('Quote not found');
        const data = quote.submissionData || {};
        const basePayload = {
            name: quote.guestName || ((_a = quote.user) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
            email: quote.guestEmail || ((_b = quote.user) === null || _b === void 0 ? void 0 : _b.email),
            phone: quote.guestPhone,
            company: quote.guestCompany || ((_d = (_c = quote.user) === null || _c === void 0 ? void 0 : _c.company) === null || _d === void 0 ? void 0 : _d.name),
            referenceNumber: quote.referenceNumber,
        };
        let payload = {};
        switch (quote.type) {
            case quote_entity_1.QuoteType.CONCIERGE:
                payload = Object.assign(Object.assign({}, basePayload), { type: 'CONCIERGE', parts: data.parts, timeline: data.timeline });
                break;
            case quote_entity_1.QuoteType.BULK_QUOTE:
                payload = Object.assign(Object.assign({}, basePayload), { type: 'BULK_QUOTE', parts: data.parts, timeline: data.timeline });
                break;
            case quote_entity_1.QuoteType.BOM_UPLOAD:
                payload = Object.assign(Object.assign({}, basePayload), { type: 'BOM_UPLOAD', notes: data.notes, fileName: data.fileName });
                break;
            case quote_entity_1.QuoteType.QUOTE_BEATING:
                payload = Object.assign(Object.assign({}, basePayload), { type: 'QUOTE_BEATING', competitorPrice: data.competitorPrice, partNumber: data.partNumber, notes: data.notes, fileName: data.fileName });
                break;
            case quote_entity_1.QuoteType.CONTACT_US:
                payload = Object.assign(Object.assign({}, basePayload), { type: 'CONTACT_US', message: data.message, notes: `Subject: ${data.subject}` });
                break;
            default:
                payload = Object.assign(Object.assign({}, basePayload), { type: quote.type === quote_entity_1.QuoteType.STANDARD_CART ? 'MANUAL_QUOTE' : 'OTHER', notes: data.notes || '' });
        }
        await this.airtableService.createLeadRecord(payload);
    }
};
exports.QuotesService = QuotesService;
exports.QuotesService = QuotesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quote_entity_1.Quote)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        airtable_service_1.AirtableService])
], QuotesService);
//# sourceMappingURL=quotes.service.js.map