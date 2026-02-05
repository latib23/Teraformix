"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const company_entity_1 = require("../companies/entities/company.entity");
const product_entity_1 = require("../products/entities/product.entity");
const quote_entity_1 = require("../quotes/entities/quote.entity");
const order_entity_1 = require("../orders/entities/order.entity");
const content_block_entity_1 = require("../cms/entities/content-block.entity");
const isProduction = process.env.NODE_ENV === 'production';
const host = process.env.PGHOST || process.env.PGHOST_PUBLIC || 'localhost';
const port = Number(process.env.PGPORT || 5432);
const username = process.env.PGUSER || 'postgres';
const password = process.env.PGPASSWORD || '';
const database = process.env.PGDATABASE || 'railway';
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    entities: [user_entity_1.User, company_entity_1.Company, product_entity_1.Product, quote_entity_1.Quote, order_entity_1.Order, content_block_entity_1.ContentBlock],
    migrations: ['dist/migrations/*.js', 'src/migrations/*.ts'],
    synchronize: false,
    logging: false,
});
//# sourceMappingURL=data-source.js.map