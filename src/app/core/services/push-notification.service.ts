import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly swPush = inject(SwPush);
  private readonly http   = inject(HttpClient);

  /**
   * Returns true if the browser supports push and the service worker is active.
   */
  get isSupported(): boolean {
    return this.swPush.isEnabled;
  }

  /**
   * Request push permission and subscribe the browser.
   * Fetches the VAPID public key from the backend (so it works in any environment
   * without rebuilding the frontend).
   *
   * Safe to call multiple times — if already subscribed the browser returns the
   * existing subscription without prompting again.
   */
  async subscribe(): Promise<void> {
    if (!this.isSupported) {
      console.warn('[Push] Service worker not enabled — skipping push subscription.');
      return;
    }

    try {
      // Fetch VAPID public key from backend
      const { publicKey } = await firstValueFrom(
        this.http.get<{ publicKey: string }>(`${environment.apiBaseUrl}/push/vapid-public-key`)
      );

      if (!publicKey) {
        console.warn('[Push] VAPID public key not configured on server.');
        return;
      }

      const subscription = await this.swPush.requestSubscription({ serverPublicKey: publicKey });

      // POST subscription to backend
      await firstValueFrom(
        this.http.post(`${environment.apiBaseUrl}/push/subscribe`, {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth:   this.arrayBufferToBase64(subscription.getKey('auth')!),
          },
        })
      );

      console.log('[Push] Subscribed successfully ✓');
    } catch (err: any) {
      // User denied permission — not an error worth surfacing
      if (err?.name === 'NotAllowedError') {
        console.warn('[Push] Permission denied by user.');
        return;
      }
      console.error('[Push] Subscription failed:', err?.message ?? err);
    }
  }

  /**
   * Unsubscribe from push notifications and remove from backend.
   */
  async unsubscribe(): Promise<void> {
    if (!this.isSupported) return;

    try {
      const sub = await firstValueFrom(this.swPush.subscription);
      if (!sub) return;

      await firstValueFrom(
        this.http.delete(`${environment.apiBaseUrl}/push/unsubscribe`, {
          body: { endpoint: sub.endpoint },
        })
      );

      await sub.unsubscribe();
      console.log('[Push] Unsubscribed.');
    } catch (err: any) {
      console.error('[Push] Unsubscribe failed:', err?.message ?? err);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
