import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'contacts',
    canActivate: [authGuard],
    loadChildren: () => import('./features/contacts/contacts.module').then(m => m.ContactsModule)
  },
  {
    path: 'appointments',
    canActivate: [authGuard],
    loadChildren: () => import('./features/appointments/appointments.module').then(m => m.AppointmentsModule)
  },
  {
    path: 'reminders',
    canActivate: [authGuard],
    loadChildren: () => import('./features/reminders/reminders.module').then(m => m.RemindersModule)
  },
  {
    path: 'billing',
    canActivate: [authGuard],
    loadChildren: () => import('./features/billing/billing.module').then(m => m.BillingModule)
  },
  { path: '**', redirectTo: 'dashboard' }
];
