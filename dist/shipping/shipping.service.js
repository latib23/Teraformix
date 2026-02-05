"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ShippingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const shipping_utils_1 = require("../lib/shipping-utils");
const buffer_1 = require("buffer");
let ShippingService = ShippingService_1 = class ShippingService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ShippingService_1.name);
        this.baseUrl = 'https://ssapi.shipstation.com';
        this.apiKey = this.configService.get('SHIPSTATION_API_KEY') || 'qIYmy/is6UizBm+jR6Eqg7JIz7TI6jSvvFX5Wo2CzvI';
        this.apiSecret = this.configService.get('SHIPSTATION_API_SECRET') || '';
    }
    getTotalWeightInOz(items) {
        let totalWeightVal = 0;
        items.forEach(item => {
            const { value, units } = (0, shipping_utils_1.parseWeight)(item.weight);
            let weightInOz = value;
            if (units === 'pounds')
                weightInOz = value * 16;
            if (units === 'grams')
                weightInOz = value * 0.035274;
            totalWeightVal += (weightInOz * (item.quantity || 1));
        });
        return totalWeightVal === 0 ? 16 : totalWeightVal;
    }
    async getRates(destination, items) {
        const totalWeightInOz = this.getTotalWeightInOz(items);
        const isInternational = destination.country && destination.country !== 'US';
        try {
            const payload = {
                carrierCode: null,
                fromPostalCode: '78701',
                toPostalCode: destination.postalCode,
                toCountry: destination.country || 'US',
                toCity: destination.city,
                weight: { value: totalWeightInOz, units: "ounces" },
                dimensions: { length: 12, width: 12, height: 10, units: "inches" },
                confirmation: "delivery"
            };
            if (destination.state) {
                payload.toState = destination.state;
            }
            const authHeader = `Basic ${buffer_1.Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`;
            const response = await fetch(`${this.baseUrl}/shipments/getrates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`ShipStation API Error: ${response.status} - ${errorText}`);
                if (isInternational)
                    return this.getInternationalFallbackRates(totalWeightInOz);
                return this.getFallbackRates(totalWeightInOz);
            }
            const data = await response.json();
            const allRates = data.map((r) => ({
                serviceName: r.serviceName,
                serviceCode: r.serviceCode,
                shipmentCost: r.shipmentCost,
                otherCost: r.otherCost,
                carrierCode: r.carrierCode,
                transitDays: r.transitDays || undefined
            }));
            if (isInternational) {
                const sorted = allRates.sort((a, b) => a.shipmentCost - b.shipmentCost);
                if (sorted.length > 0) {
                    const economy = sorted[0];
                    const priority = sorted[sorted.length - 1];
                    return [
                        Object.assign(Object.assign({}, economy), { serviceName: 'International Economy' }),
                        Object.assign(Object.assign({}, priority), { serviceName: 'International Priority', serviceCode: priority.serviceCode !== economy.serviceCode ? priority.serviceCode : 'INTL_PRI_ALT' })
                    ];
                }
                else {
                    return this.getInternationalFallbackRates(totalWeightInOz);
                }
            }
            const finalRates = [
                {
                    serviceName: 'Standard Ground',
                    serviceCode: 'GND_FREE',
                    shipmentCost: 0,
                    otherCost: 0,
                    carrierCode: 'fedex',
                    transitDays: 5,
                },
            ];
            const twoDayRates = allRates.filter(r => r.serviceName.toLowerCase().includes('2day') ||
                r.serviceName.toLowerCase().includes('2 day') ||
                r.serviceName.toLowerCase().includes('second day'));
            if (twoDayRates.length > 0) {
                const cheapestTwoDay = twoDayRates.reduce((prev, current) => (prev.shipmentCost < current.shipmentCost) ? prev : current);
                finalRates.push(cheapestTwoDay);
            }
            const overnightRates = allRates.filter(r => r.serviceName.toLowerCase().includes('overnight') ||
                r.serviceName.toLowerCase().includes('next day') ||
                r.serviceName.toLowerCase().includes('1 day'));
            if (overnightRates.length > 0) {
                const cheapestOvernight = overnightRates.reduce((prev, current) => (prev.shipmentCost < current.shipmentCost) ? prev : current);
                finalRates.push(cheapestOvernight);
            }
            return finalRates;
        }
        catch (error) {
            this.logger.error('Failed to fetch shipping rates', error);
            if (isInternational)
                return this.getInternationalFallbackRates(totalWeightInOz);
            return this.getFallbackRates(totalWeightInOz);
        }
    }
    getFallbackRates(weightInOz) {
        const pounds = weightInOz / 16;
        const expressCost = 25 + (pounds * 1.50);
        const overnightCost = 45 + (pounds * 2.50);
        return [
            {
                serviceName: "Standard Ground",
                serviceCode: "GND_FREE",
                shipmentCost: 0,
                otherCost: 0,
                carrierCode: "fedex",
                transitDays: 5
            },
            {
                serviceName: "2-Day Air (Est)",
                serviceCode: "2day_fallback",
                shipmentCost: parseFloat(expressCost.toFixed(2)),
                otherCost: 0,
                carrierCode: "fedex",
                transitDays: 2
            },
            {
                serviceName: "Overnight (Est)",
                serviceCode: "on_fallback",
                shipmentCost: parseFloat(overnightCost.toFixed(2)),
                otherCost: 0,
                carrierCode: "fedex",
                transitDays: 1
            },
        ];
    }
    getInternationalFallbackRates(weightInOz) {
        const pounds = weightInOz / 16;
        const economyCost = 65.00 + (pounds * 6.50);
        const priorityCost = 120.00 + (pounds * 12.00);
        return [
            {
                serviceName: "International Economy",
                serviceCode: "INTL_ECO_FALLBACK",
                shipmentCost: parseFloat(economyCost.toFixed(2)),
                otherCost: 0,
                carrierCode: "fedex",
                transitDays: 10
            },
            {
                serviceName: "International Priority",
                serviceCode: "INTL_PRI_FALLBACK",
                shipmentCost: parseFloat(priorityCost.toFixed(2)),
                otherCost: 0,
                carrierCode: "fedex",
                transitDays: 4
            }
        ];
    }
};
exports.ShippingService = ShippingService;
exports.ShippingService = ShippingService = ShippingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ShippingService);
//# sourceMappingURL=shipping.service.js.map