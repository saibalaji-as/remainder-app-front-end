import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
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
  private readonly swUpdate    = inject(SwUpdate);

  ngOnInit(): void {
    // Wait for the service worker to be ready before attempting push subscription.
    // SwPush.isEnabled is false until the SW is registered — using a small delay
    // after SW registration ensures requestSubscription doesn't fail silently.
    const trySubscribe = () => {
      if (this.authService.isLoggedIn()) {
        this.pushService.subscribe();
      }
    };

    if (this.swUpdate.isEnabled) {
      // SW is already registered (e.g. page refresh) — subscribe after a tick
      // to let Angular finish bootstrapping
      setTimeout(trySubscribe, 1000);
    } else {
      // SW not yet registered — wait for it
      navigator.serviceWorker?.ready.then(() => trySubscribe());
    }

    // Also subscribe whenever the user logs in during this session
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // Small delay to ensure SW is ready after login navigation
        setTimeout(() => this.pushService.subscribe(), 1000);
      }
    });
  }
}
