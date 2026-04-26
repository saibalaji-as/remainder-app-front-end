import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { jwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../services/auth.service';

describe('jwtInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  const TEST_URL = '/api/test';

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ---------------------------------------------------------------------------
  // 8.1 — Token attachment: request with token gets Authorization header
  // ---------------------------------------------------------------------------
  describe('8.1 — Token attachment', () => {
    it('adds Authorization: Bearer <token> header when token exists', () => {
      mockAuthService.getToken.and.returnValue('test-token');

      httpClient.get(TEST_URL).subscribe();

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });

    it('sets the exact token value returned by getToken()', () => {
      const token = 'eyJhbGciOiJIUzI1NiJ9.payload.sig';
      mockAuthService.getToken.and.returnValue(token);

      httpClient.get(TEST_URL).subscribe();

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      req.flush({});
    });
  });

  // ---------------------------------------------------------------------------
  // 8.2 — No-token pass-through: request without token has no Authorization header
  // ---------------------------------------------------------------------------
  describe('8.2 — No-token pass-through', () => {
    it('does NOT add Authorization header when getToken() returns null', () => {
      mockAuthService.getToken.and.returnValue(null);

      httpClient.get(TEST_URL).subscribe();

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });
  });

  // ---------------------------------------------------------------------------
  // 8.3 — 401 handling: triggers logout and re-throws error
  // ---------------------------------------------------------------------------
  describe('8.3 — 401 handling', () => {
    it('calls AuthService.logout() when server responds with 401', (done) => {
      mockAuthService.getToken.and.returnValue('test-token');

      httpClient.get(TEST_URL).subscribe({
        error: () => {
          expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
          done();
        },
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
    });

    it('re-throws the error so the subscriber receives it on 401', (done) => {
      mockAuthService.getToken.and.returnValue('test-token');

      httpClient.get(TEST_URL).subscribe({
        next: () => fail('should not succeed'),
        error: (err) => {
          expect(err.status).toBe(401);
          done();
        },
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
    });
  });

  // ---------------------------------------------------------------------------
  // 8.4 — Non-401 errors: do NOT call logout or clear localStorage
  // ---------------------------------------------------------------------------
  describe('8.4 — Non-401 errors', () => {
    [400, 403, 500].forEach((status) => {
      it(`does NOT call logout() on ${status} response`, (done) => {
        mockAuthService.getToken.and.returnValue('test-token');

        httpClient.get(TEST_URL).subscribe({
          error: () => {
            expect(mockAuthService.logout).not.toHaveBeenCalled();
            done();
          },
        });

        const req = httpMock.expectOne(TEST_URL);
        req.flush(null, { status, statusText: 'Error' });
      });

      it(`re-throws the error on ${status} response`, (done) => {
        mockAuthService.getToken.and.returnValue('test-token');

        httpClient.get(TEST_URL).subscribe({
          next: () => fail('should not succeed'),
          error: (err) => {
            expect(err.status).toBe(status);
            done();
          },
        });

        const req = httpMock.expectOne(TEST_URL);
        req.flush(null, { status, statusText: 'Error' });
      });
    });

    it('does NOT clear localStorage on non-401 error', (done) => {
      mockAuthService.getToken.and.returnValue('test-token');
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '1' }));

      httpClient.get(TEST_URL).subscribe({
        error: () => {
          expect(localStorage.getItem('token')).toBe('test-token');
          expect(localStorage.getItem('user')).not.toBeNull();
          localStorage.clear();
          done();
        },
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
