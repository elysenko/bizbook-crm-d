import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment } from '../models';

export interface TodayDashboard {
  date: string;
  appointments: Appointment[];
  remaining: number;
  completed: number;
  total: number;
}

/** REST client for the NestJS `/dashboard` resource (Front Desk "Today" view). */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/dashboard`;

  today(): Observable<TodayDashboard> {
    return this.http.get<TodayDashboard>(`${this.base}/today`);
  }
}
