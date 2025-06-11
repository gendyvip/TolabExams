import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // adjust the path if needed

@Injectable({
  providedIn: 'root',
})
export class TeacherGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.authService.getToken();
    const role = this.authService.getUserRole();

    if (token && role === 'teacher') {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
