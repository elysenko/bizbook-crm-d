import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment, RevenueSummary } from '../../core/models';
import { RevenueService } from '../../core/services/revenue.service';
import { formatCents, formatDate, formatTime } from '../../core/format';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue.component.html',
  styleUrl: './revenue.component.css',
})
export class RevenueComponent implements OnInit {
  readonly formatCents = formatCents;
  readonly formatDate = formatDate;
  readonly formatTime = formatTime;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Live data loaded from GET /api/v1/revenue/summary.
  readonly summary = signal<RevenueSummary>({
    weekCents: 0,
    weekCount: 0,
    monthCents: 0,
    monthCount: 0,
    weekLabel: '',
    monthLabel: '',
  });

  // Completed appointments that make up the current-week total (supporting detail).
  readonly weekCompleted = signal<Appointment[]>([]);

  constructor(private revenue: RevenueService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.revenue.summary().subscribe({
      next: (data) => {
        const { weekCompleted, ...summary } = data;
        this.summary.set(summary);
        this.weekCompleted.set(weekCompleted ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load revenue summary. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
