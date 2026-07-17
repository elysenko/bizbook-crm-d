import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Client } from '../models';

export type ClientInput = Pick<Client, 'name' | 'phone'> &
  Partial<Pick<Client, 'email' | 'notes'>>;

/** REST client for the NestJS `/clients` resource. */
@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/clients`;

  list(): Observable<Client[]> {
    return this.http.get<Client[]>(this.base);
  }

  create(dto: ClientInput): Observable<Client> {
    return this.http.post<Client>(this.base, dto);
  }

  update(id: string, dto: ClientInput): Observable<Client> {
    return this.http.patch<Client>(`${this.base}/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
