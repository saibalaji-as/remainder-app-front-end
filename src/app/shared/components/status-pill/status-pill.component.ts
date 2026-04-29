import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type Tone = 'success' | 'info' | 'warning' | 'danger' | 'muted' | 'primary';

const STATUS_TONE_MAP: Record<string, Tone> = {
  completed: 'success',
  sent: 'success',
  active: 'success',
  paid: 'success',
  scheduled: 'info',
  pending: 'info',
  confirmed: 'primary',
  failed: 'danger',
  overdue: 'danger',
  cancelled: 'muted',
  canceled: 'muted',
};

const TONE_CLASSES: Record<Tone, string> = {
  success: 'status-pill--success',
  info: 'status-pill--info',
  warning: 'status-pill--warning',
  danger: 'status-pill--danger',
  muted: 'status-pill--muted',
  primary: 'status-pill--primary',
};

@Component({
  selector: 'app-status-pill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-pill.component.html',
  styleUrls: ['./status-pill.component.scss'],
})
export class StatusPillComponent {
  @Input() status: string = '';

  get toneClass(): string {
    const tone: Tone = STATUS_TONE_MAP[this.status?.toLowerCase()] ?? 'warning';
    return TONE_CLASSES[tone];
  }

  get capitalizedStatus(): string {
    if (!this.status) return '';
    return this.status.charAt(0).toUpperCase() + this.status.slice(1);
  }
}
