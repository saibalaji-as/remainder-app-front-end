import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Wraps the native EventSource API as an RxJS Observable with auto-reconnect.
 *
 * On error/disconnect, automatically retries with exponential backoff
 * (1s → 2s → 4s → … capped at 30s). The Observable never errors out —
 * it keeps retrying as long as it is subscribed.
 */
@Injectable({ providedIn: 'root' })
export class SseService {
  private readonly NAMED_EVENTS = [
    'email-sent',
    'connected',
    'appointment-confirmed',
    'appointment-cancelled',
    'appointment-completed',
    'appointment-needs-update',
  ];

  constructor(private authService: AuthService) {}

  connect(path: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((observer) => {
      let eventSource: EventSource | null = null;
      let retryDelay = 1000;       // start at 1 s
      const MAX_DELAY  = 30_000;   // cap at 30 s
      let retryTimer: ReturnType<typeof setTimeout> | null = null;
      let destroyed = false;

      const namedEventHandler = (event: MessageEvent) => observer.next(event);

      const attach = (es: EventSource) => {
        es.onmessage = (event) => observer.next(event);
        this.NAMED_EVENTS.forEach(name => es.addEventListener(name, namedEventHandler));
      };

      const detach = (es: EventSource) => {
        this.NAMED_EVENTS.forEach(name => es.removeEventListener(name, namedEventHandler));
        es.onmessage = null;
        es.onerror   = null;
      };

      const open = () => {
        if (destroyed) return;

        const token = this.authService.getToken();
        const url   = `${environment.apiBaseUrl}${path}${token ? `?token=${encodeURIComponent(token)}` : ''}`;

        eventSource = new EventSource(url);
        attach(eventSource);

        eventSource.onerror = () => {
          if (destroyed) return;
          detach(eventSource!);
          eventSource!.close();
          eventSource = null;

          // Reconnect with exponential backoff
          console.warn(`SSE connection lost — retrying in ${retryDelay / 1000}s`);
          retryTimer = setTimeout(() => {
            retryDelay = Math.min(retryDelay * 2, MAX_DELAY);
            open();
          }, retryDelay);
        };

        // Reset backoff on successful open
        eventSource.addEventListener('connected', () => {
          retryDelay = 1000;
          console.log('SSE connected ✓');
        });
      };

      open();

      // Teardown — called when the component unsubscribes (e.g. ngOnDestroy)
      return () => {
        destroyed = true;
        if (retryTimer !== null) clearTimeout(retryTimer);
        if (eventSource) {
          detach(eventSource);
          eventSource.close();
          eventSource = null;
        }
      };
    });
  }
}
