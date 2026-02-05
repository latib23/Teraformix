"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const orders_service_1 = require("./orders.service");
const orders_controller_1 = require("./orders.controller");
const payments_controller_1 = require("./payments.controller");
const product_entity_1 = require("../products/entities/product.entity");
const shipping_module_1 = require("../shipping/shipping.module");
const order_entity_1 = require("./entities/order.entity");
const company_entity_1 = require("../companies/entities/company.entity");
const user_entity_1 = require("../users/entities/user.entity");
const notifications_module_1 = require("../notifications/notifications.module");
const cms_module_1 = require("../cms/cms.module");
const airtable_service_1 = require("./airtable.service");
const xero_service_1 = require("./xero.service");
let OrdersModule = class OrdersModule {
};
exports.OrdersModule = OrdersModule;
exports.OrdersModule = OrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([order_entity_1.Order, company_entity_1.Company, user_entity_1.User, product_entity_1.Product]),
            notifications_module_1.NotificationsModule,
            shipping_module_1.ShippingModule,
            cms_module_1.CmsModule,
        ],
        controllers: [orders_controller_1.OrdersController, payments_controller_1.PaymentsController],
        providers: [orders_service_1.OrdersService, airtable_service_1.AirtableService, xero_service_1.XeroService],
        exports: [airtable_service_1.AirtableService, orders_service_1.OrdersService, xero_service_1.XeroService],
    })
], OrdersModule);
//# sourceMappingURL=orders.module.js.map