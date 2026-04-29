import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Capture beforeinstallprompt as early as possible — before Angular bootstraps.
// The browser fires this event once; if Angular isn't ready yet the PwaService
// constructor would miss it. We stash it on window so PwaService can retrieve it.
window.addEventListener('beforeinstallprompt', (event: Event) => {
  event.preventDefault();
  (window as any).__deferredInstallPrompt = event;
});

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
