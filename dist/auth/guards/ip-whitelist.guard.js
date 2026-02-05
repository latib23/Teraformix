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
var IpWhitelistGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpWhitelistGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const cms_service_1 = require("../../cms/cms.service");
const user_entity_1 = require("../../users/entities/user.entity");
let IpWhitelistGuard = IpWhitelistGuard_1 = class IpWhitelistGuard {
    constructor(cmsService, reflector) {
        this.cmsService = cmsService;
        this.reflector = reflector;
        this.logger = new common_1.Logger(IpWhitelistGuard_1.name);
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || (user.role !== user_entity_1.UserRole.SUPER_ADMIN && user.role !== user_entity_1.UserRole.SALESPERSON)) {
            return true;
        }
        const settings = await this.cmsService.getContent('security');
        if (!settings) {
            return true;
        }
        const allowedIps = [];
        if (settings.allowPkIp && typeof settings.allowPkIp === 'string' && settings.allowPkIp.trim()) {
            allowedIps.push(settings.allowPkIp.trim());
        }
        if (settings.allowedIps && Array.isArray(settings.allowedIps)) {
            settings.allowedIps.forEach((ip) => {
                if (ip && typeof ip === 'string' && ip.trim()) {
                    allowedIps.push(ip.trim());
                }
            });
        }
        if (allowedIps.length === 0) {
            return true;
        }
        const clientIp = this.getClientIp(request);
        if (clientIp === '127.0.0.1' || clientIp === '::1') {
            return true;
        }
        const isAllowed = allowedIps.some(ip => ip === clientIp);
        if (isAllowed) {
            return true;
        }
        this.logger.warn(`Blocked access for user ${user.email} (${user.role}) from IP ${clientIp}. Whitelisted: ${allowedIps.join(', ')}`);
        throw new common_1.ForbiddenException(`Access denied. Your IP (${clientIp}) is not whitelisted for administrative access.`);
    }
    getClientIp(req) {
        var _a;
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]).trim();
            if (ip.startsWith('::ffff:'))
                return ip.substring(7);
            return ip;
        }
        let ip = ((_a = req.connection) === null || _a === void 0 ? void 0 : _a.remoteAddress) || req.ip || '';
        if (ip.startsWith('::ffff:'))
            ip = ip.substring(7);
        return ip;
    }
};
exports.IpWhitelistGuard = IpWhitelistGuard;
exports.IpWhitelistGuard = IpWhitelistGuard = IpWhitelistGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cms_service_1.CmsService,
        core_1.Reflector])
], IpWhitelistGuard);
//# sourceMappingURL=ip-whitelist.guard.js.map