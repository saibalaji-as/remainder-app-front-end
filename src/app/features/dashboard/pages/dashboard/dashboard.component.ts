import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { Appointment } from '../../../../core/models/appointment.model';

interface DashboardStats {
  totalAppointments: number;
  completedAppointments: number;
  completionRate: number;
  scheduledToday: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, LoadingSpinnerComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.api.get<Appointment[]>('/appointments').subscribe({
      next: (appointments) => {
        const today = new Date().toDateString();
        const total = appointments.length;
        const completed = appointments.filter(a => a.status === 'completed').length;
        const scheduledToday = appointments.filter(a =>
          new Date(a.scheduledAt).toDateString() === today
        ).length;

        this.stats = {
          totalAppointments: total,
          completedAppointments: completed,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          scheduledToday
        };
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load dashboard stats.');
        this.loading = false;
      }
    });
  }
}
