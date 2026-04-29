import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { SwUpdate, SwPush } from '@angular/service-worker';
import { EMPTY, of } from 'rxjs';

import { AuthService, AuthResponse, User } from './auth.service';
import { environment } from '../../../environments/environment';

/** Minimal SwUpdate stub — isEnabled=false so no subscription side-effects */
const swUpdateStub: Partial<SwUpdate> = {
  isEnabled: false,
  versionUpdates: EMPTY as any,
};

/** Minimal SwPush stub */
const swPushStub: Partial<SwPush> = {
  isEnabled: false,
  subscription: of(null) as any,
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        AuthService,
        { provide: SwUpdate, useValue: swUpdateStub },
        { provide: SwPush, useValue: swPushStub },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ---------------------------------------------------------------------------
  // 7.1 — storeSession round-trip
  // ---------------------------------------------------------------------------
  describe('storeSession round-trip (via login)', () => {
    const cases: AuthResponse[] = [
      {
        token: 'test-token',
        user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin' },
      },
      {
        token: 'another-jwt-xyz',
        user: { id: '42', name: 'Jane Doe', email: 'jane@example.com', role: 'user' },
      },
      {
        token: 'eyJhbGciOiJIUzI1NiJ9.payload.sig',
        user: { id: '99', name: 'Bob Smith', email: 'bob@corp.io', role: 'manager' },
      },
    ];

    cases.forEach((mockResponse) => {
      it(`stores token "${mockResponse.token}" and user "${mockResponse.user.email}" in localStorage and emits user`, (done) => {
        let emittedUser: User | null = undefined as any;

        service.currentUser$.subscribe((u) => (emittedUser = u));

        service.login({ email: mockResponse.user.email, password: 'password' }).subscribe(() => {
          // token stored
          expect(localStorage.getItem('token')).toBe(mockResponse.token);

          // user stored and parseable
          const storedUser = JSON.parse(localStorage.getItem('user')!);
          expect(storedUser).toEqual(mockResponse.user);

          // BehaviorSubject emits the user
          expect(emittedUser).toEqual(mockResponse.user);

          done();
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
        req.flush(mockResponse);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 7.2 — isLoggedIn invariant
  // ---------------------------------------------------------------------------
  describe('isLoggedIn()', () => {
    it('returns true when a token exists in localStorage', () => {
      localStorage.setItem('token', 'some-token');
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('returns false when no token exists in localStorage', () => {
      localStorage.removeItem('token');
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('returns true for any non-empty token value', () => {
      const tokens = ['abc', 'eyJ.payload.sig', '1', 'Bearer token'];
      tokens.forEach((t) => {
        localStorage.setItem('token', t);
        expect(service.isLoggedIn()).toBeTrue();
      });
    });

    it('returns false after token is removed', () => {
      localStorage.setItem('token', 'some-token');
      expect(service.isLoggedIn()).toBeTrue();
      localStorage.removeItem('token');
      expect(service.isLoggedIn()).toBeFalse();
    });
  });

  // ---------------------------------------------------------------------------
  // 7.3 — logout clears session state and navigates
  // ---------------------------------------------------------------------------
  describe('logout()', () => {
    it('removes token and user from localStorage, emits null, and navigates to /auth/login', async () => {
      // Arrange: store a session first
      localStorage.setItem('token', 'stored-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Test', email: 't@t.com', role: 'admin' }));

      const navigateSpy = spyOn(router, 'navigate');
      const emitted: (User | null)[] = [];
      service.currentUser$.subscribe((u) => emitted.push(u));

      // Act
      await service.logout();

      // Assert localStorage cleared
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();

      // Assert BehaviorSubject emits null
      expect(emitted[emitted.length - 1]).toBeNull();

      // Assert navigation
      expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  // ---------------------------------------------------------------------------
  // 7.4 — currentUser$ initializes from localStorage on construction
  // ---------------------------------------------------------------------------
  describe('currentUser$ initialization from localStorage', () => {
    it('emits the parsed user when localStorage has a user JSON string before construction', (done) => {
      const storedUser: User = { id: '5', name: 'Stored User', email: 'stored@test.com', role: 'user' };
      localStorage.setItem('user', JSON.stringify(storedUser));

      // Re-create the service so it reads localStorage during construction
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, RouterTestingModule],
        providers: [
          AuthService,
          { provide: SwUpdate, useValue: swUpdateStub },
          { provide: SwPush, useValue: swPushStub },
        ],
      });
      const freshService = TestBed.inject(AuthService);

      freshService.currentUser$.subscribe((u) => {
        expect(u).toEqual(storedUser);
        done();
      });
    });

    it('emits null when localStorage has no user before construction', (done) => {
      localStorage.removeItem('user');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, RouterTestingModule],
        providers: [
          AuthService,
          { provide: SwUpdate, useValue: swUpdateStub },
          { provide: SwPush, useValue: swPushStub },
        ],
      });
      const freshService = TestBed.inject(AuthService);

      freshService.currentUser$.subscribe((u) => {
        expect(u).toBeNull();
        done();
      });
    });
  });
});
