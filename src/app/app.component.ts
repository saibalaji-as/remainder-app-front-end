import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isAuthPage = false;

  navItems: NavItem[] = [
    { label: 'Dashboard',     icon: 'dashboard',        route: '/dashboard' },
    { label: 'Contacts',      icon: 'contacts',         route: '/contacts' },
    { label: 'Appointments',  icon: 'event',            route: '/appointments' },
    { label: 'Reminders',     icon: 'notifications',    route: '/reminders' },
    { label: 'Billing',       icon: 'credit_card',      route: '/billing' }
  ];

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      this.isAuthPage = e.urlAfterRedirects.startsWith('/auth');
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
