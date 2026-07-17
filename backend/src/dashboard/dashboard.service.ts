import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { APP_TZ, todayRange } from 'src/common/dates';
import {
  APPOINTMENT_INCLUDE,
  AppointmentView,
  toAppointmentView,
} from 'src/appointments/appointments.service';
import { AppointmentStatus } from '@generated/prisma/client';

export interface TodayDashboard {
  date: string; // YYYY-MM-DD in APP_TZ
  appointments: AppointmentView[];
  remaining: number; // BOOKED appointments still ahead today
  completed: number;
  total: number;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async today(now: Date = new Date()): Promise<TodayDashboard> {
    const range = todayRange(now, APP_TZ);

    const appointments = await this.prisma.appointment.findMany({
      where: { startTime: { gte: range.start, lt: range.end } },
      include: APPOINTMENT_INCLUDE,
      orderBy: { startTime: 'asc' },
    });

    const views = appointments.map(toAppointmentView);

    // "Remaining" = still-booked appointments whose start time is in the future.
    const remaining = appointments.filter(
      (a) => a.status === AppointmentStatus.BOOKED && a.startTime.getTime() >= now.getTime(),
    ).length;
    const completed = appointments.filter(
      (a) => a.status === AppointmentStatus.COMPLETED,
    ).length;

    const dateLabel = new Intl.DateTimeFormat('en-CA', {
      timeZone: APP_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    return {
      date: dateLabel,
      appointments: views,
      remaining,
      completed,
      total: views.length,
    };
  }
}
