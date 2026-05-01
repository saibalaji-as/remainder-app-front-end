import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { DialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Appointment, AppointmentCreateDto, ReminderChannel } from '../../../../core/models/appointment.model';
import { Contact } from '../../../../core/models/contact.model';
import {
  AppShellComponent,
  PageHeaderComponent,
  ChannelChipComponent,
  StatusPillComponent,
  SkeletonLoaderComponent,
  EmptyStateComponent,
} from '../../../../shared/components/index';

type AppointmentTab = 'All' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppShellComponent,
    PageHeaderComponent,
    ChannelChipComponent,
    StatusPillComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.scss']
})
export class AppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  contacts: Contact[] = [];
  loading = false;
  showAddForm = false;

  /** Active status tab — 'All' shows every appointment */
  activeTab: AppointmentTab = 'All';

  tabs: AppointmentTab[] = ['All', 'scheduled', 'confirmed', 'completed', 'cancelled'];

  reminderChannels: { value: ReminderChannel; label: string }[] = [
    { value: 'sms',   label: 'SMS' },
    { value: 'email', label: 'Email' },
    { value: 'both',  label: 'SMS & Email' }
  ];

  addForm = this.fb.group({
    contactId:       [null as number | null, Validators.required],
    title:           ['', Validators.required],
    scheduledAt:     ['', Validators.required],
    reminderChannel: ['sms' as ReminderChannel, Validators.required],
    notes:           ['', [Validators.maxLength(500)]],
  });

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private toast: ToastService,
    private dialog: DialogService
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.loadContacts();
  }

  // ── Computed getters ──────────────────────────────────────────────────────

  /** Appointments filtered by the active tab */
  get filteredAppointments(): Appointment[] {
    if (this.activeTab === 'All') return this.appointments;
    return this.appointments.filter(a => a.status === this.activeTab);
  }

  /** Count of appointments matching a given status (used for tab badges) */
  tabCount(status: AppointmentTab): number {
    if (status === 'All') return this.appointments.length;
    return this.appointments.filter(a => a.status === status).length;
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  /** Returns the first letter of a name, uppercased */
  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  /** Formats an ISO date string to a human-readable date + time */
  formatDateTime(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · '
      + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  // ── API calls ─────────────────────────────────────────────────────────────

  loadAppointments(): void {
    this.loading = true;
    this.api.get<Appointment[]>('/appointments').subscribe({
      next: (data) => {
        this.appointments = data.sort((a, b) =>
          new Date(b.scheduled_at ?? b.scheduledAt ?? '').getTime() -
          new Date(a.scheduled_at ?? a.scheduledAt ?? '').getTime()
        );
        this.loading = false;
      },
      error: () => { this.toast.error('Failed to load appointments.'); this.loading = false; }
    });
  }

  loadContacts(): void {
    this.api.get<Contact[]>('/contacts').subscribe({
      next: (data) => this.contacts = data,
      error: () => this.toast.error('Failed to load contacts.')
    });
  }

  isPastDate(): boolean {
    const val = this.addForm.get('scheduledAt')?.value;
    if (!val) return false;
    return new Date(val) < new Date();
  }

  submitAdd(): void {
    if (this.addForm.invalid) return;
    if (this.isPastDate()) {
      this.addForm.get('scheduledAt')?.setErrors({ pastDate: true });
      return;
    }
    const { contactId, title, scheduledAt, reminderChannel, notes } = this.addForm.value;
    const dto: AppointmentCreateDto = {
      contactId: contactId!,
      title: title!,
      scheduledAt: new Date(scheduledAt!).toISOString(),
      reminderChannel: reminderChannel!,
      notes: notes || undefined,
    };
    this.api.post<Appointment>('/appointments', dto).subscribe({
      next: () => {
        this.toast.success('Appointment created.');
        this.addForm.reset({ reminderChannel: 'sms', notes: '' });
        this.showAddForm = false;
        this.loadAppointments();
      },
      error: () => this.toast.error('Failed to create appointment.')
    });
  }

  getContactName(appointment: Appointment): string {
    return appointment.contacts?.name ?? appointment.Contact?.name ?? `Contact #${appointment.contact_id ?? appointment.contactId}`;
  }

  deleteAppointment(appointment: Appointment): void {
    const ref = this.dialog.open({
      title: 'Delete Appointment',
      message: `Delete "${appointment.title}"?`,
      confirmLabel: 'Delete'
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.delete(`/appointments/${appointment.id}`).subscribe({
          next: () => { this.toast.success('Appointment deleted.'); this.loadAppointments(); },
          error: () => this.toast.error('Failed to delete appointment.')
        });
      }
    });
  }
}
