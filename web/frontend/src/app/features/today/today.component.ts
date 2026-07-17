import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { formatCents, formatTime, formatDuration } from '../../core/format';

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './today.component.html',
  styleUrl: './today.component.css',
})
export class TodayComponent {
  readonly formatTime = formatTime;
  readonly formatCents = formatCents;
  readonly formatDuration = formatDuration;

  // Loading/error flags for the mockup's state coverage.
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Data contract: backend-provided data lives in a typed signal so mockup_cleaner + service_agent
  // can clear it and wire it to /api/dashboard/today.
  readonly appointments = signal<Appointment[]>([
    { id: 'a1', clientId: 'c1', clientName: 'Priya Nair', serviceId: 's1', serviceName: 'Haircut & Style', priceCents: 5500, durationMinutes: 45, startTime: '2026-07-17T09:00:00', status: 'BOOKED', createdByName: 'Sam Rivera', createdAt: '2026-07-16T12:00:00' },
    { id: 'a2', clientId: 'c2', clientName: 'Marcus Bell', serviceId: 's2', serviceName: 'Beard Trim', priceCents: 2500, durationMinutes: 20, startTime: '2026-07-17T09:30:00', status: 'COMPLETED', createdByName: 'Sam Rivera', createdAt: '2026-07-16T12:05:00' },
    { id: 'a3', clientId: 'c3', clientName: 'Elena Duarte', serviceId: 's3', serviceName: 'Color Treatment', priceCents: 12000, durationMinutes: 90, startTime: '2026-07-17T11:00:00', status: 'BOOKED', createdByName: 'Alex Morgan', createdAt: '2026-07-16T12:10:00' },
    { id: 'a4', clientId: 'c4', clientName: 'Tom Fletcher', serviceId: 's1', serviceName: 'Haircut & Style', priceCents: 5500, durationMinutes: 45, startTime: '2026-07-17T14:15:00', status: 'BOOKED', createdByName: 'Sam Rivera', createdAt: '2026-07-16T12:15:00' },
    { id: 'a5', clientId: 'c5', clientName: 'Aisha Khan', serviceId: 's4', serviceName: 'Deep Conditioning', priceCents: 4000, durationMinutes: 30, startTime: '2026-07-17T16:00:00', status: 'CANCELLED', createdByName: 'Alex Morgan', createdAt: '2026-07-16T12:20:00' },
  ]);

  readonly sorted = computed(() =>
    [...this.appointments()].sort((a, b) => a.startTime.localeCompare(b.startTime)),
  );
  readonly remaining = computed(
    () => this.appointments().filter((a) => a.status === 'BOOKED').length,
  );
  readonly completedToday = computed(
    () => this.appointments().filter((a) => a.status === 'COMPLETED').length,
  );

  constructor(public auth: AuthService) {}
}
