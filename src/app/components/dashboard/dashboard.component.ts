// src/app/components/dashboard/dashboard.component.ts - CORRECTED VERSION
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Page } from '../../models/flow.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  pages: Page[] = [];
  filteredPages: Page[] = [];
  statistics: any = null;
  loading = false;
  searchTerm = '';
  statusFilter = '';
  viewMode: 'grid' | 'list' = 'grid';
  notificationCount = 3;
  currentUser: any = { name: 'John Doe', email: 'john.doe@example.com' };
  selectedPage: Page | null = null; // Added missing property

  recentActivities = [
    {
      type: 'create',
      icon: 'add_circle',
      title: 'New flow created',
      description: 'Driver License Application flow was created',
      time: '2 minutes ago'
    },
    {
      type: 'edit',
      icon: 'edit',
      title: 'Flow updated',
      description: 'Business Registration form was modified',
      time: '1 hour ago'
    },
    {
      type: 'share',
      icon: 'share',
      title: 'Flow shared',
      description: 'Permit Application shared with team',
      time: '3 hours ago'
    }
  ];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.currentUser = this.authService.currentUserValue || this.currentUser;
  }

  loadData(): void {
    this.loading = true;

    // Load pages
    this.apiService.getPages({ page_size: 50 }).subscribe({
      next: (response) => {
        this.pages = response.results || response;
        this.filterPages();
      },
      error: (error) => {
        this.snackBar.open('Failed to load pages', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
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
        this.snackBar.open('Failed to load statistics', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  filterPages(): void {
    let filtered = [...this.pages];

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(page =>
        page.name.toLowerCase().includes(term) ||
        page.service_name.toLowerCase().includes(term) ||
        page.description.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter(page => {
        if (this.statusFilter === 'active') return page.active_ind;
        if (this.statusFilter === 'inactive') return !page.active_ind;
        return true;
      });
    }

    this.filteredPages = filtered;
  }

  refreshData(): void {
    this.loadData();
    this.snackBar.open('Data refreshed successfully', 'Close', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  createNewFlow(): void {
    this.router.navigate(['/designer']);
  }

  editPage(page: Page): void {
    this.selectedPage = page;
    this.router.navigate(['/designer', page.id]);
  }

  duplicatePage(page: Page): void {
    this.selectedPage = page;
    this.snackBar.open(`Duplicating "${page.name}"...`, 'Close', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });
    // Implement duplication logic
  }

  exportPage(page: Page): void {
    this.selectedPage = page;
    this.apiService.exportForm(page.id).subscribe({
      next: (data) => {
        // Create download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${page.name.replace(/\s+/g, '-')}.json`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.snackBar.open('Flow exported successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: () => {
        this.snackBar.open('Failed to export flow', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deletePage(page: Page): void {
    this.selectedPage = page;
    if (confirm(`Are you sure you want to delete "${page.name}"?`)) {
      this.apiService.deletePage(page.id).subscribe({
        next: () => {
          this.pages = this.pages.filter(p => p.id !== page.id);
          this.filterPages();
          this.snackBar.open('Flow deleted successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: () => {
          this.snackBar.open('Failed to delete flow', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  viewPageSchema(page: Page): void {
    this.selectedPage = page;
    this.apiService.getFormSchema(page.id).subscribe({
      next: (schema) => {
        console.log('Page Schema:', schema);
        this.snackBar.open('Schema loaded (check console)', 'Close', {
          duration: 3000,
          panelClass: ['info-snackbar']
        });
      },
      error: () => {
        this.snackBar.open('Failed to load schema', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  importFlow(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const flowData = JSON.parse(e.target.result);
            this.apiService.importForm(flowData).subscribe({
              next: () => {
                this.loadData();
                this.snackBar.open('Flow imported successfully', 'Close', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
              },
              error: () => {
                this.snackBar.open('Failed to import flow', 'Close', {
                  duration: 3000,
                  panelClass: ['error-snackbar']
                });
              }
            });
          } catch (error) {
            this.snackBar.open('Invalid flow file', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterPages();
  }

  getPageIcon(page: Page): string {
    // Return icon based on page type or service
    const iconMap: { [key: string]: string } = {
      'Driver License': 'directions_car',
      'Business Registration': 'business',
      'Permit Application': 'assignment',
      'default': 'description'
    };
    return iconMap[page.service_name] || iconMap['default'];
  }

  getRelativeTime(date: string | undefined): string {
    if (!date) return 'Unknown';

    try {
      const now = new Date();
      const past = new Date(date);
      const diffMs = now.getTime() - past.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch (error) {
      return 'Unknown';
    }
  }

  trackByPageId(index: number, page: Page): number {
    return page.id;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.snackBar.open('Logged out successfully', 'Close', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });
  }
}
