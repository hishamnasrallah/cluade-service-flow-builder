// src/app/app.component.ts - CORRECTED VERSION
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Service Flow Designer';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated on app start
    if (!this.authService.isAuthenticated() &&
      !this.router.url.includes('/login')) {
      this.router.navigate(['/login']);
    }
  }
}
