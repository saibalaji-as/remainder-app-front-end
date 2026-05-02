import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Wraps the native EventSource API as an RxJS Observable.
 *
 * Usage:
 *   this.sseService.connect('/sse/reminders').subscribe({
 *     next: (event) => { ... },
 *     error: () => { /* connection dropped, caller handles reconnect *\/ }
 *   });
 */
@Injectable({ providedIn: 'root' })
export class SseService {
  constructor(private authService: AuthService) {}

  /**
   * Opens an SSE connection to `path` (relative to the API base URL).
   * The JWT token is appended as a query parameter so the backend
   * auth middleware can authenticate the EventSource request
   * (EventSource does not support custom headers in browsers).
   *
   * The Observable emits each MessageEvent and completes on error.
   * The caller is responsible for reconnect logic.
   */
  connect(path: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((observer) => {
      const token = this.authService.getToken();
      const url = `${environment.apiBaseUrl}${path}${token ? `?token=${encodeURIComponent(token)}` : ''}`;

      const eventSource = new EventSource(url);

      eventSource.onmessage = (event: MessageEvent) => {
        observer.next(event);
      };

      // Listen for named events (e.g. 'email-sent', 'connected')
      const namedEventHandler = (event: MessageEvent) => {
        observer.next(event);
      };
      const namedEvents = [
        'email-sent',
        'connected',
        'appointment-confirmed',
        'appointment-cancelled',
        'appointment-completed',
        'appointment-needs-update',
      ];
      namedEvents.forEach(name => eventSource.addEventListener(name, namedEventHandler));

      eventSource.onerror = () => {
        eventSource.close();
        observer.error(new Error('SSE connection error'));
      };

      // Teardown: close the EventSource when the Observable is unsubscribed
      return () => {
        namedEvents.forEach(name => eventSource.removeEventListener(name, namedEventHandler));
        eventSource.close();
      };
    });
  }
}
