import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { Appointment, AppointmentCreateDto, ReminderChannel } from '../../../../core/models/appointment.model';
import { Contact } from '../../../../core/models/contact.model';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatChipsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.scss']
})
export class AppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  contacts: Contact[] = [];
  displayedColumns = ['title', 'contact', 'scheduledAt', 'reminderChannel', 'status', 'actions'];
  loading = false;
  showAddForm = false;

  reminderChannels: { value: ReminderChannel; label: string }[] = [
    { value: 'sms',   label: 'SMS' },
    { value: 'email', label: 'Email' },
    { value: 'both',  label: 'SMS & Email' }
  ];

  addForm = this.fb.group({
    contactId:       [null as number | null, Validators.required],
    title:           ['', Validators.required],
    scheduledAt:     ['', Validators.required],   // datetime-local input → ISO string
    reminderChannel: ['sms' as ReminderChannel, Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.loadContacts();
  }

  loadAppointments(): void {
    this.loading = true;
    this.api.get<Appointment[]>('/appointments').subscribe({
      next: (data) => {
        // Sort by scheduledAt descending
        this.appointments = data.sort((a, b) =>
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
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
    const { contactId, title, scheduledAt, reminderChannel } = this.addForm.value;
    const dto: AppointmentCreateDto = {
      contactId: contactId!,
      title: title!,
      scheduledAt: new Date(scheduledAt!).toISOString(),
      reminderChannel: reminderChannel!
    };
    this.api.post<Appointment>('/appointments', dto).subscribe({
      next: () => {
        this.toast.success('Appointment created.');
        this.addForm.reset({ reminderChannel: 'sms' });
        this.showAddForm = false;
        this.loadAppointments();
      },
      error: () => this.toast.error('Failed to create appointment.')
    });
  }

  getContactName(appointment: Appointment): string {
    return appointment.Contact?.name ?? `Contact #${appointment.contactId}`;
  }
}
