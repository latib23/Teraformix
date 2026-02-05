import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserTargetDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  monthlyTarget?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  quarterlyTarget?: number;
}