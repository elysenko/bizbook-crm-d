import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Appointment, AppointmentStatus, Client, Service } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentsService } from '../../core/services/appointments.service';
import { ClientsService } from '../../core/services/clients.service';
import { CatalogService } from '../../core/services/catalog.service';
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

  // Live data loaded from GET /api/v1/appointments.
  readonly appointments = signal<Appointment[]>([]);

  // Reference data for the booking form (GET /api/v1/clients and /api/v1/services).
  readonly clients = signal<Client[]>([]);
  readonly services = signal<Service[]>([]);

  readonly filtered = computed(() => {
    const status = this.statusFilter();
    const date = this.dateFilter();
    return this.appointments()
      .filter((a) => (status === 'ALL' ? true : a.status === status))
      .filter((a) => (date ? a.startTime.slice(0, 10) === date : true))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  bookOpen = false;
  saving = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public auth: AuthService,
    private appointmentsApi: AppointmentsService,
    private clientsApi: ClientsService,
    private catalog: CatalogService,
  ) {
    this.form = this.fb.group({
      clientId: ['', [Validators.required]],
      serviceId: ['', [Validators.required]],
      date: ['2026-07-18', [Validators.required]],
      time: ['10:00', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadReferenceData();
    this.load();
    this.route.queryParamMap.subscribe((params) => {
      this.statusFilter.set((params.get('status') as StatusFilter) ?? 'ALL');
      this.dateFilter.set(params.get('date') ?? '');
      this.bookOpen = params.get('modal') === 'book';
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.appointmentsApi.list().subscribe({
      next: (list) => {
        this.appointments.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load appointments. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private loadReferenceData(): void {
    this.clientsApi.list().subscribe({ next: (list) => this.clients.set(list) });
    this.catalog.list().subscribe({ next: (list) => this.services.set(list) });
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
    const startTime = new Date(`${date}T${time}:00`).toISOString();
    this.saving = true;
    this.error.set(null);
    this.appointmentsApi.create({ clientId, serviceId, startTime }).subscribe({
      next: () => {
        this.saving = false;
        this.closeBook();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.error.set(err?.error?.message ?? 'Could not book appointment. Please try again.');
      },
    });
  }

  setAppointmentStatus(appt: Appointment, status: AppointmentStatus): void {
    if (status !== 'COMPLETED' && status !== 'CANCELLED') return;
    this.error.set(null);
    this.appointmentsApi.updateStatus(appt.id, status).subscribe({
      next: () => this.load(),
      error: (err) =>
        this.error.set(err?.error?.message ?? 'Could not update appointment. Please try again.'),
    });
  }
}
