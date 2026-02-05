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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const orders_service_1 = require("./orders.service");
const config_1 = require("@nestjs/config");
class CreateIntentDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Amount in cents (server will prefer computed amount when items are provided)' }),
    __metadata("design:type", Number)
], CreateIntentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 'usd' }),
    __metadata("design:type", String)
], CreateIntentDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: 'array', description: 'Cart items for server-side total calculation' }),
    __metadata("design:type", Array)
], CreateIntentDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Shipping address for rate calculation' }),
    __metadata("design:type", Object)
], CreateIntentDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Selected shipping service code to include shipment cost' }),
    __metadata("design:type", String)
], CreateIntentDto.prototype, "serviceCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", Object)
], CreateIntentDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], CreateIntentDto.prototype, "recaptchaToken", void 0);
let PaymentsController = class PaymentsController {
    constructor(ordersService, configService) {
        this.ordersService = ordersService;
        this.configService = configService;
    }
    async verifyRecaptcha(req, token) {
        var _a;
        const env = (process.env.NODE_ENV || '').toLowerCase();
        if (env !== 'production')
            return true;
        const enforce = String(process.env.RECAPTCHA_ENFORCE || 'false').toLowerCase() === 'true';
        if (!enforce)
            return true;
        const secret = this.configService.get('RECAPTCHA_SECRET') || process.env.RECAPTCHA_SECRET || '';
        if (!secret)
            return true;
        const t = String(token || '').trim();
        if (!t)
            return false;
        const params = new URLSearchParams();
        params.append('secret', secret);
        params.append('response', t);
        const ip = ((req === null || req === void 0 ? void 0 : req.ip) || ((_a = req === null || req === void 0 ? void 0 : req.headers) === null || _a === void 0 ? void 0 : _a['x-forwarded-for']) || '');
        const ipStr = Array.isArray(ip) ? ip[0] : String(ip || '');
        if (ipStr)
            params.append('remoteip', ipStr);
        const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || '0.3');
        const expectAction = String(process.env.RECAPTCHA_EXPECT_ACTION || 'checkout');
        try {
            const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
            const data = await resp.json();
            if (data && data.success)
                return true;
            const scoreOk = typeof (data === null || data === void 0 ? void 0 : data.score) === 'number' ? data.score >= minScore : true;
            const actionOk = (data === null || data === void 0 ? void 0 : data.action) ? String(data.action) === expectAction : true;
            if (!!(data === null || data === void 0 ? void 0 : data.success) && scoreOk && actionOk)
                return true;
        }
        catch (_e) {
            void _e;
        }
        try {
            const resp2 = await fetch('https://www.recaptcha.net/recaptcha/api/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
            const data2 = await resp2.json();
            if (data2 && data2.success)
                return true;
            const scoreOk2 = typeof (data2 === null || data2 === void 0 ? void 0 : data2.score) === 'number' ? data2.score >= minScore : true;
            const actionOk2 = (data2 === null || data2 === void 0 ? void 0 : data2.action) ? String(data2.action) === expectAction : true;
            if (!!(data2 === null || data2 === void 0 ? void 0 : data2.success) && scoreOk2 && actionOk2)
                return true;
        }
        catch (_e) {
            void _e;
        }
        return false;
    }
    async createIntent(body, req) {
        try {
            const ok = await this.verifyRecaptcha(req, body.recaptchaToken);
            if (!ok)
                throw new common_1.BadRequestException('recaptcha_failed');
            const currency = String(body.currency || 'usd').toLowerCase();
            if (currency !== 'usd')
                throw new common_1.BadRequestException('Unsupported currency');
            let amount = 0;
            const providedAmount = Number(body.amount);
            const hasProvidedAmount = !!providedAmount && providedAmount > 0;
            const hasCart = Array.isArray(body.items) && body.items.length > 0 && body.address;
            if (hasProvidedAmount && !hasCart) {
                const MAX = 10000000;
                if (providedAmount > MAX)
                    throw new common_1.BadRequestException('Amount exceeds limit');
                amount = providedAmount;
            }
            else if (hasCart) {
                amount = await this.ordersService.calculateAmountCents(body.items, body.address, body.serviceCode);
                if (hasProvidedAmount) {
                    const MAX = 10000000;
                    if (providedAmount > 0 && providedAmount <= MAX) {
                        amount = providedAmount;
                    }
                }
            }
            else {
                throw new common_1.BadRequestException('Invalid amount');
            }
            const intent = await this.ordersService.createPaymentIntent(amount, currency, Object.assign(Object.assign({}, (body.metadata || {})), { serviceCode: body.serviceCode || '' }));
            return { clientSecret: intent.client_secret, id: intent.id, status: intent.status };
        }
        catch (e) {
            if (e instanceof common_1.HttpException)
                throw e;
            throw new common_1.BadRequestException(String((e === null || e === void 0 ? void 0 : e.message) || 'Payment error'));
        }
    }
    async status() {
        try {
            const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
            if (isProduction) {
                throw new common_1.ForbiddenException('unavailable_in_production');
            }
            const testAmount = 100;
            const intent = await this.ordersService.createPaymentIntent(testAmount, 'usd');
            return { ok: true, id: intent.id, status: intent.status };
        }
        catch (e) {
            if (e instanceof common_1.HttpException)
                throw e;
            throw new common_1.BadRequestException(String((e === null || e === void 0 ? void 0 : e.message) || 'Stripe connectivity error'));
        }
    }
    publicKey() {
        const key = this.configService.get('STRIPE_PUBLIC_KEY') || '';
        return { key };
    }
    availability() {
        const secret = this.configService.get('STRIPE_SECRET_KEY') || '';
        const pub = this.configService.get('STRIPE_PUBLIC_KEY') || '';
        const enabled = !!secret;
        return { enabled, hasPublicKey: !!pub };
    }
    recaptchaKey() {
        const key = this.configService.get('RECAPTCHA_SITE_KEY') || process.env.RECAPTCHA_SITE_KEY || '';
        return { key };
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('intent'),
    (0, swagger_1.ApiOperation)({ summary: 'Create Stripe PaymentIntent (manual capture)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateIntentDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createIntent", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Stripe connectivity status' }),
    (0, common_1.Post)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "status", null);
__decorate([
    (0, common_1.Get)('public-key'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Stripe publishable key for frontend' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "publicKey", null);
__decorate([
    (0, common_1.Get)('availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if card payments are enabled on server' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "availability", null);
__decorate([
    (0, common_1.Get)('recaptcha-key'),
    (0, swagger_1.ApiOperation)({ summary: 'Get reCAPTCHA site key for frontend' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "recaptchaKey", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('payments'),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService, config_1.ConfigService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map