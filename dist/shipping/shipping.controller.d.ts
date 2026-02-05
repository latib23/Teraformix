import { ShippingService } from './shipping.service';
declare class GetRatesDto {
    address: {
        postalCode: string;
        country: string;
        city: string;
        state: string;
    };
    items: any[];
}
export declare class ShippingController {
    private readonly shippingService;
    constructor(shippingService: ShippingService);
    getRates(body: GetRatesDto): Promise<import("../lib/shipping-utils").ShippingRate[]>;
}
export {};
