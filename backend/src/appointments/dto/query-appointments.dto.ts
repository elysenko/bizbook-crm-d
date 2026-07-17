import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, Matches } from 'class-validator';

export class QueryAppointmentsDto {
  @ApiPropertyOptional({ enum: ['BOOKED', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsIn(['BOOKED', 'COMPLETED', 'CANCELLED'])
  status?: 'BOOKED' | 'COMPLETED' | 'CANCELLED';

  @ApiPropertyOptional({ description: 'Filter by calendar day (YYYY-MM-DD)', example: '2026-07-17' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date?: string;
}
