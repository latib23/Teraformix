/**
 * Parses a weight string (e.g., "45 lbs", "2 kg", "10 oz") into a value and unit object
 * compatible with ShipStation API preference (usually Ounces for precision).
 */
export function parseWeight(weightStr: string | undefined): { value: number; units: 'pounds' | 'ounces' | 'grams' } {
  if (!weightStr) return { value: 1, units: 'pounds' }; // Default fallback

  const normalized = weightStr.toLowerCase().trim();
  const value = parseFloat(normalized.replace(/[^0-9.]/g, ''));

  if (isNaN(value)) return { value: 1, units: 'pounds' };

  if (normalized.includes('kg') || normalized.includes('kilogram')) {
    // Convert kg to pounds (approx) for API consistency if needed, or return grams
    return { value: value * 1000, units: 'grams' };
  }
  
  if (normalized.includes('oz') || normalized.includes('ounce')) {
    return { value: value, units: 'ounces' };
  }

  // Default to pounds for "lbs", "lb", or unspecified
  return { value: value, units: 'pounds' };
}

export interface ShippingRate {
  serviceName: string;
  serviceCode: string;
  shipmentCost: number;
  otherCost: number;
  carrierCode: string;
  transitDays?: number;
}
