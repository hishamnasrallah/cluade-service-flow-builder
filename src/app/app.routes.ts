// src/app/app.routes.ts (For Angular 20+ routing)
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FlowDesignerComponent } from './components/flow-designer/flow-designer.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login - Service Flow Designer'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    title: 'Dashboard - Service Flow Designer'
  },
  {
    path: 'designer/:id',
    component: FlowDesignerComponent,
    canActivate: [AuthGuard],
    title: 'Flow Designer - Service Flow Designer'
  },
  {
    path: 'designer',
    component: FlowDesignerComponent,
    canActivate: [AuthGuard],
    title: 'New Flow - Service Flow Designer'
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
