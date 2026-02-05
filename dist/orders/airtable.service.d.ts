import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { Product } from '../products/entities/product.entity';
export declare class AirtableService {
    private configService;
    private productRepository;
    private orderRepository;
    private readonly logger;
    private base;
    private formsBase;
    private customersTable;
    private ordersTable;
    private leadsTable;
    constructor(configService: ConfigService, productRepository: Repository<Product>, orderRepository: Repository<Order>);
    createOrderRecord(order: Order): Promise<void>;
    createLeadRecord(data: any): Promise<void>;
}
