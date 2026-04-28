import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';
import { APP_ROUTES } from '../../../../app.routes';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

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

  // ===== Task 6.2 — Component creation and initialization =====

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have navScrolled false on init', () => {
    expect(component.navScrolled).toBeFalse();
  });

  it('should have 3 stats', () => {
    expect(component.stats.length).toBe(3);
  });

  it('should have 3 steps', () => {
    expect(component.steps.length).toBe(3);
  });

  it('should have 6 features', () => {
    expect(component.features.length).toBe(6);
  });

  it('should have 3 plans', () => {
    expect(component.plans.length).toBe(3);
  });

  it('should have 3 testimonials', () => {
    expect(component.testimonials.length).toBe(3);
  });

  it('should have 6 faqs', () => {
    expect(component.faqs.length).toBe(6);
  });

  // ===== Task 6.3 — Navbar content and scroll behavior =====

  it('should display Schedify brand in navbar', () => {
    const brand = fixture.nativeElement.querySelector('.navbar__brand');
    expect(brand).toBeTruthy();
    expect(brand.textContent).toContain('Schedify');
  });

  it('should have Login button with routerLink /auth/login', () => {
    const loginBtn = fixture.nativeElement.querySelector('a[routerlink="/auth/login"]');
    expect(loginBtn).toBeTruthy();
    expect(loginBtn.textContent.trim()).toContain('Login');
  });

  it('should have Get Started Free button with routerLink /auth/register in navbar', () => {
    const navbarActions = fixture.nativeElement.querySelector('.navbar__actions');
    const registerBtn = navbarActions?.querySelector('a[routerlink="/auth/register"]');
    expect(registerBtn).toBeTruthy();
    expect(registerBtn.textContent.trim()).toContain('Get Started Free');
  });

  it('should set navScrolled true when scrollY > 10', () => {
    Object.defineProperty(window, 'scrollY', { value: 50, writable: true, configurable: true });
    component.onScroll();
    expect(component.navScrolled).toBeTrue();
  });

  it('should set navScrolled false when scrollY <= 10', () => {
    Object.defineProperty(window, 'scrollY', { value: 5, writable: true, configurable: true });
    component.onScroll();
    expect(component.navScrolled).toBeFalse();
  });

  // ===== Task 6.4 — Hero section =====

  it('should display hero headline containing Stop Losing Patients to No-Shows', () => {
    const headline = fixture.nativeElement.querySelector('.hero__headline');
    expect(headline).toBeTruthy();
    expect(headline.textContent).toContain('Stop Losing Patients');
    expect(headline.textContent).toContain('No-Shows');
  });

  it('should display hero subheadline', () => {
    const sub = fixture.nativeElement.querySelector('.hero__sub');
    expect(sub).toBeTruthy();
    expect(sub.textContent.trim().length).toBeGreaterThan(0);
  });

  it('should have Start Free Trial CTA linking to /auth/register', () => {
    const heroCtas = fixture.nativeElement.querySelector('.hero__ctas');
    const cta = heroCtas?.querySelector('a[routerlink="/auth/register"]');
    expect(cta).toBeTruthy();
    expect(cta.textContent.trim()).toContain('Start Free Trial');
  });

  it('should call scrollTo when See How It Works is clicked', () => {
    spyOn(component, 'scrollTo');
    const heroCtas = fixture.nativeElement.querySelector('.hero__ctas');
    const strokedBtn = heroCtas?.querySelector('button[mat-stroked-button]');
    expect(strokedBtn).toBeTruthy();
    strokedBtn.click();
    expect(component.scrollTo).toHaveBeenCalledWith('how-it-works');
  });

  // ===== Task 6.5 — Problem, how-it-works, features sections =====

  it('should display problem section headline containing No-shows are killing your revenue', () => {
    const title = fixture.nativeElement.querySelector('.problem .section-title');
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('No-shows are killing your revenue');
  });

  it('should have how-it-works section with id how-it-works', () => {
    const section = fixture.nativeElement.querySelector('#how-it-works');
    expect(section).toBeTruthy();
  });

  it('should display features section headline', () => {
    const title = fixture.nativeElement.querySelector('.features .section-title');
    expect(title).toBeTruthy();
    expect(title.textContent.trim().length).toBeGreaterThan(0);
  });

  // ===== Task 6.6 — Pricing, testimonials, FAQ, final CTA =====

  it('should have pricing section with id pricing', () => {
    const section = fixture.nativeElement.querySelector('#pricing');
    expect(section).toBeTruthy();
  });

  it('should render mat-expansion-panel elements in FAQ section', () => {
    const panels = fixture.nativeElement.querySelectorAll('mat-expansion-panel');
    expect(panels.length).toBeGreaterThan(0);
  });

  it('should display final CTA headline containing Ready to eliminate no-shows', () => {
    const headline = fixture.nativeElement.querySelector('.final-cta__headline');
    expect(headline).toBeTruthy();
    expect(headline.textContent).toContain('Ready to eliminate no-shows');
  });

  it('should have Start Free Today button linking to /auth/register', () => {
    const finalCta = fixture.nativeElement.querySelector('.final-cta');
    const btn = finalCta?.querySelector('a[routerlink="/auth/register"]');
    expect(btn).toBeTruthy();
    expect(btn.textContent.trim()).toContain('Start Free Today');
  });

  // ===== Task 6.7 — Smoke tests =====

  it('should have root route with no canActivate guard', () => {
    const rootRoute = APP_ROUTES.find(r => r.path === '');
    expect(rootRoute).toBeTruthy();
    expect((rootRoute as any).canActivate).toBeUndefined();
  });

  it('should render Angular Material elements proving all required modules are imported', () => {
    const matCards = fixture.nativeElement.querySelectorAll('mat-card');
    const matIcons = fixture.nativeElement.querySelectorAll('mat-icon');
    const matExpansion = fixture.nativeElement.querySelectorAll('mat-expansion-panel');
    expect(matCards.length).toBeGreaterThan(0);
    expect(matIcons.length).toBeGreaterThan(0);
    expect(matExpansion.length).toBeGreaterThan(0);
  });
});
