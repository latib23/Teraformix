import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuoteBeatingRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;
  
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  company: string;
  
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, description: 'Part number for the item' })
  @IsOptional()
  @IsString()
  partNumber?: string;

  @ApiProperty({ required: false, description: 'Competitor price offered' })
  @IsOptional()
  @IsString()
  competitorPrice?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileName?: string;
 
  @ApiProperty({ required: false, description: 'Base64 data URL of the uploaded file' })
  @IsOptional()
  @IsString()
  fileContent?: string;
  
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
