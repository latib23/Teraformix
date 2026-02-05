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
exports.QuotesController = void 0;
const common_1 = require("@nestjs/common");
const quotes_service_1 = require("./quotes.service");
const quote_entity_1 = require("./entities/quote.entity");
const swagger_1 = require("@nestjs/swagger");
const concierge_request_dto_1 = require("./dto/concierge-request.dto");
const bulk_quote_request_dto_1 = require("./dto/bulk-quote-request.dto");
const bom_upload_request_dto_1 = require("./dto/bom-upload-request.dto");
const quote_beating_request_dto_1 = require("./dto/quote-beating-request.dto");
const contact_request_dto_1 = require("./dto/contact-request.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const ip_whitelist_guard_1 = require("../auth/guards/ip-whitelist.guard");
let QuotesController = class QuotesController {
    constructor(quotesService) {
        this.quotesService = quotesService;
    }
    findAll() {
        return this.quotesService.findAll();
    }
    requestQuote(body) {
        return { message: "Quote requested" };
    }
    findMyQuotes(req) {
        return this.quotesService.findForUser(req.user.userId, req.user.email);
    }
    approveQuote(id, total) {
        return this.quotesService.approveQuote(id, total);
    }
    updateQuote(id, body) {
        return this.quotesService.update(id, body);
    }
    async createManualQuote(body) {
        return this.quotesService.createManual(body);
    }
    async conciergeRequest(body) {
        const quote = await this.quotesService.handleConciergeRequest(body);
        return {
            message: "Concierge request received.",
            referenceNumber: quote.referenceNumber
        };
    }
    async bulkQuoteRequest(body) {
        const quote = await this.quotesService.handleBulkQuoteRequest(body);
        return {
            message: "Bulk quote request received.",
            referenceNumber: quote.referenceNumber
        };
    }
    async bomUploadRequest(body) {
        const quote = await this.quotesService.handleBomUpload(body);
        return {
            message: "BOM submission received.",
            referenceNumber: quote.referenceNumber
        };
    }
    async quoteBeatingRequest(body) {
        const quote = await this.quotesService.handleQuoteBeatingRequest(body);
        return {
            message: "Quote beating request received.",
            referenceNumber: quote.referenceNumber
        };
    }
    async contactRequest(body) {
        const quote = await this.quotesService.handleContactRequest(body);
        return {
            message: "Contact request received.",
            referenceNumber: quote.referenceNumber
        };
    }
    async downloadBomFile(id, _req, _body, res) {
        const quote = await this.quotesService.findOne(id);
        if (!quote || quote.type !== 'BOM_UPLOAD') {
            return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: 'BOM not found' });
        }
        const submission = quote.submissionData || {};
        const fileName = submission.fileName || `bom-${quote.referenceNumber}`;
        const dataUrl = submission.fileContent;
        if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'No file content available' });
        }
        const match = dataUrl.match(/^data:(.+?);base64,(.*)$/);
        if (!match) {
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Invalid file data' });
        }
        const mime = match[1];
        const b64 = match[2];
        const buffer = Buffer.from(b64, 'base64');
        res.setHeader('Content-Type', mime || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.status(common_1.HttpStatus.OK).send(buffer);
    }
    async trackQuote(body) {
        var _a, _b, _c;
        const ref = (body.referenceNumber || '').trim();
        const email = (body.email || '').toLowerCase();
        if (!ref || !email) {
            return { found: false };
        }
        const all = await this.quotesService.findAll();
        const match = all.find(q => {
            var _a;
            const guestEmail = (q.guestEmail || '').toLowerCase();
            const userEmail = (((_a = q.user) === null || _a === void 0 ? void 0 : _a.email) || '').toLowerCase();
            const byEmail = (guestEmail && guestEmail === email) || (userEmail && userEmail === email);
            return q.referenceNumber === ref && byEmail;
        });
        if (!match)
            return { found: false };
        return {
            found: true,
            data: {
                id: match.id,
                referenceNumber: match.referenceNumber,
                type: match.type,
                status: match.status,
                createdAt: match.createdAt,
                submissionData: {
                    parts: (_a = match.submissionData) === null || _a === void 0 ? void 0 : _a.parts,
                    timeline: (_b = match.submissionData) === null || _b === void 0 ? void 0 : _b.timeline,
                    fileName: (_c = match.submissionData) === null || _c === void 0 ? void 0 : _c.fileName,
                },
            }
        };
    }
    async getPublicQuote(id) {
        var _a, _b, _c, _d, _e, _f;
        const quote = await this.quotesService.findOne(id);
        if (!quote)
            throw new common_1.NotFoundException('Quote not found');
        return {
            id: quote.id,
            referenceNumber: quote.referenceNumber,
            status: quote.status,
            createdAt: quote.createdAt,
            total: ((_a = quote.submissionData) === null || _a === void 0 ? void 0 : _a.total) || 0,
            paymentTerms: quote.paymentTerms,
            items: ((_b = quote.submissionData) === null || _b === void 0 ? void 0 : _b.cart) || [],
            customer: {
                name: quote.guestName || ((_c = quote.user) === null || _c === void 0 ? void 0 : _c.name),
                email: quote.guestEmail || ((_d = quote.user) === null || _d === void 0 ? void 0 : _d.email),
                company: quote.guestCompany || ((_f = (_e = quote.user) === null || _e === void 0 ? void 0 : _e.company) === null || _f === void 0 ? void 0 : _f.name),
            }
        };
    }
    async payQuote(id, paymentDetails) {
        return this.quotesService.update(id, { status: quote_entity_1.QuoteStatus.PAID });
    }
    async captureAbandoned(body) {
        const quote = await this.quotesService.captureAbandon(body);
        return { id: quote.id, referenceNumber: quote.referenceNumber };
    }
    async syncQuote(id) {
        await this.quotesService.syncToAirtable(id);
        return { message: 'Sync triggered' };
    }
};
exports.QuotesController = QuotesController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.SALESPERSON),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all quote requests (Admin Inbox)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Request a new cart quote' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "requestQuote", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.BUYER),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get quotes associated with the current buyer' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "findMyQuotes", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin approves quote with custom price' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('total')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "approveQuote", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.SALESPERSON),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update quote details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuotesController.prototype, "updateQuote", null);
__decorate([
    (0, common_1.Post)('manual'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.SALESPERSON),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a manual quote by sales team' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "createManualQuote", null);
__decorate([
    (0, common_1.Post)('request/concierge'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a concierge sourcing request' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [concierge_request_dto_1.ConciergeRequestDto]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "conciergeRequest", null);
__decorate([
    (0, common_1.Post)('request/bulk'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a bulk quote request from the modal' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_quote_request_dto_1.BulkQuoteRequestDto]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "bulkQuoteRequest", null);
__decorate([
    (0, common_1.Post)('request/bom'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a BOM upload' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bom_upload_request_dto_1.BomUploadRequestDto]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "bomUploadRequest", null);
__decorate([
    (0, common_1.Post)('request/beat-quote'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a quote beating request' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quote_beating_request_dto_1.QuoteBeatingRequestDto]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "quoteBeatingRequest", null);
__decorate([
    (0, common_1.Post)('request/contact'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a contact us request' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [contact_request_dto_1.ContactRequestDto]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "contactRequest", null);
__decorate([
    (0, common_1.Get)(':id/file'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.SALESPERSON),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Download BOM file content (Admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "downloadBomFile", null);
__decorate([
    (0, common_1.Post)('track'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Public tracking lookup for quotes by reference and email' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "trackQuote", null);
__decorate([
    (0, common_1.Get)('public/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Public access to quote for payment' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "getPublicQuote", null);
__decorate([
    (0, common_1.Post)('public/:id/pay'),
    (0, swagger_1.ApiOperation)({ summary: 'Process payment for a quote' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "payQuote", null);
__decorate([
    (0, common_1.Post)('abandon'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Capture abandoned checkout or form (no auth)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "captureAbandoned", null);
__decorate([
    (0, common_1.Post)(':id/sync'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.SALESPERSON),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Manually trigger Airtable sync for a quote' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuotesController.prototype, "syncQuote", null);
exports.QuotesController = QuotesController = __decorate([
    (0, swagger_1.ApiTags)('quotes'),
    (0, common_1.Controller)('quotes'),
    (0, common_1.UseGuards)(ip_whitelist_guard_1.IpWhitelistGuard),
    __metadata("design:paramtypes", [quotes_service_1.QuotesService])
], QuotesController);
//# sourceMappingURL=quotes.controller.js.map