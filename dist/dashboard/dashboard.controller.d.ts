import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getAdminStats(): Promise<{
        totalRevenue: number;
        totalOrders: number;
        totalCustomers: number;
        lowStockCount: number;
        recentOrders: import("../orders/entities/order.entity").Order[];
    }>;
    getSalesStats(req: any): Promise<{
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
