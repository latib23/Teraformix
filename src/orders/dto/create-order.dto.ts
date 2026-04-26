import { IsEnum, IsNumber, IsOptional, IsString, IsArray, IsObject, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod } from '../entities/order.entity';

export class CreateOrderDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  paymentMethodId?: string; // Stripe PaymentMethod ID

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @ApiProperty()
  @IsArray()
  items: any[];

  // For Admin use
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyId?: string;
  
  @ApiProperty({ enum: OrderStatus, required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
  
  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  shippingAddress?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  billingAddress?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recaptchaToken?: string;
}
