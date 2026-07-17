import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Client } from '../../core/models';
import { ClientsService, ClientInput } from '../../core/services/clients.service';
import { ModalComponent } from '../../components/modal/modal.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css',
})
export class ClientsComponent implements OnInit {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Live data loaded from GET /api/v1/clients.
  readonly clients = signal<Client[]>([]);

  // modal state derived from query params
  modalMode: 'create' | 'edit' | null = null;
  editingId: string | null = null;
  saving = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private clientsApi: ClientsService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      email: ['', [Validators.email]],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.load();
    this.route.queryParamMap.subscribe((params) => {
      const modal = params.get('modal');
      this.editingId = params.get('id');
      if (modal === 'create') {
        this.modalMode = 'create';
        this.form.reset({ name: '', phone: '', email: '', notes: '' });
      } else if (modal === 'edit' && this.editingId) {
        const existing = this.clients().find((c) => c.id === this.editingId);
        this.modalMode = 'edit';
        this.form.reset({
          name: existing?.name ?? '',
          phone: existing?.phone ?? '',
          email: existing?.email ?? '',
          notes: existing?.notes ?? '',
        });
      } else {
        this.modalMode = null;
      }
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.clientsApi.list().subscribe({
      next: (list) => {
        this.clients.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load clients. Please try again.');
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.router.navigate([], { queryParams: { modal: 'create' } });
  }
  openEdit(client: Client): void {
    this.router.navigate([], { queryParams: { modal: 'edit', id: client.id } });
  }
  closeModal(): void {
    this.router.navigate([], { queryParams: {} });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    const dto: ClientInput = {
      name: value.name,
      phone: value.phone,
      ...(value.email ? { email: value.email } : {}),
      ...(value.notes ? { notes: value.notes } : {}),
    };
    this.saving = true;
    this.error.set(null);
    const request =
      this.modalMode === 'edit' && this.editingId
        ? this.clientsApi.update(this.editingId, dto)
        : this.clientsApi.create(dto);
    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.error.set(err?.error?.message ?? 'Could not save client. Please try again.');
      },
    });
  }

  remove(client: Client): void {
    this.error.set(null);
    this.clientsApi.remove(client.id).subscribe({
      next: () => this.load(),
      error: (err) =>
        this.error.set(err?.error?.message ?? 'Could not delete client. Please try again.'),
    });
  }
}
