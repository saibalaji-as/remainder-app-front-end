import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { SwPush } from '@angular/service-worker';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly swPush = inject(SwPush);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _updateAvailable$ = new BehaviorSubject<boolean>(false);
  private readonly _installAvailable$ = new BehaviorSubject<boolean>(false);
  private _deferredPrompt: any = null;

  readonly updateAvailable$: Observable<boolean> = this._updateAvailable$.asObservable();
  readonly installAvailable$: Observable<boolean> = this._installAvailable$.asObservable();

  constructor() {
    // Subscribe to SW version updates (production only — SwUpdate.isEnabled is false in dev)
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          this._updateAvailable$.next(true);
        });
    }

    // Capture install prompt and track installed state (browser only)
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('beforeinstallprompt', (event: Event) => {
        event.preventDefault();
        this._deferredPrompt = event;
        this._installAvailable$.next(true);
      });

      window.addEventListener('appinstalled', () => {
        this._deferredPrompt = null;
        this._installAvailable$.next(false);
      });
    }
  }

  /**
   * Trigger the browser's native install prompt (Android/desktop only).
   * Clears the deferred prompt only if the user accepts.
   */
  async promptInstall(): Promise<void> {
    if (!this._deferredPrompt) {
      return;
    }
    this._deferredPrompt.prompt();
    const { outcome } = await this._deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this._deferredPrompt = null;
      this._installAvailable$.next(false);
    }
    // If dismissed, retain the deferred prompt so user can be prompted again
  }

  /**
   * Subscribe to push notifications using the VAPID public key from environment config.
   * Requires SwPush to be enabled (production with service worker registered).
   */
  async subscribeToPush(): Promise<PushSubscription> {
    if (!this.swPush.isEnabled) {
      return Promise.reject(
        new Error('Push notifications are not supported in this environment.')
      );
    }
    return this.swPush.requestSubscription({
      serverPublicKey: environment.vapidPublicKey
    });
  }

  /**
   * Get the current push subscription, or null if not subscribed.
   */
  getPushSubscription(): Promise<PushSubscription | null> {
    return this.swPush.subscription.pipe(take(1)).toPromise() as Promise<PushSubscription | null>;
  }

  /**
   * Clear all API data-group caches managed by @angular/service-worker.
   * Called on logout to prevent data leakage between users on shared devices.
   * Errors are swallowed — cache clearing failure must never block logout.
   */
  async clearApiCaches(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !('caches' in window)) {
      return;
    }
    try {
      const cacheNames = await caches.keys();
      const apiCacheNames = cacheNames.filter(name =>
        /^ngsw:.*:data:api-freshness:/.test(name)
      );
      await Promise.all(apiCacheNames.map(name => caches.delete(name)));
    } catch (error) {
      console.error('[PwaService] Failed to clear API caches:', error);
      // Do not rethrow — logout must always complete
    }
  }
}
