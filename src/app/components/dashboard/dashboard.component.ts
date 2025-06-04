// components/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Page } from '../../models/flow.model';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard-container">
      <mat-toolbar color="primary" class="dashboard-toolbar">
        <span>Service Flow Designer</span>
        <span class="spacer"></span>
        <button mat-icon-button [matMenuTriggerFor]="menu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item (click)="logout()">
            <mat-icon>exit_to_app</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </mat-toolbar>

      <div class="dashboard-content">
        <div class="header-section">
          <h1>Dashboard</h1>
          <div class="action-buttons">
            <button mat-raised-button color="primary" (click)="createNewFlow()">
              <mat-icon>add</mat-icon>
              New Flow
            </button>
            <button mat-stroked-button (click)="refreshData()">
              <mat-icon>refresh</mat-icon>
              Refresh
            </button>
          </div>
        </div>

        <div class="stats-section" *ngIf="statistics">
          <mat-card class="stat-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="stat-icon pages">description</mat-icon>
              <mat-card-title>{{statistics.pages?.total || 0}}</mat-card-title>
              <mat-card-subtitle>Total Pages</mat-card-subtitle>
            </mat-card-header>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="stat-icon fields">input</mat-icon>
              <mat-card-title>{{statistics.fields?.total || 0}}</mat-card-title>
              <mat-card-subtitle>Total Fields</mat-card-subtitle>
            </mat-card-header>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="stat-icon conditions">rule</mat-icon>
              <mat-card-title>{{statistics.conditions?.total || 0}}</mat-card-title>
              <mat-card-subtitle>Conditions</mat-card-subtitle>
            </mat-card-header>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="stat-icon categories">category</mat-icon>
              <mat-card-title>{{statistics.categories?.total || 0}}</mat-card-title>
              <mat-card-subtitle>Categories</mat-card-subtitle>
            </mat-card-header>
          </mat-card>
        </div>

        <div class="pages-section">
          <h2>Recent Pages</h2>
          <div class="pages-grid" *ngIf="pages.length > 0; else noPages">
            <mat-card class="page-card" *ngFor="let page of pages" (click)="editPage(page)">
              <mat-card-header>
                <mat-icon mat-card-avatar>description</mat-icon>
                <mat-card-title>{{page.name}}</mat-card-title>
                <mat-card-subtitle>{{page.service_name}}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>{{page.description}}</p>
                <div class="page-meta">
                  <span class="status" [class.active]="page.active_ind">
                    {{page.active_ind ? 'Active' : 'Inactive'}}
                  </span>
                  <span class="sequence">Step: {{page.sequence_number_name}}</span>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary" (click)="editPage(page); $event.stopPropagation()">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
                <button mat-button (click)="viewPageSchema(page); $event.stopPropagation()">
                  <mat-icon>visibility</mat-icon>
                  View
                </button>
              </mat-card-actions>
            </mat-card>
          </div>

          <ng-template #noPages>
            <div class="empty-state">
              <mat-icon class="empty-icon">description</mat-icon>
              <h3>No pages found</h3>
              <p>Create your first service flow to get started</p>
              <button mat-raised-button color="primary" (click)="createNewFlow()">
                <mat-icon>add</mat-icon>
                Create New Flow
              </button>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .dashboard-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .dashboard-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      background-color: #f5f5f5;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .header-section h1 {
      margin: 0;
      color: #333;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      transition: transform 0.2s ease-in-out;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-icon {
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon.pages { background-color: #2196F3; }
    .stat-icon.fields { background-color: #4CAF50; }
    .stat-icon.conditions { background-color: #FF9800; }
    .stat-icon.categories { background-color: #9C27B0; }

    .pages-section h2 {
      color: #333;
      margin-bottom: 16px;
    }

    .pages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .page-card {
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }

    .page-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }

    .page-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }

    .status {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background-color: #f44336;
      color: white;
    }

    .status.active {
      background-color: #4CAF50;
    }

    .sequence {
      color: #666;
      font-size: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 64px 16px;
      color: #666;
    }

    .empty-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 16px 0 8px 0;
    }

    .empty-state p {
      margin-bottom: 24px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  pages: Page[] = [];
  statistics: any = null;
  loading = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    // Load pages
    this.apiService.getPages({ page_size: 20 }).subscribe({
      next: (response) => {
        this.pages = response.results || response;
      },
      error: (error) => {
        this.snackBar.open('Failed to load pages', 'Close', { duration: 3000 });
      }
    });

    // Load statistics
    this.apiService.getFormStatistics().subscribe({
      next: (response) => {
        this.statistics = response.data || response;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Failed to load statistics', 'Close', { duration: 3000 });
      }
    });
  }

  refreshData(): void {
    this.loadData();
    this.snackBar.open('Data refreshed', 'Close', { duration: 2000 });
  }

  createNewFlow(): void {
    this.router.navigate(['/designer']);
  }

  editPage(page: Page): void {
    this.router.navigate(['/designer', page.id]);
  }

  viewPageSchema(page: Page): void {
    this.apiService.getFormSchema(page.id).subscribe({
      next: (schema) => {
        console.log('Page Schema:', schema);
        this.snackBar.open('Schema loaded in console', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open('Failed to load schema', 'Close', { duration: 3000 });
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
