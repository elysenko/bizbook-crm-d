import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { APP_TZ, monthLabel, monthRange, weekLabel, weekRange, Range } from 'src/common/dates';
import {
  APPOINTMENT_INCLUDE,
  AppointmentView,
  toAppointmentView,
} from 'src/appointments/appointments.service';
import { AppointmentStatus } from '@generated/prisma/client';

export interface RevenueSummary {
  weekCents: number;
  weekCount: number;
  monthCents: number;
  monthCount: number;
  weekLabel: string;
  monthLabel: string;
  weekCompleted: AppointmentView[];
}

@Injectable()
export class RevenueService {
  constructor(private prisma: PrismaService) {}

  private async completedInRange(range: Range) {
    return this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.COMPLETED,
        startTime: { gte: range.start, lt: range.end },
      },
      include: APPOINTMENT_INCLUDE,
      orderBy: { startTime: 'asc' },
    });
  }

  async summary(now: Date = new Date()): Promise<RevenueSummary> {
    const week = weekRange(now, APP_TZ);
    const month = monthRange(now, APP_TZ);

    const [weekAppts, monthAppts] = await Promise.all([
      this.completedInRange(week),
      this.completedInRange(month),
    ]);

    const sum = (appts: typeof weekAppts) =>
      appts.reduce((total, a) => total + (a.service?.priceCents ?? 0), 0);

    return {
      weekCents: sum(weekAppts),
      weekCount: weekAppts.length,
      monthCents: sum(monthAppts),
      monthCount: monthAppts.length,
      weekLabel: weekLabel(week, APP_TZ),
      monthLabel: monthLabel(month, APP_TZ),
      weekCompleted: weekAppts.map(toAppointmentView),
    };
  }
}
