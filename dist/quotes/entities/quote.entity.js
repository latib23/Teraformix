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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quote = exports.QuoteType = exports.QuoteStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var QuoteStatus;
(function (QuoteStatus) {
    QuoteStatus["PENDING"] = "PENDING";
    QuoteStatus["REVIEWED"] = "REVIEWED";
    QuoteStatus["ACCEPTED"] = "ACCEPTED";
    QuoteStatus["REJECTED"] = "REJECTED";
    QuoteStatus["AWAITING_PAYMENT"] = "AWAITING_PAYMENT";
    QuoteStatus["PAID"] = "PAID";
})(QuoteStatus || (exports.QuoteStatus = QuoteStatus = {}));
var QuoteType;
(function (QuoteType) {
    QuoteType["STANDARD_CART"] = "STANDARD_CART";
    QuoteType["CONCIERGE"] = "CONCIERGE";
    QuoteType["BULK_QUOTE"] = "BULK_QUOTE";
    QuoteType["BOM_UPLOAD"] = "BOM_UPLOAD";
    QuoteType["QUOTE_BEATING"] = "QUOTE_BEATING";
    QuoteType["ABANDONED_CHECKOUT"] = "ABANDONED_CHECKOUT";
    QuoteType["ABANDONED_FORM"] = "ABANDONED_FORM";
    QuoteType["CONTACT_US"] = "CONTACT_US";
})(QuoteType || (exports.QuoteType = QuoteType = {}));
let Quote = class Quote {
};
exports.Quote = Quote;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Quote.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_number', unique: true }),
    __metadata("design:type", String)
], Quote.prototype, "referenceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: QuoteType, default: QuoteType.STANDARD_CART }),
    __metadata("design:type", String)
], Quote.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.quotes, { nullable: true }),
    __metadata("design:type", user_entity_1.User)
], Quote.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], Quote.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'submission_data' }),
    __metadata("design:type", Object)
], Quote.prototype, "submissionData", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Quote.prototype, "guestName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Quote.prototype, "guestEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Quote.prototype, "guestPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Quote.prototype, "guestCompany", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.PENDING }),
    __metadata("design:type", String)
], Quote.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'negotiated_total', type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Quote.prototype, "negotiatedTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_terms', nullable: true }),
    __metadata("design:type", String)
], Quote.prototype, "paymentTerms", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Quote.prototype, "createdAt", void 0);
exports.Quote = Quote = __decorate([
    (0, typeorm_1.Entity)()
], Quote);
//# sourceMappingURL=quote.entity.js.map