import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/**
 * A BOOKED appointment may only transition to COMPLETED or CANCELLED (ADMIN action).
 */
export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: ['COMPLETED', 'CANCELLED'], example: 'COMPLETED' })
  @IsIn(['COMPLETED', 'CANCELLED'])
  status: 'COMPLETED' | 'CANCELLED';
}
