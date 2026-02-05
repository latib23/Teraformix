import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    private verifyRecaptcha;
    createGuest(createOrderDto: CreateOrderDto, req: any): Promise<import("./entities/order.entity").Order>;
    create(createOrderDto: CreateOrderDto, req: any): Promise<import("./entities/order.entity").Order>;
    findAll(): Promise<import("./entities/order.entity").Order[]>;
    findMyOrders(req: any): Promise<import("./entities/order.entity").Order[]>;
    findMyBuyerOrders(req: any): Promise<import("./entities/order.entity").Order[]>;
    findOne(id: string, req: any): Promise<import("./entities/order.entity").Order>;
    update(id: string, body: any, req: any): Promise<import("./entities/order.entity").Order>;
    trackOrder(body: {
        referenceNumber: string;
        email: string;
    }): Promise<{
        found: boolean;
        data?: undefined;
    } | {
        found: boolean;
        data: {
            id: string;
            referenceNumber: string;
            status: import("./entities/order.entity").OrderStatus;
            trackingNumber: string;
            carrier: string;
            total: number;
            createdAt: Date;
            shippingAddress: any;
        };
    }>;
    syncToAirtable(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    syncToXero(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
