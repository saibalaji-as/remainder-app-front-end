import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { Reminder, DeliveryStatus } from '../../../../core/models/reminder.model';

@Component({
  selector: 'app-reminder-log',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatChipsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './reminder-log.component.html',
  styleUrls: ['./reminder-log.component.scss']
})
export class ReminderLogComponent implements OnInit {
  reminders: Reminder[] = [];
  filteredReminders: Reminder[] = [];
  displayedColumns = ['id', 'appointmentId', 'channel', 'scheduledFor', 'sentAt', 'status'];
  loading = false;
  selectedStatus: DeliveryStatus | 'all' = 'all';

  statusOptions: Array<{ value: DeliveryStatus | 'all'; label: string }> = [
    { value: 'all',     label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'sent',    label: 'Sent' },
    { value: 'failed',  label: 'Failed' }
  ];

  constructor(
    private api: ApiService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadReminders();
  }

  loadReminders(): void {
    this.loading = true;
    this.api.get<Reminder[]>('/reminders').subscribe({
      next: (data) => {
        this.reminders = data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.toast.error('Failed to load reminders.'); this.loading = false; }
    });
  }

  applyFilter(): void {
    this.filteredReminders = this.selectedStatus === 'all'
      ? this.reminders
      : this.reminders.filter(r => r.status === this.selectedStatus);
  }

  onStatusFilter(status: DeliveryStatus | 'all'): void {
    this.selectedStatus = status;
    this.applyFilter();
  }

  statusClass(status: DeliveryStatus): string {
    return `status-${status}`;
  }
}
