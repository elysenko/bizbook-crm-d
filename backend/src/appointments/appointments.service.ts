import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { APP_TZ, dateStringRange } from 'src/common/dates';
import { AppointmentStatus, Prisma } from '@generated/prisma/client';

/**
 * Flattened appointment shape consumed by the Angular frontend (`core/models.ts`).
 */
export interface AppointmentView {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  priceCents: number;
  durationMinutes: number;
  startTime: string;
  status: AppointmentStatus;
  createdByName: string;
  createdAt: string;
}

export const APPOINTMENT_INCLUDE = {
  client: true,
  service: true,
  createdBy: true,
} satisfies Prisma.AppointmentInclude;

export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof APPOINTMENT_INCLUDE;
}>;

export function toAppointmentView(appt: AppointmentWithRelations): AppointmentView {
  return {
    id: appt.id,
    clientId: appt.clientId,
    clientName: appt.client?.name ?? '',
    serviceId: appt.serviceId,
    serviceName: appt.service?.name ?? '',
    priceCents: appt.service?.priceCents ?? 0,
    durationMinutes: appt.service?.durationMinutes ?? 0,
    startTime: appt.startTime.toISOString(),
    status: appt.status,
    createdByName: appt.createdBy?.name ?? '',
    createdAt: appt.createdAt.toISOString(),
  };
}

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryAppointmentsDto): Promise<AppointmentView[]> {
    const where: Prisma.AppointmentWhereInput = {};

    if (query.status) {
      where.status = query.status as AppointmentStatus;
    }

    if (query.date) {
      const range = dateStringRange(query.date, APP_TZ);
      if (!range) throw new BadRequestException('Invalid date filter');
      where.startTime = { gte: range.start, lt: range.end };
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: APPOINTMENT_INCLUDE,
      orderBy: { startTime: 'asc' },
    });
    return appointments.map(toAppointmentView);
  }

  async findOne(id: string): Promise<AppointmentView> {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: APPOINTMENT_INCLUDE,
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    return toAppointmentView(appt);
  }

  async create(dto: CreateAppointmentDto, createdById: string): Promise<AppointmentView> {
    // Validate referenced entities exist so we can return a clean 400 instead of a raw FK error.
    const [client, service] = await Promise.all([
      this.prisma.client.findUnique({ where: { id: dto.clientId } }),
      this.prisma.service.findUnique({ where: { id: dto.serviceId } }),
    ]);
    if (!client) throw new BadRequestException('Client not found');
    if (!service) throw new BadRequestException('Service not found');

    const appt = await this.prisma.appointment.create({
      data: {
        clientId: dto.clientId,
        serviceId: dto.serviceId,
        startTime: new Date(dto.startTime),
        status: AppointmentStatus.BOOKED,
        createdById,
      },
      include: APPOINTMENT_INCLUDE,
    });
    return toAppointmentView(appt);
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto): Promise<AppointmentView> {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Appointment not found');

    if (existing.status !== AppointmentStatus.BOOKED) {
      throw new BadRequestException(
        `Only BOOKED appointments can be updated (current status: ${existing.status})`,
      );
    }

    const appt = await this.prisma.appointment.update({
      where: { id },
      data: { status: dto.status as AppointmentStatus },
      include: APPOINTMENT_INCLUDE,
    });
    return toAppointmentView(appt);
  }
}
