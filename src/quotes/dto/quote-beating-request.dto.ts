import { IsEmail, IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuoteBeatingRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email: string;
  
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  company: string;
  
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({ required: false, description: 'Part number for the item' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  partNumber?: string;

  @ApiProperty({ required: false, description: 'Competitor price offered' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  competitorPrice?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;
 
  @ApiProperty({ required: false, description: 'Base64 data URL of the uploaded file' })
  @IsOptional()
  @IsString()
  @MaxLength(8_000_000)
  fileContent?: string;
  
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
