import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string;

  @Index()
  @Column()
  name: string;

  @Index()
  @Column({ nullable: true })
  brand: string;

  @Index()
  @Column({ nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  image: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ name: 'stock_level', type: 'int' })
  stockLevel: number;

  @Column({ nullable: true })
  weight: string; // e.g., "45 lbs"

  @Column({ nullable: true })
  dimensions: string; // e.g., "10 x 10 x 5 inches"

  @Column({ type: 'jsonb', default: {} })
  attributes: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  schema: Record<string, any>;

  @Column({ type: 'jsonb', name: 'tier_prices', nullable: true })
  tierPrices: Array<{ qty: number; price: number }>;

  @Column('text', { array: true, default: [] })
  compatibleIds: string[];

  // Extended Fields
  @Column({ type: 'text', nullable: true })
  overview: string;

  @Column({ nullable: true })
  warranty: string;

  @Column({ type: 'text', nullable: true })
  compatibility: string;

  @Column({ nullable: true })
  datasheet: string;

  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true })
  metaDescription: string;

  @Column({ type: 'text', nullable: true })
  redirectTo: string;

  @Column({ type: 'boolean', default: true })
  redirectPermanent: boolean;

  @Column({ type: 'boolean', default: false })
  showPrice: boolean;
}
