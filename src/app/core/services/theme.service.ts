import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'schedify-theme';
  private themeSubject: BehaviorSubject<'dark' | 'light'>;

  theme$: Observable<'dark' | 'light'>;
  get theme(): 'dark' | 'light' { return this.themeSubject.value; }

  constructor() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const initial: 'dark' | 'light' =
      stored === 'light' || stored === 'dark' ? stored : 'dark';
    this.themeSubject = new BehaviorSubject(initial);
    this.theme$ = this.themeSubject.asObservable();
    this.applyClass(initial);
  }

  toggle(): void {
    const next = this.themeSubject.value === 'dark' ? 'light' : 'dark';
    this.themeSubject.next(next);
    this.applyClass(next);
    localStorage.setItem(this.STORAGE_KEY, next);
  }

  private applyClass(theme: 'dark' | 'light'): void {
    const root = document.documentElement;
    root.classList.remove('light');
    if (theme === 'light') root.classList.add('light');
  }
}
