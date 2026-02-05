import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getAdminStats() {
    const totalRevenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'sum')
      .getRawOne();
    
    const totalRevenue = parseFloat(totalRevenueResult.sum) || 0;

    const totalOrders = await this.orderRepository.count();
    const totalCustomers = await this.userRepository.count();
    const lowStockCount = await this.productRepository.count({ where: { stockLevel: LessThan(10) } });
    
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

  async getSalesStats(userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Salesperson not found');

    const now = new Date();
    
    // Calculate Start of Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculate Start of Quarter
    const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
    const startOfQuarter = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);

    // Query Monthly Sales
    const monthlyResult = await this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.total)', 'total')
        .where('order.salespersonId = :userId', { userId })
        .andWhere('order.createdAt >= :startOfMonth', { startOfMonth })
        .getRawOne();

    // Query Quarterly Sales
    const quarterlyResult = await this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.total)', 'total')
        .where('order.salespersonId = :userId', { userId })
        .andWhere('order.createdAt >= :startOfQuarter', { startOfQuarter })
        .getRawOne();

    const monthlyValue = parseFloat(monthlyResult.total) || 0;
    const quarterlyValue = parseFloat(quarterlyResult.total) || 0;

    // Monthly Calcs
    const monthlyTarget = user.target;
    const monthlyProgress = monthlyTarget > 0 ? Math.min(100, (monthlyValue / monthlyTarget) * 100) : 0;

    // Quarterly Calcs
    const quarterlyTarget = user.quarterlyTarget || (monthlyTarget * 3); // Fallback if quarterly not set
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
}