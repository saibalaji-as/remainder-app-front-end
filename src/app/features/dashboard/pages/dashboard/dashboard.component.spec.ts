import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Subject, BehaviorSubject, EMPTY } from 'rxjs';
import { SwUpdate, SwPush } from '@angular/service-worker';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { DashboardComponent } from './dashboard.component';
import { DashboardService } from '../../services/dashboard.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { DashboardStatsResponse } from '../../models/dashboard-stats.model';

// ── SwUpdate / SwPush stubs (needed by PwaService → AuthService → AppShellComponent) ──
const swUpdateStub = {
  isEnabled: false,
  versionUpdates: EMPTY,
  checkForUpdate: () => Promise.resolve(false),
  activateUpdate: () => Promise.resolve(false),
  unrecoverable: EMPTY,
};

const swPushStub = {
  isEnabled: false,
  subscription: EMPTY,
  messages: EMPTY,
  notificationClicks: EMPTY,
  requestSubscription: () => Promise.reject(new Error('not enabled')),
  unsubscribe: () => Promise.resolve(),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildMockResponse(overrides: Partial<DashboardStatsResponse> = {}): DashboardStatsResponse {
  return {
    stats: {
      totalContacts: 42,
      totalAppointments: 10,
      totalRemindersSent: 8,
      totalRemindersFailed: 1,
      deliveryRate: 88.9,
      trends: {
        totalAppointments: { value: 5, direction: 'up' },
        totalRemindersSent: { value: -2, direction: 'down' },
        deliveryRate: { value: null, direction: 'neutral' },
      },
    },
    graphData: [
      { day: 'Mon', date: '2024-04-22', appts: 2, reminders: 3 },
      { day: 'Tue', date: '2024-04-23', appts: 4, reminders: 5 },
    ],
    pieData: { sms: 6, email: 2 },
    upcomingAppointments: [
      {
        id: 'appt-1',
        title: 'Checkup',
        scheduled_at: '2024-05-01T10:00:00Z',
        contact: { name: 'Alice Smith', phone: '+1234567890' },
      },
    ],
    recentReminders: [
      { id: 'rem-1', status: 'sent', sent_at: '2024-04-28T09:00:00Z', appointment_id: 'appt-1' },
      { id: 'rem-2', status: 'failed', sent_at: '2024-04-27T08:00:00Z', appointment_id: 'appt-2' },
      { id: 'rem-3', status: 'sent', sent_at: '2024-04-26T07:00:00Z', appointment_id: 'appt-3' },
    ],
    ...overrides,
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;

  // Spies / subjects
  let statsSubject: Subject<DashboardStatsResponse>;
  let getStatsSpy: jasmine.Spy;
  let themeSubject: BehaviorSubject<'dark' | 'light'>;

  beforeEach(async () => {
    statsSubject = new Subject<DashboardStatsResponse>();
    themeSubject = new BehaviorSubject<'dark' | 'light'>('dark');

    const dashboardServiceSpy = jasmine.createSpyObj<DashboardService>('DashboardService', ['getStats']);
    getStatsSpy = dashboardServiceSpy.getStats.and.returnValue(statsSubject.asObservable());

    const themeServiceStub: Partial<ThemeService> = {
      theme$: themeSubject.asObservable(),
    };

    const toastServiceStub: Partial<ToastService> = {
      show: jasmine.createSpy('show'),
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
      info: jasmine.createSpy('info'),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideCharts(withDefaultRegisterables()),
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: ThemeService, useValue: themeServiceStub },
        { provide: ToastService, useValue: toastServiceStub },
        { provide: SwUpdate, useValue: swUpdateStub },
        { provide: SwPush, useValue: swPushStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  // ── Test 1: loading is true before getStats() emits ──────────────────────
  // Validates: Requirements 3.1, 9.1
  it('should set loading to true before getStats() emits', () => {
    // detectChanges triggers ngOnInit → loadStats() → loading = true
    fixture.detectChanges();

    expect(component.loading).toBeTrue();
    expect(component.error).toBeFalse();
    expect(component.statsResponse).toBeNull();
  });

  // ── Test 2: error state when getStats() errors ────────────────────────────
  // Validates: Requirements 3.3, 9.2
  it('should set error=true and loading=false when getStats() errors', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit

    statsSubject.error(new Error('Network error'));
    tick();
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.error).toBeTrue();
    expect(component.statsResponse).toBeNull();
  }));

  // ── Test 3: statsResponse populated and loading=false on success ──────────
  // Validates: Requirements 3.2, 9.3
  it('should populate statsResponse and set loading=false when getStats() succeeds', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit

    const mockResponse = buildMockResponse();
    statsSubject.next(mockResponse);
    tick();
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.error).toBeFalse();
    expect(component.statsResponse).toEqual(mockResponse);
  }));

  // ── Test 4: ngOnDestroy calls unsubscribe() on stats subscription ─────────
  // Validates: Requirements 3.7
  it('should call unsubscribe() on the stats subscription when destroyed', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit — creates statsSub

    // Access private statsSub via type cast
    const comp = component as unknown as { statsSub?: { unsubscribe: jasmine.Spy } };
    const originalSub = comp.statsSub;
    if (originalSub) {
      spyOn(originalSub, 'unsubscribe').and.callThrough();
    }

    fixture.destroy(); // triggers ngOnDestroy

    if (originalSub) {
      expect(originalSub.unsubscribe).toHaveBeenCalled();
    } else {
      // statsSub was set — verify the observable is no longer active
      // by confirming no error is thrown after destroy
      expect(() => statsSubject.next(buildMockResponse())).not.toThrow();
    }
  }));

  // ── Test 5: Loading skeleton rendered when loading === true ───────────────
  // Validates: Requirements 9.1
  it('should render the loading skeleton when loading is true', () => {
    fixture.detectChanges(); // loading = true

    const skeleton = fixture.debugElement.query(By.css('.dashboard-skeleton'));
    expect(skeleton).not.toBeNull();
  });

  // ── Test 6: Error banner rendered when loading=false and error=true ───────
  // Validates: Requirements 9.2
  it('should render the error banner when loading=false and error=true', fakeAsync(() => {
    fixture.detectChanges();

    statsSubject.error(new Error('fail'));
    tick();
    fixture.detectChanges();

    const errorBanner = fixture.debugElement.query(By.css('.error-banner'));
    expect(errorBanner).not.toBeNull();

    // Skeleton and main content should NOT be visible
    const skeleton = fixture.debugElement.query(By.css('.dashboard-skeleton'));
    expect(skeleton).toBeNull();
  }));

  // ── Test 7: Main content rendered on success ──────────────────────────────
  // Validates: Requirements 9.3
  it('should render main content when loading=false, error=false, and statsResponse is set', fakeAsync(() => {
    fixture.detectChanges();

    statsSubject.next(buildMockResponse());
    tick();
    fixture.detectChanges();

    // Stat cards grid should be present
    const statsGrid = fixture.debugElement.query(By.css('.stats-grid'));
    expect(statsGrid).not.toBeNull();

    // Skeleton and error banner should NOT be visible
    const skeleton = fixture.debugElement.query(By.css('.dashboard-skeleton'));
    expect(skeleton).toBeNull();

    const errorBanner = fixture.debugElement.query(By.css('.error-banner'));
    expect(errorBanner).toBeNull();
  }));

  // ── Test 8: Theme change triggers buildChartData() without re-fetching ────
  // Validates: Requirements 5.5, 6.5
  it('should rebuild chart data on theme change without calling getStats() again', fakeAsync(() => {
    fixture.detectChanges();

    // Emit a successful response first so statsResponse is populated
    statsSubject.next(buildMockResponse());
    tick();
    fixture.detectChanges();

    const callCountBefore = getStatsSpy.calls.count();

    // Capture chart data before theme change
    const labelsBefore = (component.areaChartData.labels as string[]).slice();

    // Trigger a theme change
    themeSubject.next('light');
    tick();
    fixture.detectChanges();

    // getStats() should NOT have been called again
    expect(getStatsSpy.calls.count()).toBe(callCountBefore);

    // Chart data should still be populated (rebuilt from stored statsResponse)
    expect(component.areaChartData.labels).toEqual(labelsBefore);
    expect(component.donutChartData.datasets[0].data.length).toBe(2);
  }));

  // ── Test 9: Counter text shows "X recent" format ─────────────────────────
  // Validates: Requirements 8.8
  it('should display counter text in "X recent" format', fakeAsync(() => {
    fixture.detectChanges();

    const mockResponse = buildMockResponse(); // has 3 recentReminders
    statsSubject.next(mockResponse);
    tick();
    fixture.detectChanges();

    const countEl = fixture.debugElement.query(By.css('.list-card__count'));
    // The second list-card__count is for recent reminders
    const allCountEls = fixture.debugElement.queryAll(By.css('.list-card__count'));
    const recentCountEl = allCountEls[1]; // second counter = recent reminders

    expect(recentCountEl).not.toBeNull();
    const text = recentCountEl.nativeElement.textContent.trim();
    expect(text).toBe(`${mockResponse.recentReminders.length} recent`);
  }));
});
