import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { Auth, GetUser } from 'src/auth/decorators';
import { Role } from '@generated/prisma/client';
import { User } from 'src/user/entities/user.entity';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List appointments (filter by status / date)' })
  @Auth(Role.admin, Role.user)
  findAll(@Query() query: QueryAppointmentsDto) {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an appointment by id' })
  @Auth(Role.admin, Role.user)
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  // Both USER and ADMIN can book appointments.
  @Post()
  @ApiOperation({ summary: 'Book an appointment' })
  @Auth(Role.admin, Role.user)
  create(@Body() dto: CreateAppointmentDto, @GetUser() user: User) {
    return this.appointmentsService.create(dto, user.id);
  }

  // Only ADMIN can complete or cancel an appointment.
  @Patch(':id/status')
  @ApiOperation({ summary: 'Complete or cancel an appointment (ADMIN)' })
  @Auth(Role.admin)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.appointmentsService.updateStatus(id, dto);
  }
}
