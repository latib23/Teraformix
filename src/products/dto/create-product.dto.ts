import { IsString, IsNumber, IsNotEmpty, IsObject, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  basePrice: number;

  @ApiProperty()
  @IsNumber()
  stockLevel: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  weight?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dimensions?: string;

  @ApiProperty({ example: { interface: 'SAS', rpm: 15000 } })
  @IsObject()
  attributes: Record<string, any>;

  @ApiProperty({ example: [{ qty: 10, price: 100 }] })
  @IsOptional()
  @IsArray()
  tierPrices: Array<{ qty: number; price: number }>;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  showPrice?: boolean;
}
