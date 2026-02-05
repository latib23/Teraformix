import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../users/entities/user.entity';

export enum OrderStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL', // Waiting for PO check
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  PO = 'PO', // Net 30 Terms
  BANK_TRANSFER = 'BANK_TRANSFER'
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company, (company) => company.orders, { nullable: true })
  company: Company;

  @ManyToOne(() => User, (user) => user.createdOrders, { nullable: true })
  salesperson: User;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ name: 'po_number', nullable: true })
  poNumber: string;

  @Column({ name: 'po_file_path', nullable: true })
  poFilePath: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PROCESSING })
  status: OrderStatus;

  // Fulfillment Details
  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber: string;

  @Column({ nullable: true })
  carrier: string; // e.g., 'FedEx', 'UPS'

  @Column({ type: 'jsonb' })
  items: any; // Snapshot of items at time of purchase

  @Column({ type: 'jsonb', name: 'shipping_address', nullable: true })
  shippingAddress: any;

  @Column({ type: 'jsonb', name: 'billing_address', nullable: true })
  billingAddress: any;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ name: 'airtable_record_id', nullable: true })
  airtableRecordId: string;

  @Column({ name: 'xero_invoice_id', nullable: true })
  xeroInvoiceId: string;

  get friendlyId(): string {
    const dt = this.createdAt ? new Date(this.createdAt) : new Date();
    const yy = String(dt.getFullYear()).slice(-2);
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const idPart = String(this.id || '').replace(/-/g, '').slice(0, 4).toUpperCase() || '0000';
    return `ORD-${yy}${mm}${dd}-${idPart}`;
  }
}
