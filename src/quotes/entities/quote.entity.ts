
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum QuoteStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAID = 'PAID'
}

export enum QuoteType {
  STANDARD_CART = 'STANDARD_CART', // Created via Cart checkout request
  CONCIERGE = 'CONCIERGE',         // "Can't find it?" widget
  BULK_QUOTE = 'BULK_QUOTE',       // Modal popup
  BOM_UPLOAD = 'BOM_UPLOAD',       // File upload page
  QUOTE_BEATING = 'QUOTE_BEATING', // PPC landing page quote beating form
  ABANDONED_CHECKOUT = 'ABANDONED_CHECKOUT', // User left checkout before submit
  ABANDONED_FORM = 'ABANDONED_FORM',          // User left any form before submit
  CONTACT_US = 'CONTACT_US'                // General Contact Us form
}

@Entity()
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reference_number', unique: true })
  referenceNumber: string;

  @Column({ type: 'enum', enum: QuoteType, default: QuoteType.STANDARD_CART })
  type: QuoteType;

  @ManyToOne(() => User, (user) => user.quotes, { nullable: true })
  user: User;

  // For standard cart quotes
  @Column({ type: 'jsonb', nullable: true })
  items: Array<{ productId: string; qty: number; requestedPrice?: number }>;

  // For other forms (BOM, Concierge) where structure varies
  @Column({ type: 'jsonb', nullable: true, name: 'submission_data' })
  submissionData: any;

  // Guest Contact Info (for users not logged in)
  @Column({ nullable: true })
  guestName: string;

  @Column({ nullable: true })
  guestEmail: string;

  @Column({ nullable: true })
  guestPhone: string;

  @Column({ nullable: true })
  guestCompany: string;

  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.PENDING })
  status: QuoteStatus;

  @Column({ name: 'negotiated_total', type: 'decimal', precision: 12, scale: 2, nullable: true })
  negotiatedTotal: number;

  @Column({ name: 'payment_terms', nullable: true })
  paymentTerms: string;

  @CreateDateColumn()
  createdAt: Date;
}
