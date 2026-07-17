import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemSetting } from '../../core/models';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
})
export class AdminSettingsComponent {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly savedService = signal<string | null>(null);

  // Data contract — cleared by mockup_cleaner, wired to GET/PATCH /api/admin/settings by service_agent.
  readonly settings = signal<SystemSetting[]>([
    {
      service: 'postgresql',
      label: 'PostgreSQL',
      description: 'Primary application database connection.',
      configured: true,
      fields: [
        { key: 'POSTGRES_HOST', label: 'Host', value: 'db.internal.bizbook.app', secret: false, placeholder: 'localhost' },
        { key: 'POSTGRES_PORT', label: 'Port', value: '5432', secret: false, placeholder: '5432' },
        { key: 'POSTGRES_DB', label: 'Database', value: 'bizbook', secret: false, placeholder: 'bizbook' },
        { key: 'POSTGRES_USER', label: 'User', value: 'bizbook_app', secret: false, placeholder: 'app_user' },
        { key: 'POSTGRES_PASSWORD', label: 'Password', value: '••••••••••', secret: true, placeholder: 'Set a password' },
      ],
    },
    {
      service: 'minio',
      label: 'MinIO Object Storage',
      description: 'S3-compatible storage for exports and attachments.',
      configured: false,
      fields: [
        { key: 'MINIO_ENDPOINT', label: 'Endpoint', value: '', secret: false, placeholder: 'minio.internal:9000' },
        { key: 'MINIO_BUCKET', label: 'Bucket', value: '', secret: false, placeholder: 'bizbook-files' },
        { key: 'MINIO_ACCESS_KEY', label: 'Access key', value: '', secret: false, placeholder: 'Access key' },
        { key: 'MINIO_SECRET_KEY', label: 'Secret key', value: '', secret: true, placeholder: 'Secret key' },
      ],
    },
  ]);

  save(service: SystemSetting): void {
    // Mock persistence — flag the service as configured and show a transient confirmation.
    this.settings.update((list) =>
      list.map((s) =>
        s.service === service.service
          ? { ...s, configured: s.fields.every((f) => f.value.trim().length > 0) }
          : s,
      ),
    );
    this.savedService.set(service.service);
  }
}
