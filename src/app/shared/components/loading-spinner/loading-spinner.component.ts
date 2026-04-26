import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="spinner-overlay" *ngIf="visible">
      <mat-spinner [diameter]="diameter"></mat-spinner>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 32px;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() visible = true;
  @Input() diameter = 48;
}
