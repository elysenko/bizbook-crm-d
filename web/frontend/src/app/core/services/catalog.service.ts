import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Service } from '../models';

export type ServiceInput = Pick<Service, 'name' | 'durationMinutes' | 'priceCents'>;

/** REST client for the NestJS `/services` resource (catalog of bookable services). */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/services`;

  list(): Observable<Service[]> {
    return this.http.get<Service[]>(this.base);
  }

  create(dto: ServiceInput): Observable<Service> {
    return this.http.post<Service>(this.base, dto);
  }

  update(id: string, dto: ServiceInput): Observable<Service> {
    return this.http.patch<Service>(`${this.base}/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
