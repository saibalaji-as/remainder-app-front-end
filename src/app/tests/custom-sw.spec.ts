/**
 * Unit tests for custom-sw.js push handler and notificationclick handler.
 *
 * Since custom-sw.js is a service worker script (not an Angular module), we
 * cannot import it directly. Instead, we replicate the handler logic here and
 * test it against a mocked service worker global environment.
 *
 * Requirements: 12.1, 12.2
 */

// ---------------------------------------------------------------------------
// Helpers — replicate the handler logic from custom-sw.js so we can unit-test
// it without loading the actual SW script (which calls importScripts and uses
// SW-only globals that are unavailable in Karma/browser test context).
// ---------------------------------------------------------------------------

interface MockPushEventData {
  json(): unknown;
  text(): string;
}

interface MockPushEvent {
  data: MockPushEventData | null;
  waitUntil(promise: Promise<unknown>): void;
}

interface MockNotification {
  close(): void;
  data?: { url?: string };
}

interface MockNotificationClickEvent {
  notification: MockNotification;
  waitUntil(promise: Promise<unknown>): void;
}

interface MockWindowClient {
  url: string;
  focus(): Promise<MockWindowClient>;
}

interface MockClients {
  matchAll(options: { type: string; includeUncontrolled: boolean }): Promise<MockWindowClient[]>;
  openWindow(url: string): Promise<MockWindowClient | null>;
}

interface MockRegistration {
  showNotification: jasmine.Spy;
  scope: string;
}

interface MockSelf {
  registration: MockRegistration;
  addEventListener(type: string, handler: (event: unknown) => void): void;
}

/**
 * Runs the push handler logic extracted from custom-sw.js.
 * Returns the promise passed to event.waitUntil so tests can await it.
 */
function runPushHandler(
  mockSelf: MockSelf,
  event: MockPushEvent
): Promise<void> {
  let title = 'Schedify';
  const options: { body: string; icon: string; badge: string; data?: unknown } = {
    body: '',
    icon: 'assets/icons/icon-192x192.png',
    badge: 'assets/icons/icon-72x72.png',
  };

  try {
    const payload = event.data ? (event.data.json() as Record<string, unknown>) : {};
    if (payload['title']) title = payload['title'] as string;
    if (payload['body'] !== undefined) options.body = payload['body'] as string;
    if (payload['icon']) options.icon = payload['icon'] as string;
    if (payload['data']) options.data = payload['data'];
  } catch (e) {
    // fallback — title stays 'Schedify', options.body stays ''
  }

  const p = mockSelf.registration.showNotification(title, options) as Promise<void> | undefined;
  const waitPromise = p instanceof Promise ? p : Promise.resolve();
  event.waitUntil(waitPromise);
  return waitPromise;
}

/**
 * Runs the notificationclick handler logic extracted from custom-sw.js.
 * Returns the promise passed to event.waitUntil.
 */
function runNotificationClickHandler(
  mockSelf: MockSelf,
  mockClients: MockClients,
  event: MockNotificationClickEvent
): Promise<unknown> {
  event.notification.close();

  const urlToOpen =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : mockSelf.registration.scope;

  const p = mockClients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((windowClients: MockWindowClient[]) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (mockClients.openWindow) {
        return mockClients.openWindow(urlToOpen);
      }
      return undefined;
    });

  event.waitUntil(p);
  return p;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('custom-sw.js — push handler', () => {
  let mockSelf: MockSelf;
  let showNotificationSpy: jasmine.Spy;

  beforeEach(() => {
    showNotificationSpy = jasmine.createSpy('showNotification').and.returnValue(Promise.resolve());
    mockSelf = {
      registration: {
        showNotification: showNotificationSpy,
        scope: 'https://app.schedify.com/',
      },
      addEventListener: jasmine.createSpy('addEventListener'),
    };
  });

  // -------------------------------------------------------------------------
  // 12.1 — well-formed payload
  // -------------------------------------------------------------------------
  describe('well-formed push payload { title, body }', () => {
    it('calls showNotification with the payload title as the first argument', async () => {
      const event: MockPushEvent = {
        data: {
          json: () => ({ title: 'Meeting Reminder', body: 'Your meeting starts in 5 minutes.' }),
          text: () => '{"title":"Meeting Reminder","body":"Your meeting starts in 5 minutes."}',
        },
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runPushHandler(mockSelf, event);

      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Meeting Reminder',
        jasmine.objectContaining({ body: 'Your meeting starts in 5 minutes.' })
      );
    });

    it('calls showNotification with an options object containing the payload body', async () => {
      const event: MockPushEvent = {
        data: {
          json: () => ({ title: 'Appointment', body: 'Doctor at 3pm' }),
          text: () => '{"title":"Appointment","body":"Doctor at 3pm"}',
        },
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runPushHandler(mockSelf, event);

      const [, options] = showNotificationSpy.calls.mostRecent().args as [string, { body: string }];
      expect(options.body).toBe('Doctor at 3pm');
    });

    it('uses the payload title (not the default "Schedify") when title is provided', async () => {
      const event: MockPushEvent = {
        data: {
          json: () => ({ title: 'Custom Title', body: 'Some body text' }),
          text: () => '',
        },
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runPushHandler(mockSelf, event);

      const [title] = showNotificationSpy.calls.mostRecent().args as [string];
      expect(title).toBe('Custom Title');
      expect(title).not.toBe('Schedify');
    });

    it('calls showNotification exactly once per push event', async () => {
      const event: MockPushEvent = {
        data: {
          json: () => ({ title: 'Test', body: 'Body' }),
          text: () => '',
        },
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runPushHandler(mockSelf, event);

      expect(showNotificationSpy).toHaveBeenCalledTimes(1);
    });

    it('passes the body as an empty string when payload body is an empty string', async () => {
      const event: MockPushEvent = {
        data: {
          json: () => ({ title: 'Alert', body: '' }),
          text: () => '',
        },
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runPushHandler(mockSelf, event);

      const [, options] = showNotificationSpy.calls.mostRecent().args as [string, { body: string }];
      expect(options.body).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // 12.1 — malformed / unparseable payload falls back to defaults
  // -------------------------------------------------------------------------
  describe('malformed / unparseable push payload', () => {
    it('falls back to title "Schedify" when JSON.parse throws', async () => {
      const event: MockPushEvent = {
        data: {
          json: () => { throw new SyntaxError('Unexpected token'); },
          text: () => 'not-json',
        },
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runPushHandler(mockSelf, event);

      const [title] = showNotificationSpy.calls.mostRecent().args as [string];
      expect(title).toBe('Schedify');
    });

    it('falls back to empty body when JSON.parse throws', async () => {
      const event: MockPushEvent = {
        data: {
          json: () => { throw new SyntaxError('Bad JSON'); },
          text: () => '',
        },
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runPushHandler(mockSelf, event);

      const [, options] = showNotificationSpy.calls.mostRecent().args as [string, { body: string }];
      expect(options.body).toBe('');
    });

    it('still calls showNotification exactly once even when payload is malformed', async () => {
      const event: MockPushEvent = {
        data: {
          json: () => { throw new Error('parse error'); },
          text: () => '',
        },
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runPushHandler(mockSelf, event);

      expect(showNotificationSpy).toHaveBeenCalledTimes(1);
    });

    it('falls back to "Schedify" when event.data is null', async () => {
      const event: MockPushEvent = {
        data: null,
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runPushHandler(mockSelf, event);

      const [title] = showNotificationSpy.calls.mostRecent().args as [string];
      expect(title).toBe('Schedify');
    });

    it('falls back to "Schedify" when payload has no title property', async () => {
      const event: MockPushEvent = {
        data: {
          json: () => ({ body: 'Some body without a title' }),
          text: () => '',
        },
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runPushHandler(mockSelf, event);

      const [title] = showNotificationSpy.calls.mostRecent().args as [string];
      expect(title).toBe('Schedify');
    });
  });
});

// ---------------------------------------------------------------------------
// notificationclick handler tests
// ---------------------------------------------------------------------------

describe('custom-sw.js — notificationclick handler', () => {
  let mockSelf: MockSelf;
  let mockClients: MockClients;
  let openWindowSpy: jasmine.Spy;

  beforeEach(() => {
    openWindowSpy = jasmine.createSpy('openWindow').and.returnValue(Promise.resolve(null));
    mockSelf = {
      registration: {
        showNotification: jasmine.createSpy('showNotification'),
        scope: 'https://app.schedify.com/',
      },
      addEventListener: jasmine.createSpy('addEventListener'),
    };
    mockClients = {
      matchAll: jasmine.createSpy('matchAll').and.returnValue(Promise.resolve([])),
      openWindow: openWindowSpy,
    };
  });

  // -------------------------------------------------------------------------
  // 12.2 — notificationclick opens or focuses the app window
  // -------------------------------------------------------------------------
  describe('when no matching window client exists', () => {
    it('calls clients.openWindow with the registration scope when no data.url is set', async () => {
      const event: MockNotificationClickEvent = {
        notification: {
          close: jasmine.createSpy('close'),
          data: undefined,
        },
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runNotificationClickHandler(mockSelf, mockClients, event);

      expect(openWindowSpy).toHaveBeenCalledWith('https://app.schedify.com/');
    });

    it('calls clients.openWindow with the URL from notification.data.url when provided', async () => {
      const event: MockNotificationClickEvent = {
        notification: {
          close: jasmine.createSpy('close'),
          data: { url: 'https://app.schedify.com/reminders/42' },
        },
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runNotificationClickHandler(mockSelf, mockClients, event);

      expect(openWindowSpy).toHaveBeenCalledWith('https://app.schedify.com/reminders/42');
    });

    it('closes the notification before doing anything else', async () => {
      const closeSpy = jasmine.createSpy('close');
      const event: MockNotificationClickEvent = {
        notification: {
          close: closeSpy,
          data: undefined,
        },
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runNotificationClickHandler(mockSelf, mockClients, event);

      expect(closeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('when a matching window client exists', () => {
    it('calls client.focus() instead of openWindow when a matching client URL is found', async () => {
      const focusSpy = jasmine.createSpy('focus').and.returnValue(Promise.resolve({} as MockWindowClient));
      const matchingClient: MockWindowClient = {
        url: 'https://app.schedify.com/',
        focus: focusSpy,
      };

      (mockClients.matchAll as jasmine.Spy).and.returnValue(Promise.resolve([matchingClient]));

      const event: MockNotificationClickEvent = {
        notification: {
          close: jasmine.createSpy('close'),
          data: undefined,
        },
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runNotificationClickHandler(mockSelf, mockClients, event);

      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(openWindowSpy).not.toHaveBeenCalled();
    });

    it('calls openWindow when no client URL matches the target URL', async () => {
      const nonMatchingClient: MockWindowClient = {
        url: 'https://app.schedify.com/other-page',
        focus: jasmine.createSpy('focus'),
      };

      (mockClients.matchAll as jasmine.Spy).and.returnValue(Promise.resolve([nonMatchingClient]));

      const event: MockNotificationClickEvent = {
        notification: {
          close: jasmine.createSpy('close'),
          data: undefined,
        },
        waitUntil: jasmine.createSpy('waitUntil'),
      };

      await runNotificationClickHandler(mockSelf, mockClients, event);

      expect(openWindowSpy).toHaveBeenCalledWith('https://app.schedify.com/');
    });
  });

  describe('event.waitUntil', () => {
    it('is called with a promise', async () => {
      const waitUntilSpy = jasmine.createSpy('waitUntil');
      const event: MockNotificationClickEvent = {
        notification: {
          close: jasmine.createSpy('close'),
          data: undefined,
        },
        waitUntil: waitUntilSpy,
      };

      await runNotificationClickHandler(mockSelf, mockClients, event);

      expect(waitUntilSpy).toHaveBeenCalledTimes(1);
      const arg = waitUntilSpy.calls.mostRecent().args[0] as unknown;
      expect(arg instanceof Promise).toBeTrue();
    });
  });
});
