import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Reminder } from '../../../../core/models/reminder.model';
import { Appointment } from '../../../../core/models/appointment.model';
import {
  ChannelChipComponent,
  StatusPillComponent,
  SkeletonLoaderComponent,
} from '../../../../shared/components/index';

/** Flattened view model for the detail drawer */
interface ReminderDetail {
  id: string;
  channel: 'sms' | 'email' | 'both' | 'whatsapp' | 'whatsapp_sms' | 'whatsapp_email' | 'all';
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  scheduledFor: string;
  sentAt: string | null;
  appointmentTitle: string;
  appointmentNotes: string | null;
  contactName: string;
  contactEmail: string;
}

@Component({
  selector: 'app-reminder-detail-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ChannelChipComponent,
    StatusPillComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './reminder-detail-drawer.component.html',
  styleUrls: ['./reminder-detail-drawer.component.scss'],
})
export class ReminderDetailDrawerComponent implements OnChanges {
  /** The reminder ID to display; when null the drawer is hidden */
  @Input() reminderId: string | null = null;

  /** Emitted when the drawer should be closed */
  @Output() closed = new EventEmitter<void>();

  /** Emitted with the reminderId after a successful retry */
  @Output() retried = new EventEmitter<string>();

  detail: ReminderDetail | null = null;
  loading = false;
  retrying = false;
  error: string | null = null;

  constructor(
    private api: ApiService,
    private toast: ToastService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reminderId'] && this.reminderId !== null) {
      this.load();
    }
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  load(): void {
    if (this.reminderId === null) return;

    this.loading = true;
    this.error = null;
    this.detail = null;

    this.api.get<Reminder>(`/reminders/${this.reminderId}`).subscribe({
      next: (reminder) => {
        // Fetch the full appointment (with contacts join) separately
        this.api.get<Appointment>(`/appointments/${reminder.appointment_id}`).subscribe({
          next: (appt) => {
            this.detail = {
              id:               reminder.id,
              channel:          reminder.channel,
              status:           reminder.status,
              scheduledFor:     reminder.scheduled_at,
              sentAt:           reminder.sent_at,
              appointmentTitle: appt.title,
              appointmentNotes: appt.notes ?? null,
              contactName:      appt.contacts?.name ?? appt.Contact?.name ?? `Contact #${appt.contact_id ?? appt.contactId}`,
              contactEmail:     appt.contacts?.email ?? appt.Contact?.email ?? '',
            };
            this.loading = false;
          },
          error: () => {
            this.error = 'Failed to load appointment details.';
            this.loading = false;
          },
        });
      },
      error: () => {
        this.error = 'Failed to load reminder details.';
        this.loading = false;
      },
    });
  }

  // ── Retry ─────────────────────────────────────────────────────────────────

  retry(): void {
    if (this.reminderId === null || this.retrying) return;

    this.retrying = true;
    this.api.post<void>(`/reminders/${this.reminderId}/retry`, {}).subscribe({
      next: () => {
        if (this.detail) {
          this.detail = { ...this.detail, status: 'pending' };
        }
        this.retrying = false;
        this.toast.success('Reminder queued for retry.');
        this.retried.emit(this.reminderId!);
      },
      error: () => {
        this.retrying = false;
        this.toast.error('Failed to retry reminder. Please try again.');
      },
    });
  }

  // ── Close ─────────────────────────────────────────────────────────────────

  close(): void {
    this.closed.emit();
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.close();
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  /** Formats an ISO date string to a human-readable date + time */
  formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return (
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    );
  }

  /** Returns a short ID string — first 8 chars of the UUID */
  shortId(id: number | string): string {
    const s = String(id);
    return s.length > 8 ? s.slice(0, 8) + '…' : s;
  }
}
