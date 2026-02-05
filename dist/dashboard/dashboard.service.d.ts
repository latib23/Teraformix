import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
export declare class DashboardService {
    private orderRepository;
    private userRepository;
    private productRepository;
    constructor(orderRepository: Repository<Order>, userRepository: Repository<User>, productRepository: Repository<Product>);
    getAdminStats(): Promise<{
        totalRevenue: number;
        totalOrders: number;
        totalCustomers: number;
        lowStockCount: number;
        recentOrders: Order[];
    }>;
    getSalesStats(userId: string): Promise<{
        monthly: {
            value: number;
            target: number;
            progress: number;
            remaining: number;
        };
        quarterly: {
            value: number;
            target: number;
            progress: number;
            remaining: number;
        };
    }>;
}
