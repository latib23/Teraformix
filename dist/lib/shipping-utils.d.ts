export declare function parseWeight(weightStr: string | undefined): {
    value: number;
    units: 'pounds' | 'ounces' | 'grams';
};
export interface ShippingRate {
    serviceName: string;
    serviceCode: string;
    shipmentCost: number;
    otherCost: number;
    carrierCode: string;
    transitDays?: number;
}
