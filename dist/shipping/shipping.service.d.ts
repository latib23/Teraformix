import { ConfigService } from '@nestjs/config';
import { ShippingRate } from '../lib/shipping-utils';
export declare class ShippingService {
    private configService;
    private readonly logger;
    private readonly apiKey;
    private readonly apiSecret;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    private getTotalWeightInOz;
    getRates(destination: {
        postalCode: string;
        country: string;
        city?: string;
        state?: string;
    }, items: any[]): Promise<ShippingRate[]>;
    private getFallbackRates;
    private getInternationalFallbackRates;
}
