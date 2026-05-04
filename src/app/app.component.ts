import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateNotificationComponent } from './shared/components/update-notification/update-notification.component';
import { InstallPromptComponent } from './shared/components/install-prompt/install-prompt.component';
import { IosInstallComponent } from './shared/components/ios-install/ios-install.component';
import { AuthService } from './core/services/auth.service';
import { PushNotificationService } from './core/services/push-notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UpdateNotificationComponent, InstallPromptComponent, IosInstallComponent],
  template: `
    <router-outlet />
    <app-update-notification />
    <app-install-prompt />
    <app-ios-install />
  `,
})
export class AppComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly pushService = inject(PushNotificationService);

  ngOnInit(): void {
    // If the user is already logged in (page refresh), re-subscribe to push.
    // Safe to call multiple times — browser returns existing subscription silently.
    if (this.authService.isLoggedIn()) {
      this.pushService.subscribe();
    }

    // Also subscribe whenever the user logs in during this session
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.pushService.subscribe();
      }
    });
  }
}
