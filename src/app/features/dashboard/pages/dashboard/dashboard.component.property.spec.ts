import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Subject, BehaviorSubject, EMPTY } from 'rxjs';
import { SwUpdate, SwPush } from '@angular/service-worker';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import * as fc from 'fast-check';

import { DashboardComponent } from './dashboard.component';
import { DashboardService } from '../../services/dashboard.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { DashboardStatsResponse } from '../../models/dashboard-stats.model';

// ── SwUpdate / SwPush stubs ───────────────────────────────────────────────────
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

// ── Arbitraries ───────────────────────────────────────────────────────────────

const trendObjectArb = fc.record({
  value: fc.option(fc.float({ min: -1000, max: 1000, noNaN: true })),
  direction: fc.constantFrom('up' as const, 'down' as const, 'neutral' as const),
});

const statsBlockArb = fc.record({
  totalContacts: fc.nat(),
  totalAppointments: fc.nat(),
  totalRemindersSent: fc.nat(),
  totalRemindersFailed: fc.nat(),
  deliveryRate: fc.float({ min: 0, max: 100, noNaN: true }),
  trends: fc.record({
    totalAppointments: trendObjectArb,
    totalRemindersSent: trendObjectArb,
    deliveryRate: trendObjectArb,
  }),
});

const graphDataEntryArb = fc.record({
  day: fc.string(),
  date: fc.string(),
  appts: fc.nat(),
  reminders: fc.nat(),
});

const upcomingAppointmentArb = fc.record({
  id: fc.string(),
  title: fc.string(),
  scheduled_at: fc.string(),
  contact: fc.record({
    name: fc.string(),
    phone: fc.string(),
  }),
});

const recentReminderArb = fc.record({
  id: fc.string(),
  status: fc.string(),
  sent_at: fc.string(),
  appointment_id: fc.string(),
});

const dashboardStatsResponseArb: fc.Arbitrary<DashboardStatsResponse> = fc.record({
  stats: statsBlockArb,
  graphData: fc.array(graphDataEntryArb),
  pieData: fc.record({
    sms: fc.nat(),
    email: fc.nat(),
  }),
  upcomingAppointments: fc.array(upcomingAppointmentArb),
  recentReminders: fc.array(recentReminderArb),
});

// ── Property-based test suite ─────────────────────────────────────────────────

describe('DashboardComponent — Property-Based Tests', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let statsSubject: Subject<DashboardStatsResponse>;
  let themeSubject: BehaviorSubject<'dark' | 'light'>;

  beforeEach(async () => {
    statsSubject = new Subject<DashboardStatsResponse>();
    themeSubject = new BehaviorSubject<'dark' | 'light'>('dark');

    const dashboardServiceSpy = jasmine.createSpyObj<DashboardService>('DashboardService', ['getStats']);
    dashboardServiceSpy.getStats.and.returnValue(statsSubject.asObservable());

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

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ── Property 1: Stats response is stored on successful load ──────────────
  // Feature: b2b-dashboard-frontend-integration, Property 1: Stats response is stored on successful load
  // Validates: Requirements 3.2
  it('Property 1: Stats response is stored on successful load', fakeAsync(() => {
    // Trigger ngOnInit once — component subscribes to statsSubject via the spy
    fixture.detectChanges();

    fc.assert(
      fc.property(dashboardStatsResponseArb, (response) => {
        // Reset component state before each iteration
        (component as any).statsResponse = null;
        (component as any).loading = true;
        (component as any).error = false;

        // Emit the generated response on the shared subject
        statsSubject.next(response);
        tick();

        expect(component.statsResponse).toEqual(response);
        expect(component.loading).toBeFalse();
        expect(component.error).toBeFalse();
      }),
      { numRuns: 100 },
    );
  }));

  // ── Properties 2 & 3: Trend label formatting (pure function — no TestBed needed) ──

  // Feature: b2b-dashboard-frontend-integration, Property 2: Trend label formatting — positive values
  // Validates: Requirements 4.6
  it('Property 2: Trend label formatting — positive values', () => {
    // Instantiate component directly for pure function testing
    const mockDashboardService = { getStats: () => EMPTY } as unknown as DashboardService;
    const mockThemeService = { theme$: EMPTY } as unknown as ThemeService;
    const mockToastService = {} as unknown as ToastService;

    const comp = new DashboardComponent(
      mockToastService,
      mockThemeService,
      mockDashboardService,
    );

    fc.assert(
      fc.property(fc.float({ min: Math.fround(0.1), max: Math.fround(1000), noNaN: true }), (value) => {
        const result = comp.formatTrendLabel(value);
        expect(result.startsWith('+')).toBeTrue();
        expect(result.endsWith('% this week')).toBeTrue();
      }),
      { numRuns: 100 },
    );
  });

  // Feature: b2b-dashboard-frontend-integration, Property 3: Trend label formatting — null and non-positive values
  // Validates: Requirements 4.6
  it('Property 3: Trend label formatting — null and non-positive values', () => {
    const mockDashboardService = { getStats: () => EMPTY } as unknown as DashboardService;
    const mockThemeService = { theme$: EMPTY } as unknown as ThemeService;
    const mockToastService = {} as unknown as ToastService;

    const comp = new DashboardComponent(
      mockToastService,
      mockThemeService,
      mockDashboardService,
    );

    // Property 3a: null → 'No data'
    fc.assert(
      fc.property(fc.constant(null), (value) => {
        const result = comp.formatTrendLabel(value);
        expect(result).toBe('No data');
      }),
      { numRuns: 100 },
    );

    // Property 3b: non-positive → does NOT start with '+', ends with '% this week'
    fc.assert(
      fc.property(fc.float({ max: 0, noNaN: true }), (value) => {
        const result = comp.formatTrendLabel(value);
        expect(result.startsWith('+')).toBeFalse();
        expect(result.endsWith('% this week')).toBeTrue();
      }),
      { numRuns: 100 },
    );
  });

  // ── Property 4: Area chart labels and datasets mirror graphData ───────────
  // Feature: b2b-dashboard-frontend-integration, Property 4: Area chart labels and datasets mirror graphData
  // Validates: Requirements 5.1, 5.2, 5.3
  it('Property 4: Area chart labels and datasets mirror graphData', fakeAsync(() => {
    const graphDataArb = fc.array(
      fc.record({
        day: fc.string(),
        date: fc.string(),
        appts: fc.nat(),
        reminders: fc.nat(),
      }),
      { minLength: 0, maxLength: 7 },
    );

    fixture.detectChanges(); // ngOnInit

    fc.assert(
      fc.property(graphDataArb, (graphData) => {
        // Build a minimal statsResponse with the generated graphData
        const response: DashboardStatsResponse = {
          stats: {
            totalContacts: 0,
            totalAppointments: 0,
            totalRemindersSent: 0,
            totalRemindersFailed: 0,
            deliveryRate: 0,
            trends: {
              totalAppointments: { value: null, direction: 'neutral' },
              totalRemindersSent: { value: null, direction: 'neutral' },
              deliveryRate: { value: null, direction: 'neutral' },
            },
          },
          graphData,
          pieData: { sms: 0, email: 0 },
          upcomingAppointments: [],
          recentReminders: [],
        };

        component.statsResponse = response;
        (component as any).buildChartData();

        const labels = component.areaChartData.labels as string[];
        const apptData = component.areaChartData.datasets[0].data as number[];
        const reminderData = component.areaChartData.datasets[1].data as number[];

        expect(labels).toEqual(graphData.map(d => d.day));
        expect(apptData).toEqual(graphData.map(d => d.appts));
        expect(reminderData).toEqual(graphData.map(d => d.reminders));
      }),
      { numRuns: 100 },
    );
  }));

  // ── Property 5: Donut chart always has exactly two segments ───────────────
  // Feature: b2b-dashboard-frontend-integration, Property 5: Donut chart always has exactly two segments
  // Validates: Requirements 6.1, 6.2, 6.3
  it('Property 5: Donut chart always has exactly two segments', fakeAsync(() => {
    const pieDataArb = fc.record({
      sms: fc.nat(),
      email: fc.nat(),
    });

    fixture.detectChanges(); // ngOnInit

    fc.assert(
      fc.property(pieDataArb, ({ sms, email }) => {
        const response: DashboardStatsResponse = {
          stats: {
            totalContacts: 0,
            totalAppointments: 0,
            totalRemindersSent: 0,
            totalRemindersFailed: 0,
            deliveryRate: 0,
            trends: {
              totalAppointments: { value: null, direction: 'neutral' },
              totalRemindersSent: { value: null, direction: 'neutral' },
              deliveryRate: { value: null, direction: 'neutral' },
            },
          },
          graphData: [],
          pieData: { sms, email },
          upcomingAppointments: [],
          recentReminders: [],
        };

        component.statsResponse = response;
        (component as any).buildChartData();

        const donutData = component.donutChartData.datasets[0].data as number[];
        const donutLabels = component.donutChartData.labels as string[];

        expect(donutData.length).toBe(2);
        expect(donutData).toEqual([sms, email]);
        expect(component.donutLegend.length).toBe(2);
        expect(donutLabels[0]).toBe('SMS');
        expect(donutLabels[1]).toBe('Email');
      }),
      { numRuns: 100 },
    );
  }));
});
