// components/login/login.component.ts - Enhanced with modern UI/UX
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: 'login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  submitAttempted = false;
  production = false; // Set based on environment

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === 'Enter') {
        this.onSubmit();
      }
    });
  }

  onSubmit(): void {
    this.submitAttempted = true;

    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      this.showValidationErrors();
      return;
    }

    this.loading = true;
    const { username, password, rememberMe } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (response) => {
        this.loading = false;

        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }

        this.router.navigate(['/dashboard']);
        this.snackBar.open('Welcome back!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        this.loading = false;
        this.handleLoginError(error);
      }
    });
  }

  fillDemoCredentials(type: 'admin' | 'user'): void {
    const credentials = {
      admin: { username: 'admin', password: 'admin123' },
      user: { username: 'demo', password: 'demo123' }
    };

    this.loginForm.patchValue(credentials[type]);

    this.snackBar.open(`${type} credentials filled`, 'Close', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });
  }

  forgotPassword(): void {
    this.snackBar.open('Please contact your administrator for password reset', 'Close', {
      duration: 5000,
      panelClass: ['info-snackbar']
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private showValidationErrors(): void {
    const errors = [];

    if (this.loginForm.get('username')?.hasError('required')) {
      errors.push('Username is required');
    }
    if (this.loginForm.get('password')?.hasError('required')) {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      this.snackBar.open(errors.join(', '), 'Close', {
        duration: 4000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private handleLoginError(error: any): void {
    let message = 'Login failed. Please try again.';

    if (error.status === 401) {
      message = 'Invalid username or password.';
    } else if (error.status === 403) {
      message = 'Account is disabled. Contact administrator.';
    } else if (error.status === 429) {
      message = 'Too many login attempts. Please try again later.';
    } else if (error.status === 0) {
      message = 'Unable to connect to server. Check your connection.';
    }

    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });

    // Add shake animation to form
    const formElement = document.querySelector('.login-form');
    formElement?.classList.add('shake');
    setTimeout(() => {
      formElement?.classList.remove('shake');
    }, 500);
  }
}
