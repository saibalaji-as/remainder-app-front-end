import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Subscription } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { SseService } from '../../../../core/services/sse.service';
import { Reminder } from '../../../../core/models/reminder.model';
import { Appointment } from '../../../../core/models/appointment.model';
import { Contact } from '../../../../core/models/contact.model';
import { EmailSentEvent, SmsSentEvent, WhatsAppSentEvent } from '../../../../core/models/sse-event.model';
import {
  AppShellComponent,
  PageHeaderComponent,
  ChannelChipComponent,
  StatusPillComponent,
  SkeletonLoaderComponent,
  EmptyStateComponent,
} from '../../../../shared/components/index';
import { ReminderDetailDrawerComponent } from '../../components/reminder-detail-drawer/reminder-detail-drawer.component';

/** UI-only view model joining Reminder + Appointment + Contact data */
interface ReminderRow {
  id: string;
  appointmentId: string;
  channel: 'sms' | 'email' | 'both' | 'whatsapp' | 'whatsapp_sms' | 'whatsapp_email' | 'all';
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  scheduledFor: string;
  sentAt: string | null;
  appointmentTitle: string;
  contactName: string;
  contactEmail: string;
}

type ReminderFilter  = 'All' | 'pending' | 'sent' | 'failed' | 'skipped';
type ChannelFilter   = 'All' | 'email' | 'sms' | 'whatsapp';

/** Exponential back-off config for SSE reconnect */
const SSE_BASE_DELAY_MS  = 1_000;
const SSE_MAX_DELAY_MS   = 30_000;
const SSE_JITTER_FACTOR  = 0.1;   // ±10 %

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
    ReminderDetailDrawerComponent,
  ],
  templateUrl: './reminder-log.component.html',
  styleUrls: ['./reminder-log.component.scss']
})
export class ReminderLogComponent implements OnInit, OnDestroy {
  rows: ReminderRow[] = [];
  loading = false;

  // ── Status filter ─────────────────────────────────────────────────────────
  activeFilter: ReminderFilter = 'All';
  filters: ReminderFilter[] = ['All', 'pending', 'sent', 'failed', 'skipped'];

  // ── Channel filter ────────────────────────────────────────────────────────
  activeChannelFilter: ChannelFilter = 'All';
  channelFilters: ChannelFilter[] = ['All', 'email', 'sms', 'whatsapp'];

  // ── Drawer state ──────────────────────────────────────────────────────────
  selectedReminderId: string | null = null;
  drawerOpen = false;

  // ── SSE state ─────────────────────────────────────────────────────────────
  sseConnected = false;
  private sseSub?: Subscription;
  private sseRetryCount = 0;
  private sseRetryTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private sseService: SseService,
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.connectSse();
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
    if (this.sseRetryTimer) clearTimeout(this.sseRetryTimer);
  }

  // ── Computed getters ──────────────────────────────────────────────────────

  /** Reminders matching both the active channel filter and status filter */
  get filteredReminders(): ReminderRow[] {
    return this.rows.filter(r => {
      const channelMatch = this.matchesChannelFilter(r, this.activeChannelFilter);
      const statusMatch  = this.activeFilter === 'All' || r.status === this.activeFilter;
      return channelMatch && statusMatch;
    });
  }

  /** Count of reminders matching a given status filter (ignores channel filter) */
  filterCount(filter: ReminderFilter): number {
    if (filter === 'All') return this.rows.length;
    return this.rows.filter(r => r.status === filter).length;
  }

  /** Count of reminders matching a given channel filter (ignores status filter) */
  channelFilterCount(filter: ChannelFilter): number {
    if (filter === 'All') return this.rows.length;
    return this.rows.filter(r => this.matchesChannelFilter(r, filter)).length;
  }

  private matchesChannelFilter(row: ReminderRow, filter: ChannelFilter): boolean {
    if (filter === 'All') return true;
    if (filter === 'email') return row.channel === 'email' || row.channel === 'both' || row.channel === 'whatsapp_email' || row.channel === 'all';
    if (filter === 'sms')   return row.channel === 'sms'   || row.channel === 'both' || row.channel === 'whatsapp_sms'   || row.channel === 'all';
    if (filter === 'whatsapp') return row.channel === 'whatsapp' || row.channel === 'whatsapp_sms' || row.channel === 'whatsapp_email' || row.channel === 'all';
    return true;
  }

  // ── Drawer ────────────────────────────────────────────────────────────────

  openDrawer(row: ReminderRow): void {
    this.selectedReminderId = row.id;
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    this.selectedReminderId = null;
  }

  onRetried(_reminderId: string): void {
    this.closeDrawer();
    this.loadData();
  }

  // ── SSE ───────────────────────────────────────────────────────────────────

  private connectSse(): void {
    this.sseSub?.unsubscribe();

    this.sseSub = this.sseService.connect('/sse/reminders').subscribe({
      next: (event: MessageEvent) => {
        this.sseConnected = true;
        this.sseRetryCount = 0;

        if (event.type === 'email-sent') {
          try {
            const payload: EmailSentEvent = JSON.parse(event.data);
            this.onEmailSentEvent(payload);
          } catch { /* ignore malformed events */ }
        } else if (event.type === 'sms-sent') {
          try {
            const payload: SmsSentEvent = JSON.parse(event.data);
            this.onSmsSentEvent(payload);
          } catch { /* ignore malformed events */ }
        } else if (event.type === 'whatsapp-sent') {
          try {
            const payload: WhatsAppSentEvent = JSON.parse(event.data);
            this.onWhatsAppSentEvent(payload);
          } catch { /* ignore malformed events */ }
        }
      },
      error: () => {
        this.sseConnected = false;
        this.scheduleReconnect();
      },
    });
  }

  private scheduleReconnect(): void {
    const base    = SSE_BASE_DELAY_MS * Math.pow(2, this.sseRetryCount);
    const capped  = Math.min(base, SSE_MAX_DELAY_MS);
    const jitter  = capped * SSE_JITTER_FACTOR * (Math.random() * 2 - 1);
    const delay   = Math.round(capped + jitter);

    this.sseRetryCount++;
    this.sseRetryTimer = setTimeout(() => this.connectSse(), delay);
  }

  onEmailSentEvent(event: EmailSentEvent): void {
    this.toast.success(`Email sent to ${event.contactName} for "${event.appointmentTitle}"`);
    this.loadData();
  }

  onSmsSentEvent(event: SmsSentEvent): void {
    this.toast.success(`SMS sent to ${event.contactName} for "${event.appointmentTitle}"`);
    this.loadData();
  }

  onWhatsAppSentEvent(event: WhatsAppSentEvent): void {
    this.toast.success(`WhatsApp sent to ${event.contactName} for "${event.appointmentTitle}"`);
    this.loadData();
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

  /** Returns a short ID string — first 8 chars of the UUID */
  shortId(id: string | number): string {
    const s = String(id);
    return s.length > 8 ? s.slice(0, 8) + '…' : s;
  }

  channelFilterLabel(filter: ChannelFilter): string {
    if (filter === 'All')      return 'All';
    if (filter === 'email')    return 'Email';
    if (filter === 'sms')      return 'SMS';
    if (filter === 'whatsapp') return 'WhatsApp';
    return filter;
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
        const apptMap    = new Map<string, Appointment>(appointments.map(a => [a.id, a]));
        const contactMap = new Map<string, Contact>(contacts.map(c => [String(c.id), c]));

        this.rows = reminders.map(r => {
          const appt      = apptMap.get(r.appointment_id);
          const contactId = appt?.contact_id;
          const contact   = contactId != null ? contactMap.get(String(contactId)) : undefined;

          return {
            id:               r.id,
            appointmentId:    r.appointment_id,
            channel:          r.channel,
            status:           r.status,
            scheduledFor:     r.scheduled_at,
            sentAt:           r.sent_at,
            appointmentTitle: appt?.title ?? `Appointment #${r.appointment_id}`,
            contactName:      contact?.name  ?? (appt?.contacts?.name  ?? `Contact #${contactId ?? '?'}`),
            contactEmail:     contact?.email ?? (appt?.contacts?.email ?? ''),
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
