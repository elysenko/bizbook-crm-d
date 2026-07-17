import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Client } from '../../core/models';
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

  // Data contract — cleared by mockup_cleaner, wired to /api/clients by service_agent.
  readonly clients = signal<Client[]>([
    { id: 'c1', name: 'Priya Nair', phone: '(415) 555-0132', email: 'priya.nair@example.com', notes: 'Prefers morning slots.', createdAt: '2026-02-11T10:00:00' },
    { id: 'c2', name: 'Marcus Bell', phone: '(415) 555-0177', email: 'marcus.b@example.com', notes: '', createdAt: '2026-03-02T10:00:00' },
    { id: 'c3', name: 'Elena Duarte', phone: '(628) 555-0199', email: 'elena.duarte@example.com', notes: 'Allergic to ammonia dyes.', createdAt: '2026-03-20T10:00:00' },
    { id: 'c4', name: 'Tom Fletcher', phone: '(510) 555-0143', email: '', notes: '', createdAt: '2026-04-08T10:00:00' },
    { id: 'c5', name: 'Aisha Khan', phone: '(415) 555-0164', email: 'aisha.khan@example.com', notes: 'Referral from Elena.', createdAt: '2026-05-15T10:00:00' },
  ]);

  // modal state derived from query params
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
      phone: ['', [Validators.required]],
      email: ['', [Validators.email]],
      notes: [''],
    });
  }

  ngOnInit(): void {
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
    const value = this.form.value as Omit<Client, 'id' | 'createdAt'>;
    if (this.modalMode === 'edit' && this.editingId) {
      const id = this.editingId;
      this.clients.update((list) => list.map((c) => (c.id === id ? { ...c, ...value } : c)));
    } else {
      this.clients.update((list) => [
        { id: 'tmp-' + list.length, createdAt: '2026-07-17T10:00:00', ...value },
        ...list,
      ]);
    }
    this.closeModal();
  }

  remove(client: Client): void {
    this.clients.update((list) => list.filter((c) => c.id !== client.id));
  }
}
