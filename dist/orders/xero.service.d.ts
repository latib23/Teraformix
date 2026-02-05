import { ConfigService } from '@nestjs/config';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
export declare class XeroService {
    private configService;
    private orderRepository;
    private readonly logger;
    private accessToken;
    private tokenExpiry;
    constructor(configService: ConfigService, orderRepository: Repository<Order>);
    private getAccessToken;
    private makeRequest;
    syncOrder(order: Order): Promise<void>;
    private ensureContact;
    private createInvoice;
}
