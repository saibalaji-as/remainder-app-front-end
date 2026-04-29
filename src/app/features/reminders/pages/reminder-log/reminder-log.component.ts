import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Reminder } from '../../../../core/models/reminder.model';
import { Appointment } from '../../../../core/models/appointment.model';
import { Contact } from '../../../../core/models/contact.model';
import {
  AppShellComponent,
  PageHeaderComponent,
  ChannelChipComponent,
  StatusPillComponent,
  SkeletonLoaderComponent,
  EmptyStateComponent,
} from '../../../../shared/components/index';

/** UI-only view model joining Reminder + Appointment + Contact data */
interface ReminderRow {
  id: number;
  appointmentId: number;
  channel: 'sms' | 'email' | 'both';
  status: 'pending' | 'sent' | 'failed';
  scheduledFor: string;
  sentAt: string | null;
  appointmentTitle: string;
  contactName: string;
}

type ReminderFilter = 'All' | 'pending' | 'sent' | 'failed';

@Component({
  selector: 'app-reminder-log',
  standalone: true,
  imports: [
    CommonModule,
    AppShellComponent,
    PageHeaderComponent,
    ChannelChipComponent,
    StatusPillComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './reminder-log.component.html',
  styleUrls: ['./reminder-log.component.scss']
})
export class ReminderLogComponent implements OnInit {
  rows: ReminderRow[] = [];
  loading = false;

  /** Active filter chip — 'All' shows every reminder */
  activeFilter: ReminderFilter = 'All';

  filters: ReminderFilter[] = ['All', 'pending', 'sent', 'failed'];

  constructor(
    private api: ApiService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // ── Computed getters ──────────────────────────────────────────────────────

  /** Reminders filtered by the active chip */
  get filteredReminders(): ReminderRow[] {
    if (this.activeFilter === 'All') return this.rows;
    return this.rows.filter(r => r.status === this.activeFilter);
  }

  /** Count of reminders matching a given filter value */
  filterCount(filter: ReminderFilter): number {
    if (filter === 'All') return this.rows.length;
    return this.rows.filter(r => r.status === filter).length;
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  /** Formats an ISO date string to a human-readable date + time */
  formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · '
      + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  /** Returns a short monospace ID string, e.g. "#0042" */
  shortId(id: number): string {
    return '#' + String(id).padStart(4, '0');
  }

  // ── API calls ─────────────────────────────────────────────────────────────

  loadData(): void {
    this.loading = true;
    forkJoin({
      reminders:    this.api.get<Reminder[]>('/reminders'),
      appointments: this.api.get<Appointment[]>('/appointments'),
      contacts:     this.api.get<Contact[]>('/contacts'),
    }).subscribe({
      next: ({ reminders, appointments, contacts }) => {
        // Build lookup maps for O(1) joins
        const apptMap = new Map<number, Appointment>(appointments.map(a => [a.id, a]));
        const contactMap = new Map<number, Contact>(contacts.map(c => [c.id, c]));

        this.rows = reminders.map(r => {
          const appt = apptMap.get(r.appointmentId);
          const contactId = appt?.contactId;
          const contact = contactId != null ? contactMap.get(contactId) : undefined;

          return {
            id:               r.id,
            appointmentId:    r.appointmentId,
            channel:          r.channel,
            status:           r.status,
            scheduledFor:     r.scheduledFor,
            sentAt:           r.sentAt,
            appointmentTitle: appt?.title ?? `Appointment #${r.appointmentId}`,
            contactName:      contact?.name ?? (appt?.Contact?.name ?? `Contact #${contactId ?? '?'}`),
          };
        });

        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load reminders.');
        this.loading = false;
      }
    });
  }
}
