import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Appointment, AppointmentStatus, Client, Service } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ModalComponent } from '../../components/modal/modal.component';
import { formatCents, formatTime, formatDate, formatDuration } from '../../core/format';

type StatusFilter = 'ALL' | AppointmentStatus;

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.css',
})
export class AppointmentsComponent implements OnInit {
  readonly formatCents = formatCents;
  readonly formatTime = formatTime;
  readonly formatDate = formatDate;
  readonly formatDuration = formatDuration;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statusFilters: StatusFilter[] = ['ALL', 'BOOKED', 'COMPLETED', 'CANCELLED'];
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly dateFilter = signal<string>('');

  // Data contract — cleared by mockup_cleaner, wired to /api/appointments by service_agent.
  readonly appointments = signal<Appointment[]>([
    { id: 'a1', clientId: 'c1', clientName: 'Priya Nair', serviceId: 's1', serviceName: 'Haircut & Style', priceCents: 5500, durationMinutes: 45, startTime: '2026-07-17T09:00:00', status: 'BOOKED', createdByName: 'Sam Rivera', createdAt: '2026-07-16T12:00:00' },
    { id: 'a2', clientId: 'c2', clientName: 'Marcus Bell', serviceId: 's2', serviceName: 'Beard Trim', priceCents: 2500, durationMinutes: 20, startTime: '2026-07-17T09:30:00', status: 'COMPLETED', createdByName: 'Sam Rivera', createdAt: '2026-07-16T12:05:00' },
    { id: 'a3', clientId: 'c3', clientName: 'Elena Duarte', serviceId: 's3', serviceName: 'Color Treatment', priceCents: 12000, durationMinutes: 90, startTime: '2026-07-17T11:00:00', status: 'BOOKED', createdByName: 'Alex Morgan', createdAt: '2026-07-16T12:10:00' },
    { id: 'a4', clientId: 'c4', clientName: 'Tom Fletcher', serviceId: 's1', serviceName: 'Haircut & Style', priceCents: 5500, durationMinutes: 45, startTime: '2026-07-18T14:15:00', status: 'BOOKED', createdByName: 'Sam Rivera', createdAt: '2026-07-16T12:15:00' },
    { id: 'a5', clientId: 'c5', clientName: 'Aisha Khan', serviceId: 's4', serviceName: 'Deep Conditioning', priceCents: 4000, durationMinutes: 30, startTime: '2026-07-16T16:00:00', status: 'CANCELLED', createdByName: 'Alex Morgan', createdAt: '2026-07-15T12:20:00' },
    { id: 'a6', clientId: 'c2', clientName: 'Marcus Bell', serviceId: 's5', serviceName: 'Blowout', priceCents: 4500, durationMinutes: 40, startTime: '2026-07-15T10:00:00', status: 'COMPLETED', createdByName: 'Sam Rivera', createdAt: '2026-07-14T12:20:00' },
  ]);

  // Reference data for the booking form.
  readonly clients = signal<Client[]>([
    { id: 'c1', name: 'Priya Nair', phone: '(415) 555-0132', createdAt: '' },
    { id: 'c2', name: 'Marcus Bell', phone: '(415) 555-0177', createdAt: '' },
    { id: 'c3', name: 'Elena Duarte', phone: '(628) 555-0199', createdAt: '' },
    { id: 'c4', name: 'Tom Fletcher', phone: '(510) 555-0143', createdAt: '' },
    { id: 'c5', name: 'Aisha Khan', phone: '(415) 555-0164', createdAt: '' },
  ]);
  readonly services = signal<Service[]>([
    { id: 's1', name: 'Haircut & Style', durationMinutes: 45, priceCents: 5500, createdAt: '' },
    { id: 's2', name: 'Beard Trim', durationMinutes: 20, priceCents: 2500, createdAt: '' },
    { id: 's3', name: 'Color Treatment', durationMinutes: 90, priceCents: 12000, createdAt: '' },
    { id: 's4', name: 'Deep Conditioning', durationMinutes: 30, priceCents: 4000, createdAt: '' },
    { id: 's5', name: 'Blowout', durationMinutes: 40, priceCents: 4500, createdAt: '' },
  ]);

  readonly filtered = computed(() => {
    const status = this.statusFilter();
    const date = this.dateFilter();
    return this.appointments()
      .filter((a) => (status === 'ALL' ? true : a.status === status))
      .filter((a) => (date ? a.startTime.slice(0, 10) === date : true))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  bookOpen = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public auth: AuthService,
  ) {
    this.form = this.fb.group({
      clientId: ['', [Validators.required]],
      serviceId: ['', [Validators.required]],
      date: ['2026-07-18', [Validators.required]],
      time: ['10:00', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.statusFilter.set((params.get('status') as StatusFilter) ?? 'ALL');
      this.dateFilter.set(params.get('date') ?? '');
      this.bookOpen = params.get('modal') === 'book';
    });
  }

  setStatus(status: StatusFilter): void {
    this.router.navigate([], {
      queryParams: { status: status === 'ALL' ? null : status },
      queryParamsHandling: 'merge',
    });
  }

  onDateChange(value: string): void {
    this.router.navigate([], {
      queryParams: { date: value || null },
      queryParamsHandling: 'merge',
    });
  }

  clearFilters(): void {
    this.router.navigate([], { queryParams: {} });
  }

  openBook(): void {
    this.router.navigate([], { queryParams: { modal: 'book' }, queryParamsHandling: 'merge' });
  }
  closeBook(): void {
    this.router.navigate([], { queryParams: { modal: null }, queryParamsHandling: 'merge' });
  }

  book(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { clientId, serviceId, date, time } = this.form.value;
    const client = this.clients().find((c) => c.id === clientId);
    const service = this.services().find((s) => s.id === serviceId);
    if (!client || !service) return;
    this.appointments.update((list) => [
      {
        id: 'tmp-' + list.length,
        clientId,
        clientName: client.name,
        serviceId,
        serviceName: service.name,
        priceCents: service.priceCents,
        durationMinutes: service.durationMinutes,
        startTime: `${date}T${time}:00`,
        status: 'BOOKED',
        createdByName: this.auth.user()?.name ?? 'You',
        createdAt: '2026-07-17T10:00:00',
      },
      ...list,
    ]);
    this.closeBook();
  }

  setAppointmentStatus(appt: Appointment, status: AppointmentStatus): void {
    this.appointments.update((list) =>
      list.map((a) => (a.id === appt.id ? { ...a, status } : a)),
    );
  }
}
