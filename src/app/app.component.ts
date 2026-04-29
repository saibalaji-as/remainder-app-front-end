import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateNotificationComponent } from './shared/components/update-notification/update-notification.component';
import { InstallPromptComponent } from './shared/components/install-prompt/install-prompt.component';
import { IosInstallComponent } from './shared/components/ios-install/ios-install.component';

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
export class AppComponent {}
