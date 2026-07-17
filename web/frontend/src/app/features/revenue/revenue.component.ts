import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment, RevenueSummary } from '../../core/models';
import { formatCents, formatDate, formatTime } from '../../core/format';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue.component.html',
  styleUrl: './revenue.component.css',
})
export class RevenueComponent {
  readonly formatCents = formatCents;
  readonly formatDate = formatDate;
  readonly formatTime = formatTime;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Data contract — cleared by mockup_cleaner, wired to /api/revenue/summary by service_agent.
  readonly summary = signal<RevenueSummary>({
    weekCents: 22500,
    weekCount: 5,
    monthCents: 89400,
    monthCount: 21,
    weekLabel: 'Mon Jul 13 – Sun Jul 19',
    monthLabel: 'July 2026',
  });

  // Completed appointments that make up the current-week total (supporting detail).
  readonly weekCompleted = signal<Appointment[]>([
    { id: 'a2', clientId: 'c2', clientName: 'Marcus Bell', serviceId: 's2', serviceName: 'Beard Trim', priceCents: 2500, durationMinutes: 20, startTime: '2026-07-17T09:30:00', status: 'COMPLETED', createdByName: 'Sam Rivera', createdAt: '' },
    { id: 'a6', clientId: 'c2', clientName: 'Marcus Bell', serviceId: 's5', serviceName: 'Blowout', priceCents: 4500, durationMinutes: 40, startTime: '2026-07-15T10:00:00', status: 'COMPLETED', createdByName: 'Sam Rivera', createdAt: '' },
    { id: 'a7', clientId: 'c1', clientName: 'Priya Nair', serviceId: 's1', serviceName: 'Haircut & Style', priceCents: 5500, durationMinutes: 45, startTime: '2026-07-14T13:00:00', status: 'COMPLETED', createdByName: 'Alex Morgan', createdAt: '' },
    { id: 'a8', clientId: 'c3', clientName: 'Elena Duarte', serviceId: 's4', serviceName: 'Deep Conditioning', priceCents: 4000, durationMinutes: 30, startTime: '2026-07-14T15:30:00', status: 'COMPLETED', createdByName: 'Alex Morgan', createdAt: '' },
    { id: 'a9', clientId: 'c4', clientName: 'Tom Fletcher', serviceId: 's5', serviceName: 'Blowout', priceCents: 4500, durationMinutes: 40, startTime: '2026-07-13T11:00:00', status: 'COMPLETED', createdByName: 'Sam Rivera', createdAt: '' },
  ]);
}
