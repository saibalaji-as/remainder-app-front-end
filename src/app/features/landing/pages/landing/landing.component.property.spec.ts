import * as fc from 'fast-check';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';
import { APP_ROUTES } from '../../../../app.routes';
import { authGuard } from '../../../../core/guards/auth.guard';

describe('LandingComponent — Property-Based Tests', () => {
  let fixture: ComponentFixture<LandingComponent>;
  let component: LandingComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Feature: schedify-landing-page, Property 1: Authenticated routes preserve their guard
  // Validates: Requirements 1.4
  xit('Property 1: authenticated routes preserve their guard', async () => {
    await fc.assert(
      fc.property(
        fc.constantFrom('/dashboard', '/contacts', '/appointments', '/reminders', '/billing'),
        (path) => {
          const route = APP_ROUTES.find(r => `/${r.path}` === path);
          expect(route).toBeTruthy();
          expect(route?.canActivate).toContain(authGuard);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: schedify-landing-page, Property 2: Navbar scroll threshold
  // Validates: Requirements 2.5
  it('Property 2: navScrolled is true iff scrollY > 10', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 10000 }),
        (value) => {
          Object.defineProperty(window, 'scrollY', { value, writable: true, configurable: true });
          component.onScroll();
          expect(component.navScrolled).toBe(value > 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: schedify-landing-page, Property 3: Stats array renders completely
  // Validates: Requirements 4.3
  it('Property 3: stats array renders exactly N stat cards', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record({ value: fc.string({ minLength: 1 }), label: fc.string({ minLength: 1 }) }),
          { minLength: 1, maxLength: 10 }
        ),
        (stats) => {
          component.stats = stats;
          fixture.detectChanges();
          const cards = fixture.nativeElement.querySelectorAll('.stat-card');
          expect(cards.length).toBe(stats.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: schedify-landing-page, Property 4: Steps array renders completely
  // Validates: Requirements 5.3, 5.4, 5.5
  it('Property 4: steps array renders exactly N step elements', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record({
            icon: fc.string({ minLength: 1 }),
            title: fc.string({ minLength: 1 }),
            desc: fc.string({ minLength: 1 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (steps) => {
          component.steps = steps;
          fixture.detectChanges();
          const stepEls = fixture.nativeElement.querySelectorAll('.step');
          expect(stepEls.length).toBe(steps.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: schedify-landing-page, Property 5: Features array renders completely with icons
  // Validates: Requirements 6.2, 6.3
  it('Property 5: features array renders exactly N feature cards', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record({
            icon: fc.string({ minLength: 1 }),
            title: fc.string({ minLength: 1 }),
            desc: fc.string({ minLength: 1 }),
          }),
          { minLength: 1, maxLength: 12 }
        ),
        (features) => {
          component.features = features;
          fixture.detectChanges();
          const cards = fixture.nativeElement.querySelectorAll('.feature-card');
          expect(cards.length).toBe(features.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: schedify-landing-page, Property 6: Plans array renders completely with prices
  // Validates: Requirements 7.2
  it('Property 6: plans array renders exactly N pricing cards', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1 }),
            price: fc.string({ minLength: 1 }),
            period: fc.constant('/mo'),
            popular: fc.boolean(),
            perks: fc.array(fc.string({ minLength: 1 })),
          }),
          { minLength: 1, maxLength: 6 }
        ),
        (plans) => {
          component.plans = plans;
          fixture.detectChanges();
          const cards = fixture.nativeElement.querySelectorAll('.pricing-card');
          expect(cards.length).toBe(plans.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: schedify-landing-page, Property 7: Popular plan receives elevated styling and chip
  // Validates: Requirements 7.3
  it('Property 7: popular plans have mat-elevation-z8 class', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1 }),
            price: fc.string({ minLength: 1 }),
            period: fc.constant('/mo'),
            popular: fc.boolean(),
            perks: fc.array(fc.string({ minLength: 1 })),
          }),
          { minLength: 1, maxLength: 6 }
        ).filter(plans => plans.some(p => p.popular)),
        (plans) => {
          component.plans = plans;
          fixture.detectChanges();
          const cards = fixture.nativeElement.querySelectorAll('.pricing-card');
          plans.forEach((plan, i) => {
            if (plan.popular) {
              expect(cards[i].classList).toContain('mat-elevation-z8');
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: schedify-landing-page, Property 8: All pricing CTAs navigate to /auth/register
  // Validates: Requirements 7.4
  it('Property 8: all pricing CTAs have routerLink /auth/register', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1 }),
            price: fc.string({ minLength: 1 }),
            period: fc.constant('/mo'),
            popular: fc.boolean(),
            perks: fc.array(fc.string({ minLength: 1 })),
          }),
          { minLength: 1, maxLength: 6 }
        ),
        (plans) => {
          component.plans = plans;
          fixture.detectChanges();
          const ctas = fixture.nativeElement.querySelectorAll('.pricing-card__cta');
          expect(ctas.length).toBe(plans.length);
          ctas.forEach((el: Element) => {
            // routerLink directive renders as href in the DOM when router is provided
            const href = el.getAttribute('href');
            const routerLink = el.getAttribute('routerlink') ?? el.getAttribute('ng-reflect-router-link');
            expect(href === '/auth/register' || routerLink === '/auth/register').toBeTrue();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: schedify-landing-page, Property 9: Testimonials array renders completely with quote icons
  // Validates: Requirements 8.1, 8.5
  it('Property 9: testimonials array renders exactly N testimonial cards', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quote: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1 }),
            business: fc.string({ minLength: 1 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (testimonials) => {
          component.testimonials = testimonials;
          fixture.detectChanges();
          const cards = fixture.nativeElement.querySelectorAll('.testimonial-card');
          expect(cards.length).toBe(testimonials.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: schedify-landing-page, Property 10: FAQs array renders as expansion panels
  // Validates: Requirements 9.1, 9.3
  it('Property 10: faqs array renders exactly N mat-expansion-panel elements', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record({
            q: fc.string({ minLength: 1 }),
            a: fc.string({ minLength: 1 }),
          }),
          { minLength: 1, maxLength: 12 }
        ),
        (faqs) => {
          component.faqs = faqs;
          fixture.detectChanges();
          const panels = fixture.nativeElement.querySelectorAll('mat-expansion-panel');
          expect(panels.length).toBe(faqs.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: schedify-landing-page, Property 11: CTA button directives
  // Validates: Requirements 12.5
  it('Property 11: primary CTAs use mat-raised-button; secondary CTAs use mat-stroked-button', () => {
    const raisedButtons = fixture.nativeElement.querySelectorAll('[mat-raised-button]');
    const strokedButtons = fixture.nativeElement.querySelectorAll('[mat-stroked-button]');

    // Start Free Trial, Get Started Free, pricing CTAs (3), Start Free Today = at least 4
    expect(raisedButtons.length).toBeGreaterThanOrEqual(4);

    // Login, See How It Works = at least 2
    expect(strokedButtons.length).toBeGreaterThanOrEqual(2);
  });
});
