import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-offline',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="offline-container">
      <div class="offline-content">
        <!-- Offline illustration -->
        <div class="offline-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
               stroke-linejoin="round" aria-hidden="true">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
        </div>

        <h1 class="offline-title">You're offline</h1>
        <p class="offline-message">
          This page isn't available without a connection.<br>
          Check your internet connection and try again.
        </p>

        <button mat-flat-button color="primary" (click)="retry()" class="retry-button">
          <mat-icon>refresh</mat-icon>
          Retry
        </button>
      </div>
    </div>
  `,
  styles: [`
    .offline-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      background: var(--mat-app-background-color, #fafafa);
    }

    .offline-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 400px;
      gap: 1rem;
    }

    .offline-icon {
      width: 80px;
      height: 80px;
      color: #9e9e9e;
      margin-bottom: 0.5rem;

      svg {
        width: 100%;
        height: 100%;
      }
    }

    .offline-title {
      font-size: 1.75rem;
      font-weight: 600;
      margin: 0;
      color: var(--mat-app-on-background, #212121);
    }

    .offline-message {
      font-size: 1rem;
      color: #757575;
      line-height: 1.6;
      margin: 0;
    }

    .retry-button {
      margin-top: 0.5rem;
      gap: 0.5rem;
    }
  `]
})
export class OfflineComponent implements OnInit, OnDestroy {
  private redirectUrl: string | null = null;
  private onlineHandler: (() => void) | null = null;

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    // Read the URL the user was trying to reach before going offline
    this.redirectUrl = sessionStorage.getItem('offline-redirect-from');

    // Auto-navigate back when connectivity is restored
    this.onlineHandler = () => {
      const target = this.redirectUrl || '/';
      this.router.navigate([target]);
    };
    window.addEventListener('online', this.onlineHandler);
  }

  ngOnDestroy(): void {
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = null;
    }
  }

  retry(): void {
    window.location.reload();
  }
}
