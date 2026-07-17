import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Service } from '../../core/models';
import { ModalComponent } from '../../components/modal/modal.component';
import { formatCents, formatDuration } from '../../core/format';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
})
export class ServicesComponent implements OnInit {
  readonly formatCents = formatCents;
  readonly formatDuration = formatDuration;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Data contract — cleared by mockup_cleaner, wired to /api/services by service_agent.
  readonly services = signal<Service[]>([
    { id: 's1', name: 'Haircut & Style', durationMinutes: 45, priceCents: 5500, createdAt: '2026-01-05T10:00:00' },
    { id: 's2', name: 'Beard Trim', durationMinutes: 20, priceCents: 2500, createdAt: '2026-01-05T10:00:00' },
    { id: 's3', name: 'Color Treatment', durationMinutes: 90, priceCents: 12000, createdAt: '2026-01-05T10:00:00' },
    { id: 's4', name: 'Deep Conditioning', durationMinutes: 30, priceCents: 4000, createdAt: '2026-01-05T10:00:00' },
    { id: 's5', name: 'Blowout', durationMinutes: 40, priceCents: 4500, createdAt: '2026-01-05T10:00:00' },
  ]);

  modalMode: 'create' | 'edit' | null = null;
  editingId: string | null = null;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      durationMinutes: [30, [Validators.required, Validators.min(5)]],
      priceDollars: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const modal = params.get('modal');
      this.editingId = params.get('id');
      if (modal === 'create') {
        this.modalMode = 'create';
        this.form.reset({ name: '', durationMinutes: 30, priceDollars: 0 });
      } else if (modal === 'edit' && this.editingId) {
        const existing = this.services().find((s) => s.id === this.editingId);
        this.modalMode = 'edit';
        this.form.reset({
          name: existing?.name ?? '',
          durationMinutes: existing?.durationMinutes ?? 30,
          priceDollars: existing ? existing.priceCents / 100 : 0,
        });
      } else {
        this.modalMode = null;
      }
    });
  }

  openCreate(): void {
    this.router.navigate([], { queryParams: { modal: 'create' } });
  }
  openEdit(service: Service): void {
    this.router.navigate([], { queryParams: { modal: 'edit', id: service.id } });
  }
  closeModal(): void {
    this.router.navigate([], { queryParams: {} });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, durationMinutes, priceDollars } = this.form.value;
    const priceCents = Math.round(Number(priceDollars) * 100);
    if (this.modalMode === 'edit' && this.editingId) {
      const id = this.editingId;
      this.services.update((list) =>
        list.map((s) =>
          s.id === id ? { ...s, name, durationMinutes: Number(durationMinutes), priceCents } : s,
        ),
      );
    } else {
      this.services.update((list) => [
        {
          id: 'tmp-' + list.length,
          name,
          durationMinutes: Number(durationMinutes),
          priceCents,
          createdAt: '2026-07-17T10:00:00',
        },
        ...list,
      ]);
    }
    this.closeModal();
  }

  remove(service: Service): void {
    this.services.update((list) => list.filter((s) => s.id !== service.id));
  }
}
