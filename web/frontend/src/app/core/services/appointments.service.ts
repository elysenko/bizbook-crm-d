import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, AppointmentStatus } from '../models';

export interface AppointmentQuery {
  status?: AppointmentStatus;
  date?: string; // YYYY-MM-DD
}

export interface CreateAppointmentInput {
  clientId: string;
  serviceId: string;
  startTime: string; // ISO 8601
}

/** REST client for the NestJS `/appointments` resource. */
@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/appointments`;

  list(query: AppointmentQuery = {}): Observable<Appointment[]> {
    let params = new HttpParams();
    if (query.status) params = params.set('status', query.status);
    if (query.date) params = params.set('date', query.date);
    return this.http.get<Appointment[]>(this.base, { params });
  }

  create(dto: CreateAppointmentInput): Observable<Appointment> {
    return this.http.post<Appointment>(this.base, dto);
  }

  updateStatus(id: string, status: 'COMPLETED' | 'CANCELLED'): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.base}/${id}/status`, { status });
  }
}
