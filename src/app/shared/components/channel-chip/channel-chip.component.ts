import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-channel-chip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel-chip.component.html',
  styleUrls: ['./channel-chip.component.scss'],
})
export class ChannelChipComponent {
  @Input() channel: 'sms' | 'email' | 'both' = 'sms';

  get label(): string {
    switch (this.channel) {
      case 'sms':   return 'SMS';
      case 'email': return 'Email';
      case 'both':  return 'Both';
    }
  }

  get showSms(): boolean {
    return this.channel === 'sms' || this.channel === 'both';
  }

  get showEmail(): boolean {
    return this.channel === 'email' || this.channel === 'both';
  }
}
