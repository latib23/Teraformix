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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("./orders.service");
const create_order_dto_1 = require("./dto/create-order.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const ip_whitelist_guard_1 = require("../auth/guards/ip-whitelist.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
let OrdersController = class OrdersController {
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async verifyRecaptcha(req, token) {
        var _a;
        const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
        if (!isProduction)
            return true;
        const enforce = String(process.env.RECAPTCHA_ENFORCE || 'false').toLowerCase() === 'true';
        if (!enforce)
            return true;
        const secret = process.env.RECAPTCHA_SECRET || '';
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
    async createGuest(createOrderDto, req) {
        const ok = await this.verifyRecaptcha(req, createOrderDto.recaptchaToken);
        if (!ok)
            throw new common_1.BadRequestException('recaptcha_failed');
        return this.ordersService.create(createOrderDto);
    }
    async create(createOrderDto, req) {
        const ok = await this.verifyRecaptcha(req, createOrderDto.recaptchaToken);
        if (!ok)
            throw new common_1.BadRequestException('recaptcha_failed');
        const creatorId = req.user.userId;
        return this.ordersService.create(createOrderDto, creatorId);
    }
    findAll() {
        return this.ordersService.findAll();
    }
    findMyOrders(req) {
        const salespersonId = req.user.userId;
        return this.ordersService.findBySalesperson(salespersonId);
    }
    findMyBuyerOrders(req) {
        const email = req.user.email;
        return this.ordersService.findByBuyerEmail(email);
    }
    findOne(id, req) {
        return this.ordersService.findAccessible(id, req.user);
    }
    async update(id, body, req) {
        const allowed = {};
        if (body.status)
            allowed.status = body.status;
        if (typeof body.trackingNumber === 'string')
            allowed.trackingNumber = body.trackingNumber.trim();
        if (typeof body.carrier === 'string')
            allowed.carrier = body.carrier.trim();
        return this.ordersService.updateOrder(id, allowed, req.user);
    }
    async trackOrder(body) {
        const ref = (body.referenceNumber || '').trim();
        const email = (body.email || '').toLowerCase();
        if (!ref || !email) {
            return { found: false };
        }
        const all = await this.ordersService.findAll();
        const refNorm = ref.replace(/\s+/g, '').toUpperCase();
        const match = all.find(o => {
            var _a;
            const shipEmail = (((_a = o.shippingAddress) === null || _a === void 0 ? void 0 : _a.email) || '').toLowerCase();
            const human2 = o.friendlyId.toUpperCase();
            const dt = o.createdAt ? new Date(o.createdAt) : new Date();
            const yyyy = String(dt.getFullYear());
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            const idPart = String(o.id || '').replace(/-/g, '').slice(0, 4).toUpperCase();
            const human4 = `ORD-${yyyy}${mm}${dd}-${idPart}`.toUpperCase();
            const idExact = String(o.id || '').toUpperCase();
            const idShort = idPart;
            const byRef = refNorm === idExact || refNorm === human2 || refNorm === human4 || refNorm === idShort;
            return byRef && shipEmail === email;
        });
        if (!match)
            return { found: false };
        return {
            found: true,
            data: {
                id: match.id,
                referenceNumber: match.friendlyId,
                status: match.status,
                trackingNumber: match.trackingNumber || null,
                carrier: match.carrier || null,
                total: match.total,
                createdAt: match.createdAt,
                shippingAddress: match.shippingAddress || null,
            }
        };
    }
    async syncToAirtable(id) {
        await this.ordersService.syncToAirtable(id);
        return { success: true, message: 'Order synced to Airtable successfully' };
    }
    async syncToXero(id) {
        await this.ordersService.syncToXero(id);
        return { success: true, message: 'Order synced to Xero successfully' };
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)('guest'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new order (guest checkout)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "createGuest", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.SALESPERSON, user_entity_1.UserRole.BUYER),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new order (from admin or sales portal)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, ip_whitelist_guard_1.IpWhitelistGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get all orders (Admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my-orders'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SALESPERSON),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, ip_whitelist_guard_1.IpWhitelistGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get orders created by the current salesperson' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findMyOrders", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.BUYER),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get orders placed by the current buyer (by email)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findMyBuyerOrders", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.SALESPERSON, user_entity_1.UserRole.BUYER),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, ip_whitelist_guard_1.IpWhitelistGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single order by ID (access controlled)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.SALESPERSON),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Update order fields (status, trackingNumber, carrier)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('track'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Public tracking lookup for orders by reference and email' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "trackOrder", null);
__decorate([
    (0, common_1.Post)(':id/sync-airtable'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.SALESPERSON),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Manually sync an order to Airtable' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "syncToAirtable", null);
__decorate([
    (0, common_1.Post)(':id/sync-xero'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.SALESPERSON),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Manually sync an order to Xero' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "syncToXero", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('orders'),
    (0, common_1.Controller)('orders'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map