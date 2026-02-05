import { OrderStatus, PaymentMethod } from '../entities/order.entity';
export declare class CreateOrderDto {
    total: number;
    paymentMethod: PaymentMethod;
    poNumber?: string;
    paymentMethodId?: string;
    items: any[];
    companyId?: string;
    status?: OrderStatus;
    shippingAddress?: any;
    billingAddress?: any;
    recaptchaToken?: string;
}
