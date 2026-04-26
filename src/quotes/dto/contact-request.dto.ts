import { IsEmail, IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContactRequestDto {
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

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(40)
    phone?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(160)
    company?: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(160)
    subject: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    message: string;
}
