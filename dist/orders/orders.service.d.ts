import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import Stripe from 'stripe';
import { NotificationsService } from '../notifications/notifications.service';
import { Product } from '../products/entities/product.entity';
import { ShippingService } from '../shipping/shipping.service';
import { AirtableService } from './airtable.service';
import { XeroService } from './xero.service';
export declare class OrdersService {
    private orderRepository;
    private companyRepository;
    private userRepository;
    private productRepository;
    private configService;
    private notificationsService;
    private shippingService;
    private airtableService;
    private xeroService;
    private stripe;
    constructor(orderRepository: Repository<Order>, companyRepository: Repository<Company>, userRepository: Repository<User>, productRepository: Repository<Product>, configService: ConfigService, privatenotificationsService: NotificationsService, notificationsService: NotificationsService, shippingService: ShippingService, airtableService: AirtableService, xeroService: XeroService);
    createPaymentIntent(amountInCents: number, currency: string, metadata?: Record<string, any>): Promise<Stripe.Response<Stripe.PaymentIntent>>;
    calculateAmountCents(items: Array<{
        sku: string;
        quantity: number;
    }>, address: {
        postalCode: string;
        country: string;
        city: string;
        state: string;
    }, serviceCode?: string): Promise<number>;
    create(createOrderDto: CreateOrderDto, creatorId?: string): Promise<Order>;
    findAll(): Promise<Order[]>;
    findBySalesperson(salespersonId: string): Promise<Order[]>;
    findByBuyerEmail(email: string): Promise<Order[]>;
    findAccessible(id: string, user: {
        userId: string;
        role: string;
        email?: string;
    }): Promise<Order | null>;
    private getTrackingUrl;
    updateOrder(id: string, patch: Partial<Order>, user: {
        userId: string;
        role: string;
        email?: string;
    }): Promise<Order>;
    syncToAirtable(orderId: string): Promise<void>;
    syncToXero(orderId: string): Promise<void>;
}
