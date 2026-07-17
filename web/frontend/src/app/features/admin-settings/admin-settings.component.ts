import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemSetting } from '../../core/models';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
})
export class AdminSettingsComponent implements OnInit {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly savedService = signal<string | null>(null);
  savingService: string | null = null;

  // Live data loaded from GET /api/v1/admin/settings.
  readonly settings = signal<SystemSetting[]>([]);

  constructor(private settingsApi: SettingsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.settingsApi.list().subscribe({
      next: (list) => {
        this.settings.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load service settings. Please try again.');
        this.loading.set(false);
      },
    });
  }

  save(service: SystemSetting): void {
    this.savingService = service.service;
    this.savedService.set(null);
    this.error.set(null);
    const fields = service.fields.map((f) => ({ key: f.key, value: f.value }));
    this.settingsApi.update(service.service, fields).subscribe({
      next: (list) => {
        this.settings.set(list);
        this.savingService = null;
        this.savedService.set(service.service);
      },
      error: (err) => {
        this.savingService = null;
        this.error.set(err?.error?.message ?? 'Could not save settings. Please try again.');
      },
    });
  }
}
