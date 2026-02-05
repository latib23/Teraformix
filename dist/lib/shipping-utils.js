"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWeight = parseWeight;
function parseWeight(weightStr) {
    if (!weightStr)
        return { value: 1, units: 'pounds' };
    const normalized = weightStr.toLowerCase().trim();
    const value = parseFloat(normalized.replace(/[^0-9.]/g, ''));
    if (isNaN(value))
        return { value: 1, units: 'pounds' };
    if (normalized.includes('kg') || normalized.includes('kilogram')) {
        return { value: value * 1000, units: 'grams' };
    }
    if (normalized.includes('oz') || normalized.includes('ounce')) {
        return { value: value, units: 'ounces' };
    }
    return { value: value, units: 'pounds' };
}
//# sourceMappingURL=shipping-utils.js.map