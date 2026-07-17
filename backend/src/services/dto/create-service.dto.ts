import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ description: 'Service name', example: 'Haircut & Style' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ description: 'Duration in minutes', example: 45 })
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @ApiProperty({ description: 'Price in integer cents', example: 5500 })
  @IsInt()
  @Min(0)
  priceCents: number;
}
