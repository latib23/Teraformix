
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseWeight, ShippingRate } from '../lib/shipping-utils';
import { Buffer } from 'buffer';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl = 'https://ssapi.shipstation.com';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SHIPSTATION_API_KEY') || 'qIYmy/is6UizBm+jR6Eqg7JIz7TI6jSvvFX5Wo2CzvI';
    this.apiSecret = this.configService.get<string>('SHIPSTATION_API_SECRET') || ''; 
  }

  private getTotalWeightInOz(items: any[]): number {
    let totalWeightVal = 0;
    items.forEach(item => {
      const { value, units } = parseWeight(item.weight);
      let weightInOz = value;
      if (units === 'pounds') weightInOz = value * 16;
      if (units === 'grams') weightInOz = value * 0.035274;
      totalWeightVal += (weightInOz * (item.quantity || 1));
    });
    return totalWeightVal === 0 ? 16 : totalWeightVal; // Default to 1lb if weightless
  }

  async getRates(destination: { postalCode: string; country: string; city?: string; state?: string }, items: any[]): Promise<ShippingRate[]> {
    const totalWeightInOz = this.getTotalWeightInOz(items);
    const isInternational = destination.country && destination.country !== 'US';

    try {
      const payload: any = {
        carrierCode: null,
        fromPostalCode: '78701',
        toPostalCode: destination.postalCode,
        toCountry: destination.country || 'US',
        toCity: destination.city,
        weight: { value: totalWeightInOz, units: "ounces" },
        dimensions: { length: 12, width: 12, height: 10, units: "inches" },
        confirmation: "delivery"
      };

      // Conditionally add state to prevent errors with international addresses
      if (destination.state) {
        payload.toState = destination.state;
      }

      const authHeader = `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`;
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
        if (isInternational) return this.getInternationalFallbackRates(totalWeightInOz);
        return this.getFallbackRates(totalWeightInOz);
      }

      const data = await response.json();
      const allRates: ShippingRate[] = data.map((r: any) => ({
        serviceName: r.serviceName,
        serviceCode: r.serviceCode,
        shipmentCost: r.shipmentCost,
        otherCost: r.otherCost,
        carrierCode: r.carrierCode,
        transitDays: r.transitDays || undefined
      }));

      if (isInternational) {
          // Sort by cost to easily find cheapest and most expensive/fastest
          const sorted = allRates.sort((a, b) => a.shipmentCost - b.shipmentCost);
          
          // If API returned data, we attempt to find distinct economy and priority
          if (sorted.length > 0) {
              const economy = sorted[0];
              const priority = sorted[sorted.length - 1];
              
              // Ensure we rename them for clarity as requested
              return [
                  { ...economy, serviceName: 'International Economy' },
                  { ...priority, serviceName: 'International Priority', serviceCode: priority.serviceCode !== economy.serviceCode ? priority.serviceCode : 'INTL_PRI_ALT' }
              ];
          } else {
              return this.getInternationalFallbackRates(totalWeightInOz);
          }
      }

      // --- Domestic Filter: find cheapest for 2-day and overnight ---
      const finalRates: ShippingRate[] = [
        {
          serviceName: 'Standard Ground',
          serviceCode: 'GND_FREE',
          shipmentCost: 0,
          otherCost: 0,
          carrierCode: 'fedex',
          transitDays: 5,
        },
      ];

      const twoDayRates = allRates.filter(r => 
          r.serviceName.toLowerCase().includes('2day') || 
          r.serviceName.toLowerCase().includes('2 day') ||
          r.serviceName.toLowerCase().includes('second day')
      );
      if (twoDayRates.length > 0) {
        const cheapestTwoDay = twoDayRates.reduce((prev, current) => 
            (prev.shipmentCost < current.shipmentCost) ? prev : current
        );
        finalRates.push(cheapestTwoDay);
      }

      const overnightRates = allRates.filter(r => 
          r.serviceName.toLowerCase().includes('overnight') || 
          r.serviceName.toLowerCase().includes('next day') ||
          r.serviceName.toLowerCase().includes('1 day')
      );
      if (overnightRates.length > 0) {
        const cheapestOvernight = overnightRates.reduce((prev, current) => 
            (prev.shipmentCost < current.shipmentCost) ? prev : current
        );
        finalRates.push(cheapestOvernight);
      }

      return finalRates;

    } catch (error) {
      this.logger.error('Failed to fetch shipping rates', error);
      if (isInternational) return this.getInternationalFallbackRates(totalWeightInOz);
      return this.getFallbackRates(totalWeightInOz);
    }
  }

  private getFallbackRates(weightInOz: number): ShippingRate[] {
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

  private getInternationalFallbackRates(weightInOz: number): ShippingRate[] {
      const pounds = weightInOz / 16;
      // Base rates + per pound cost
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
}
