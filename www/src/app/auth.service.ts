import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly JWT_TOKEN = 'accessToken';
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this._isAuthenticated.asObservable();

  private httpClient = inject(HttpClient);
  private router = inject(Router);

  verifySession(): Observable<any> {
    return this.httpClient.post<{ accessToken: string }>('/api/token/refresh', {}).pipe(
      tap(response => {
        localStorage.setItem(this.JWT_TOKEN, response.accessToken);
        this._isAuthenticated.next(true);
      }),
      catchError(() => {
        localStorage.removeItem(this.JWT_TOKEN);
        this._isAuthenticated.next(false);
        return of(null);
      })
    );
  }

  requestLoginLink(email: string): Observable<unknown> {
    return this.httpClient.post('/api/login', { email });
  }

  verifyLogin(token: string): Observable<{ accessToken: string }> {
    return this.httpClient.get<{ accessToken: string }>(`/api/login?token=${token}`).pipe(
      tap(response => {
        localStorage.setItem(this.JWT_TOKEN, response.accessToken);
        this._isAuthenticated.next(true);
      })
    );
  }

  refreshToken(): Observable<{ accessToken: string }> {
    return this.httpClient.post<{ accessToken: string }>('/api/token/refresh', {}).pipe(
      tap(response => {
        localStorage.setItem(this.JWT_TOKEN, response.accessToken);
        this._isAuthenticated.next(true);
      })
    );
  }

  logout() {
    this.httpClient.post('/api/logout', {}).subscribe(() => {
      localStorage.removeItem(this.JWT_TOKEN);
      this._isAuthenticated.next(false);
      this.router.navigate(['/login']);
    });
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.JWT_TOKEN);
  }
}
