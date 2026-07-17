import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Service } from '../../core/models';
import { CatalogService, ServiceInput } from '../../core/services/catalog.service';
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

  // Live data loaded from GET /api/v1/services.
  readonly services = signal<Service[]>([]);

  modalMode: 'create' | 'edit' | null = null;
  editingId: string | null = null;
  saving = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private catalog: CatalogService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      durationMinutes: [30, [Validators.required, Validators.min(5)]],
      priceDollars: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.load();
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

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.catalog.list().subscribe({
      next: (list) => {
        this.services.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load services. Please try again.');
        this.loading.set(false);
      },
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
    const dto: ServiceInput = {
      name,
      durationMinutes: Number(durationMinutes),
      priceCents: Math.round(Number(priceDollars) * 100),
    };
    this.saving = true;
    this.error.set(null);
    const request =
      this.modalMode === 'edit' && this.editingId
        ? this.catalog.update(this.editingId, dto)
        : this.catalog.create(dto);
    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.error.set(err?.error?.message ?? 'Could not save service. Please try again.');
      },
    });
  }

  remove(service: Service): void {
    this.error.set(null);
    this.catalog.remove(service.id).subscribe({
      next: () => this.load(),
      error: (err) =>
        this.error.set(err?.error?.message ?? 'Could not delete service. Please try again.'),
    });
  }
}
