import { OrdersService } from './orders.service';
import { ConfigService } from '@nestjs/config';
declare class CreateIntentDto {
    amount?: number;
    currency?: string;
    items?: Array<{
        sku: string;
        quantity: number;
    }>;
    address?: {
        postalCode: string;
        country: string;
        city: string;
        state: string;
    };
    serviceCode?: string;
    metadata?: Record<string, any>;
    recaptchaToken?: string;
}
export declare class PaymentsController {
    private readonly ordersService;
    private readonly configService;
    constructor(ordersService: OrdersService, configService: ConfigService);
    private verifyRecaptcha;
    createIntent(body: CreateIntentDto, req: any): Promise<{
        clientSecret: string;
        id: string;
        status: import("stripe").Stripe.PaymentIntent.Status;
    }>;
    status(): Promise<{
        ok: boolean;
        id: string;
        status: import("stripe").Stripe.PaymentIntent.Status;
    }>;
    publicKey(): {
        key: string;
    };
    availability(): {
        enabled: boolean;
        hasPublicKey: boolean;
    };
    recaptchaKey(): {
        key: string;
    };
}
export {};
