import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Quote } from '../../quotes/entities/quote.entity';
import { Order } from '../../orders/entities/order.entity';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  BUYER = 'BUYER',
  SALESPERSON = 'SALESPERSON',
  BLOG_MANAGER = 'BLOG_MANAGER',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.BUYER })
  role: UserRole;

  @Column('simple-array', { nullable: true })
  permissions: string[];

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  target: number; // Monthly Target

  @Column({ name: 'quarterly_target', type: 'decimal', precision: 12, scale: 2, default: 0 })
  quarterlyTarget: number;

  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  company: Company;

  @OneToMany(() => Quote, (quote) => quote.user)
  quotes: Quote[];

  @OneToMany(() => Order, (order) => order.salesperson)
  createdOrders: Order[];
}