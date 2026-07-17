import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, RevenueSummary } from '../models';

export interface RevenueSummaryResponse extends RevenueSummary {
  weekCompleted: Appointment[];
}

/** REST client for the NestJS `/revenue` resource (ADMIN reporting). */
@Injectable({ providedIn: 'root' })
export class RevenueService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/revenue`;

  summary(): Observable<RevenueSummaryResponse> {
    return this.http.get<RevenueSummaryResponse>(`${this.base}/summary`);
  }
}
