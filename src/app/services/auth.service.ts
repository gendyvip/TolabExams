import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'https://tolabexams-backend.onrender.com/api/v1/users';
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  private isLoggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  private currentUser$ = new BehaviorSubject<any>(this.getUser());
  private avatarPreview: string | null = null;

  // Add currentUserValue property
  get currentUserValue() {
    return this.currentUser$.value;
  }

  constructor(private http: HttpClient) { }

  login(credentials: { email: string; password: string }) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.token && res.user) {
          localStorage.setItem(this.tokenKey, res.token);
          localStorage.setItem(this.userKey, JSON.stringify(res.user));
          this.isLoggedIn$.next(true);
          this.currentUser$.next(res.user);
        }
      })
    );
  }

  register(credentials: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
  }) {
    return this.http.post<any>(`${this.apiUrl}/signup`, credentials).pipe(
      tap((res) => {
        if (res.user) {
          this.isLoggedIn$.next(true);
          this.currentUser$.next(res.user);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isLoggedIn$.next(false);
    this.currentUser$.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getUser(): any {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  getUserRole(): string | null {
    const user = this.getUser();
    return user ? user.role : null;
  }

  isLoggedInObservable(): Observable<boolean> {
    return this.isLoggedIn$.asObservable();
  }

  updateProfile(data: any): Observable<any> {
    const token = this.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.patch<any>(`${this.apiUrl}/me`, data, { headers }).pipe(
      tap((res) => {
        if (res.user) {
          this.currentUser$.next(res.user);
          localStorage.setItem(this.userKey, JSON.stringify(res.user));
          this.avatarPreview = null;
        }
      })
    );
  }

  deleteAccount(): Observable<any> {
    const token = this.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.delete<any>(`${this.apiUrl}/me`, { headers }).pipe(
      tap(() => {
        this.logout();
      })
    );
  }
}
