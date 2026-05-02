import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NudgeEvent } from '../../../core/models/confirm.model';

@Component({
  selector: 'app-nudge-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nudge-banner.component.html',
  styleUrls: ['./nudge-banner.component.scss'],
})
export class NudgeBannerComponent {
  @Input() nudge: NudgeEvent | null = null;
  @Output() updateStatus = new EventEmitter<string>();
  @Output() dismissed = new EventEmitter<void>();

  onUpdateStatus(): void {
    if (this.nudge) {
      this.updateStatus.emit(this.nudge.appointmentId);
    }
  }

  onDismiss(): void {
    this.dismissed.emit();
  }
}
