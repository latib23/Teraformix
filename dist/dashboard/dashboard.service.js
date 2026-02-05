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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../orders/entities/order.entity");
const user_entity_1 = require("../users/entities/user.entity");
const product_entity_1 = require("../products/entities/product.entity");
let DashboardService = class DashboardService {
    constructor(orderRepository, userRepository, productRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }
    async getAdminStats() {
        const totalRevenueResult = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.total)', 'sum')
            .getRawOne();
        const totalRevenue = parseFloat(totalRevenueResult.sum) || 0;
        const totalOrders = await this.orderRepository.count();
        const totalCustomers = await this.userRepository.count();
        const lowStockCount = await this.productRepository.count({ where: { stockLevel: (0, typeorm_2.LessThan)(10) } });
        const recentOrders = await this.orderRepository.find({
            take: 5,
            order: { createdAt: 'DESC' },
            relations: ['company'],
        });
        return {
            totalRevenue,
            totalOrders,
            totalCustomers,
            lowStockCount,
            recentOrders,
        };
    }
    async getSalesStats(userId) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user)
            throw new common_1.NotFoundException('Salesperson not found');
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
        const startOfQuarter = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
        const monthlyResult = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.total)', 'total')
            .where('order.salespersonId = :userId', { userId })
            .andWhere('order.createdAt >= :startOfMonth', { startOfMonth })
            .getRawOne();
        const quarterlyResult = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.total)', 'total')
            .where('order.salespersonId = :userId', { userId })
            .andWhere('order.createdAt >= :startOfQuarter', { startOfQuarter })
            .getRawOne();
        const monthlyValue = parseFloat(monthlyResult.total) || 0;
        const quarterlyValue = parseFloat(quarterlyResult.total) || 0;
        const monthlyTarget = user.target;
        const monthlyProgress = monthlyTarget > 0 ? Math.min(100, (monthlyValue / monthlyTarget) * 100) : 0;
        const quarterlyTarget = user.quarterlyTarget || (monthlyTarget * 3);
        const quarterlyProgress = quarterlyTarget > 0 ? Math.min(100, (quarterlyValue / quarterlyTarget) * 100) : 0;
        return {
            monthly: {
                value: monthlyValue,
                target: monthlyTarget,
                progress: monthlyProgress,
                remaining: Math.max(0, monthlyTarget - monthlyValue)
            },
            quarterly: {
                value: quarterlyValue,
                target: quarterlyTarget,
                progress: quarterlyProgress,
                remaining: Math.max(0, quarterlyTarget - quarterlyValue)
            }
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map