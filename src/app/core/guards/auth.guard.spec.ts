import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['isLoggedIn']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  // ---------------------------------------------------------------------------
  // 9.1 — Allows navigation when isLoggedIn() returns true
  // Validates: Requirements 8 (Property 8: Guard Allows Authenticated Users)
  // ---------------------------------------------------------------------------
  describe('9.1 — Allows navigation when authenticated', () => {
    it('returns true when isLoggedIn() returns true', () => {
      mockAuthService.isLoggedIn.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(result).toBeTrue();
    });

    it('does NOT call router.navigate when isLoggedIn() returns true', () => {
      mockAuthService.isLoggedIn.and.returnValue(true);

      TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // 9.2 — Blocks navigation and redirects when isLoggedIn() returns false
  // Validates: Requirements 8 (Property 9: Guard Blocks Unauthenticated Users)
  // ---------------------------------------------------------------------------
  describe('9.2 — Blocks navigation when unauthenticated', () => {
    it('returns false when isLoggedIn() returns false', () => {
      mockAuthService.isLoggedIn.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(result).toBeFalse();
    });

    it('calls router.navigate(["/auth/login"]) when isLoggedIn() returns false', () => {
      mockAuthService.isLoggedIn.and.returnValue(false);

      TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(router.navigate).toHaveBeenCalledOnceWith(['/auth/login']);
    });
  });
});
