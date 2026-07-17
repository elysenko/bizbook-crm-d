import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Client id', format: 'uuid' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: 'Service id', format: 'uuid' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    description: 'Appointment start time (ISO 8601)',
    example: '2026-07-17T09:00:00.000Z',
  })
  @IsString()
  @IsDateString()
  startTime: string;
}
