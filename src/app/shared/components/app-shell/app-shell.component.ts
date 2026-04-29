import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { BrandMarkComponent } from '../brand-mark/brand-mark.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { UpdateNotificationComponent } from '../update-notification/update-notification.component';
import { InstallPromptComponent } from '../install-prompt/install-prompt.component';
import { IosInstallComponent } from '../ios-install/ios-install.component';

interface NavItem {
  path: string;
  label: string;
  icon: 'dashboard' | 'contacts' | 'appointments' | 'reminders' | 'billing';
}

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, BrandMarkComponent, ThemeToggleComponent, UpdateNotificationComponent, InstallPromptComponent, IosInstallComponent],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  drawerOpen = false;

  navItems: NavItem[] = [
    { path: '/dashboard',    label: 'Dashboard',    icon: 'dashboard'    },
    { path: '/contacts',     label: 'Contacts',     icon: 'contacts'     },
    { path: '/appointments', label: 'Appointments', icon: 'appointments' },
    { path: '/reminders',    label: 'Reminders',    icon: 'reminders'    },
    { path: '/billing',      label: 'Billing',      icon: 'billing'      },
  ];

  openDrawer(): void {
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    this.drawerOpen = false;
  }

  logout(): void {
    this.authService.logout();
  }
}
