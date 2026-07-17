import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { formatCents, formatTime, formatDuration } from '../../core/format';

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './today.component.html',
  styleUrl: './today.component.css',
})
export class TodayComponent implements OnInit {
  readonly formatTime = formatTime;
  readonly formatCents = formatCents;
  readonly formatDuration = formatDuration;

  // Loading/error flags for the mockup's state coverage.
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Live data loaded from GET /api/v1/dashboard/today.
  readonly appointments = signal<Appointment[]>([]);
  private readonly remainingCount = signal(0);
  private readonly completedCount = signal(0);

  readonly sorted = computed(() =>
    [...this.appointments()].sort((a, b) => a.startTime.localeCompare(b.startTime)),
  );
  readonly remaining = this.remainingCount.asReadonly();
  readonly completedToday = this.completedCount.asReadonly();

  constructor(
    public auth: AuthService,
    private dashboard: DashboardService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboard.today().subscribe({
      next: (data) => {
        this.appointments.set(data.appointments);
        this.remainingCount.set(data.remaining);
        this.completedCount.set(data.completed);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load today’s schedule. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
