import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ios-install',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    @if (isVisible) {
      <div class="ios-install-banner" role="dialog" aria-label="Add Schedify to Home Screen">
        <button
          class="ios-install-banner__close"
          mat-icon-button
          (click)="dismiss()"
          aria-label="Dismiss install instructions">
          <mat-icon>close</mat-icon>
        </button>

        <div class="ios-install-banner__content">
          <div class="ios-install-banner__header">
            <img src="assets/icons/icon-72x72.png" alt="Schedify" class="ios-install-banner__app-icon">
            <div>
              <strong>Install Schedify</strong>
              <span>Add to your Home Screen</span>
            </div>
          </div>

          <ol class="ios-install-banner__steps">
            <li>
              Tap the
              <!-- iOS Share icon SVG -->
              <span class="ios-share-icon" aria-label="Share button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round"
                     stroke-linejoin="round" aria-hidden="true">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </span>
              <strong>Share</strong> button in Safari
            </li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>"Add"</strong> to confirm</li>
          </ol>
        </div>
      </div>
    }
  `,
  styles: [`
    .ios-install-banner {
      position: fixed;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 2rem);
      max-width: 400px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 32px rgba(0, 0, 0, 0.18);
      padding: 1.25rem;
      z-index: 1000;

      /* iOS-style bottom arrow indicator */
      &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid white;
      }
    }

    .ios-install-banner__close {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
    }

    .ios-install-banner__content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .ios-install-banner__header {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      div {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;

        strong {
          font-size: 0.9375rem;
          font-weight: 600;
        }

        span {
          font-size: 0.8125rem;
          color: #757575;
        }
      }
    }

    .ios-install-banner__app-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
    }

    .ios-install-banner__steps {
      margin: 0;
      padding-left: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.875rem;
      line-height: 1.5;
      color: #424242;
    }

    .ios-share-icon {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
      margin: 0 2px;

      svg {
        width: 18px;
        height: 18px;
        color: #007aff; /* iOS blue */
      }
    }
  `]
})
export class IosInstallComponent implements OnInit {
  isVisible = false;

  ngOnInit(): void {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isDismissed = !!sessionStorage.getItem('ios-install-dismissed');

    this.isVisible = isIos && !isStandalone && !isDismissed;
  }

  dismiss(): void {
    sessionStorage.setItem('ios-install-dismissed', '1');
    this.isVisible = false;
  }
}
