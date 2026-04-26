import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Product } from '../products/entities/product.entity';
import { Quote } from '../quotes/entities/quote.entity';
import { Order } from '../orders/entities/order.entity';
import { ContentBlock } from '../cms/entities/content-block.entity';

const isProduction = process.env.NODE_ENV === 'production';
const host = process.env.PGHOST || process.env.PGHOST_PUBLIC || 'localhost';
const port = Number(process.env.PGPORT || 5432);
const username = process.env.PGUSER || 'postgres';
const password = process.env.PGPASSWORD || '';
const database = process.env.PGDATABASE || 'railway';

export default new DataSource({
  type: 'postgres',
  host,
  port,
  username,
  password,
  database,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  entities: [User, Company, Product, Quote, Order, ContentBlock],
  migrations: ['dist/migrations/*.js', 'src/migrations/*.ts'],
  synchronize: false,
  logging: false,
});
