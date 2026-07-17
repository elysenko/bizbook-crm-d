import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _user = signal<User | null>(this.readStoredUser());

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  private readStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private persistSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('access_token', token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
    this._token.set(token);
    this._user.set(user);
  }

  login(email: string, password: string): Observable<{ user: User; token: string }> {
    return this.http
      .post<{ user: User; token: string }>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.persistSession(res.token, res.user)));
  }

  signup(
    name: string,
    email: string,
    password: string,
  ): Observable<{ user: User; token: string }> {
    return this.http
      .post<{ user: User; token: string }>(`${this.apiUrl}/auth/signup`, {
        name,
        email,
        password,
      })
      .pipe(tap((res) => this.persistSession(res.token, res.user)));
  }

  /**
   * Demo Mode bypass — lets reviewers (and the screenshot capture system) inspect the full
   * authenticated UI without a live backend. Seeds a mock ADMIN session and lands on /today.
   */
  demoLogin(role: UserRole = 'ADMIN'): Observable<{ user: User; token: string }> {
    const user: User = {
      id: 'demo-' + role.toLowerCase(),
      name: role === 'ADMIN' ? 'Alex Morgan' : 'Sam Rivera',
      email: role === 'ADMIN' ? 'admin@bizbook.demo' : 'staff@bizbook.demo',
      role,
      createdAt: '2026-01-04T09:00:00.000Z',
    };
    const token = 'demo-token-' + role.toLowerCase();
    this.persistSession(token, user);
    return of({ user, token });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('access_token');
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('isAuthenticated');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }
}
