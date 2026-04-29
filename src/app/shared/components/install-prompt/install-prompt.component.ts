import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable, combineLatest, map } from 'rxjs';
import { PwaService } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-install-prompt',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    @if (isVisible$ | async) {
      @if (!dismissed) {
        <div class="install-banner" role="banner" aria-label="Install Schedify app">
          <div class="install-banner__content">
            <mat-icon class="install-banner__icon" aria-hidden="true">install_mobile</mat-icon>
            <div class="install-banner__text">
              <strong>Install Schedify</strong>
              <span>Add to your home screen for a faster, native-like experience.</span>
            </div>
          </div>
          <div class="install-banner__actions">
            <button mat-stroked-button (click)="dismiss()" aria-label="Dismiss install prompt">
              Not now
            </button>
            <button mat-flat-button color="primary" (click)="install()" aria-label="Install Schedify">
              Install
            </button>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .install-banner {
      position: fixed;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 2rem);
      max-width: 560px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      z-index: 1000;
      flex-wrap: wrap;
    }

    .install-banner__content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      min-width: 0;
    }

    .install-banner__icon {
      color: #4f46e5;
      flex-shrink: 0;
    }

    .install-banner__text {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;

      strong {
        font-size: 0.9375rem;
        font-weight: 600;
      }

      span {
        font-size: 0.8125rem;
        color: #757575;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .install-banner__actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }
  `]
})
export class InstallPromptComponent implements OnInit {
  private readonly pwaService = inject(PwaService);

  dismissed = false;
  isVisible$!: Observable<boolean>;

  ngOnInit(): void {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    this.isVisible$ = this.pwaService.installAvailable$.pipe(
      map(available => available && !isStandalone)
    );
  }

  install(): void {
    this.pwaService.promptInstall();
  }

  dismiss(): void {
    this.dismissed = true;
  }
}
