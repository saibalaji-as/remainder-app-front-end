import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReminderChannel } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-channel-chip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel-chip.component.html',
  styleUrls: ['./channel-chip.component.scss'],
})
export class ChannelChipComponent {
  @Input() channel: ReminderChannel = 'sms';

  get label(): string {
    switch (this.channel) {
      case 'sms':            return 'SMS';
      case 'email':          return 'Email';
      case 'both':           return 'SMS & Email';
      case 'whatsapp':       return 'WhatsApp';
      case 'whatsapp_sms':   return 'WA + SMS';
      case 'whatsapp_email': return 'WA + Email';
      case 'all':            return 'All';
    }
  }

  get showSms(): boolean {
    return this.channel === 'sms' || this.channel === 'both'
        || this.channel === 'whatsapp_sms' || this.channel === 'all';
  }

  get showEmail(): boolean {
    return this.channel === 'email' || this.channel === 'both'
        || this.channel === 'whatsapp_email' || this.channel === 'all';
  }

  get showWhatsApp(): boolean {
    return this.channel === 'whatsapp'
        || this.channel === 'whatsapp_sms'
        || this.channel === 'whatsapp_email'
        || this.channel === 'all';
  }
}
