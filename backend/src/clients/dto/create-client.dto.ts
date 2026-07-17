import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ description: 'Client full name', example: 'Priya Nair' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ description: 'Contact phone', example: '(415) 555-0132' })
  @IsString()
  @MinLength(1)
  phone: string;

  @ApiProperty({ description: 'Email', required: false, example: 'priya@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Free-form notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
