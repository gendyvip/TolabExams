import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  showAlert = false;
  alertMessage = '';
  alertType = 'error';
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private titleService: Title,
    private metaService: Meta
  ) { }

  ngOnInit() {
    this.titleService.setTitle('TolabExams | Login');
    this.metaService.updateTag({ name: 'description', content: 'Sign in to your account on our exam platform. Access your dashboard, take exams, and manage your educational resources.' });
    this.metaService.updateTag({ name: 'keywords', content: 'login, sign in, exam platform, student login, teacher login, education platform' });
  }

  loginForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/),
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  get getEmail() {
    return this.loginForm.get('email');
  }
  get getPassword() {
    return this.loginForm.get('password');
  }

  navigateToSignUp() {
    this.router.navigate(['/signup']);
  }

  showAlertMessage(message: string, type: 'success' | 'error') {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => {
      this.showAlert = false;
    }, 3500);
  }

  login() {
    console.log('login clicked');

    if (this.loginForm.status === 'VALID') {
      const email = this.getEmail?.value;
      const password = this.getPassword?.value;
      if (email && password) {
        this.isLoading = true;
        this.authService
          .login({
            email,
            password,
          })
          .subscribe({
            next: (res: any) => {
              const role = res.user?.role;
              console.log('Logged in as role:', role);

              if (role === 'student') {
                this.showAlertMessage('Login successful! Redirecting to student dashboard...', 'success');
                setTimeout(() => {
                  this.router.navigate(['/student/dashboard']);
                }, 1500);
              } else if (role === 'teacher') {
                this.showAlertMessage('Login successful! Redirecting to teacher dashboard...', 'success');
                setTimeout(() => {
                  this.router.navigate(['/teacher/dashboard']);
                }, 1500);
              } else {
                this.showAlertMessage('Unknown role or not stored yet.', 'error');
              }
            },
            error: (err) => {
              this.isLoading = false;
              console.log('login error', err);
              if (err.status === 0) {
                this.showAlertMessage('Unable to connect to the server. Please check if the server is running.', 'error');
              } else if (err.status === 400) {
                this.showAlertMessage('Invalid email or password. Please try again.', 'error');
              } else {
                this.showAlertMessage('An error occurred. Please try again later.', 'error');
              }
              this.loginForm.reset();
            },
            complete: () => {
              this.isLoading = false;
            }
          });
      }
    } else {
      this.loginForm.markAllAsTouched();
      this.showAlertMessage('Please fill in all required fields correctly.', 'error');
    }
  }
}
