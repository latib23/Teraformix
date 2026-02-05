import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BomUploadRequestDto {
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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileName: string;
 
  @ApiProperty({ description: 'Base64 data URL of the uploaded file' })
  @IsString()
  @IsNotEmpty()
  fileContent: string;
  
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
