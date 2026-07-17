import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SystemSetting } from '../models';

export interface SettingFieldUpdate {
  key: string;
  value: string;
}

/** REST client for the NestJS `/admin/settings` resource (ADMIN service configuration). */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/settings`;

  list(): Observable<SystemSetting[]> {
    return this.http.get<SystemSetting[]>(this.base);
  }

  update(service: string, fields: SettingFieldUpdate[]): Observable<SystemSetting[]> {
    return this.http.patch<SystemSetting[]>(this.base, { service, fields });
  }
}
