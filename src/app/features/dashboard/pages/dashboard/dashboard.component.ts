import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { Appointment } from '../../../../core/models/appointment.model';
import {
  AppShellComponent,
  StatCardComponent,
  StatusPillComponent,
  ChannelChipComponent,
  SkeletonLoaderComponent,
} from '../../../../shared/components/index';

// ── UI-only view models ──────────────────────────────────────────────────────

interface DashboardStats {
  totalAppointments: number;
  completionRate: number;
  scheduledToday: number;
  completed: number;
}

interface Reminder {
  id: number;
  appointmentId: number;
  channel: 'sms' | 'email' | 'both';
  status: 'pending' | 'sent' | 'failed';
  scheduledFor: string;
  sentAt: string | null;
}

// ── Mock data for visual preview ─────────────────────────────────────────────

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 1, tenant_id: 1, contactId: 1, title: 'Hair color session',   scheduledAt: _daysFromNow(1, 11, 13), reminderChannel: 'sms',   status: 'scheduled',  createdAt: '', updatedAt: '', Contact: { id: 1, name: 'Sneha Patil',      email: 's@e.com', phone: '' } },
  { id: 2, tenant_id: 1, contactId: 2, title: 'Dental cleaning',      scheduledAt: _daysFromNow(2, 11, 13), reminderChannel: 'email', status: 'scheduled',  createdAt: '', updatedAt: '', Contact: { id: 2, name: 'Arjun Mehta',      email: 'a@e.com', phone: '' } },
  { id: 3, tenant_id: 1, contactId: 3, title: 'Yoga consultation',    scheduledAt: _daysFromNow(2, 14, 13), reminderChannel: 'both',  status: 'scheduled',  createdAt: '', updatedAt: '', Contact: { id: 3, name: 'Garima Iyer',      email: 'g@e.com', phone: '' } },
  { id: 4, tenant_id: 1, contactId: 4, title: 'Tax consultation',     scheduledAt: _daysFromNow(3, 11,  1), reminderChannel: 'sms',   status: 'scheduled',  createdAt: '', updatedAt: '', Contact: { id: 4, name: 'Arya Mishra',      email: 'ar@e.com', phone: '' } },
  { id: 5, tenant_id: 1, contactId: 5, title: 'Vet checkup',          scheduledAt: _daysFromNow(4, 19, 18), reminderChannel: 'email', status: 'scheduled',  createdAt: '', updatedAt: '', Contact: { id: 5, name: 'Mohammed Farhan', email: 'm@e.com', phone: '' } },
  { id: 6, tenant_id: 1, contactId: 6, title: 'Dietitian visit',      scheduledAt: _daysFromNow(-7, 10, 0), reminderChannel: 'email', status: 'completed',  createdAt: '', updatedAt: '', Contact: { id: 6, name: 'Divya Nair',       email: 'd@e.com', phone: '' } },
  { id: 7, tenant_id: 1, contactId: 7, title: 'Eye exam',             scheduledAt: _daysFromNow(-5, 14, 0), reminderChannel: 'sms',   status: 'completed',  createdAt: '', updatedAt: '', Contact: { id: 7, name: 'Priya Iyer',       email: 'p@e.com', phone: '' } },
  { id: 8, tenant_id: 1, contactId: 8, title: 'Hair color session',   scheduledAt: _daysFromNow(-3, 16, 0), reminderChannel: 'email', status: 'completed',  createdAt: '', updatedAt: '', Contact: { id: 8, name: 'Sneha Patil',      email: 's2@e.com', phone: '' } },
  { id: 9, tenant_id: 1, contactId: 9, title: 'Therapy session',      scheduledAt: _daysFromNow(-2, 11, 0), reminderChannel: 'email', status: 'completed',  createdAt: '', updatedAt: '', Contact: { id: 9, name: 'Rhea Nair',        email: 'r@e.com', phone: '' } },
  { id:10, tenant_id: 1, contactId:10, title: 'Spa appointment',      scheduledAt: _daysFromNow(-1, 15, 0), reminderChannel: 'email', status: 'completed',  createdAt: '', updatedAt: '', Contact: { id:10, name: 'Tia Bose',         email: 't@e.com', phone: '' } },
  { id:11, tenant_id: 1, contactId:11, title: 'Physiotherapy',        scheduledAt: _daysFromNow(-6, 9,  0), reminderChannel: 'sms',   status: 'cancelled',  createdAt: '', updatedAt: '', Contact: { id:11, name: 'Karan Singh',      email: 'k@e.com', phone: '' } },
  { id:12, tenant_id: 1, contactId:12, title: 'Nutrition consult',    scheduledAt: _daysFromNow(-4, 13, 0), reminderChannel: 'both',  status: 'completed',  createdAt: '', updatedAt: '', Contact: { id:12, name: 'Ananya Roy',       email: 'an@e.com', phone: '' } },
];

const MOCK_REMINDERS: Reminder[] = [
  { id: 1, appointmentId: 6,  channel: 'email', status: 'sent',    scheduledFor: _daysFromNow(-7, 9,  0), sentAt: _daysFromNow(-7, 9, 0) },
  { id: 2, appointmentId: 7,  channel: 'sms',   status: 'sent',    scheduledFor: _daysFromNow(-5, 13, 0), sentAt: _daysFromNow(-5, 13, 0) },
  { id: 3, appointmentId: 8,  channel: 'email', status: 'sent',    scheduledFor: _daysFromNow(-3, 15, 0), sentAt: _daysFromNow(-3, 15, 0) },
  { id: 4, appointmentId: 9,  channel: 'email', status: 'sent',    scheduledFor: _daysFromNow(-2, 10, 0), sentAt: _daysFromNow(-2, 10, 0) },
  { id: 5, appointmentId: 10, channel: 'email', status: 'sent',    scheduledFor: _daysFromNow(-1, 14, 0), sentAt: _daysFromNow(-1, 14, 0) },
  { id: 6, appointmentId: 11, channel: 'sms',   status: 'failed',  scheduledFor: _daysFromNow(-6, 8,  0), sentAt: null },
  { id: 7, appointmentId: 12, channel: 'both',  status: 'sent',    scheduledFor: _daysFromNow(-4, 12, 0), sentAt: _daysFromNow(-4, 12, 0) },
  { id: 8, appointmentId: 1,  channel: 'sms',   status: 'pending', scheduledFor: _daysFromNow(0, 20,  0), sentAt: null },
  { id: 9, appointmentId: 2,  channel: 'email', status: 'pending', scheduledFor: _daysFromNow(1, 10,  0), sentAt: null },
  { id:10, appointmentId: 3,  channel: 'both',  status: 'pending', scheduledFor: _daysFromNow(1, 13,  0), sentAt: null },
  { id:11, appointmentId: 4,  channel: 'sms',   status: 'pending', scheduledFor: _daysFromNow(2, 10,  0), sentAt: null },
  { id:12, appointmentId: 5,  channel: 'email', status: 'pending', scheduledFor: _daysFromNow(3, 18,  0), sentAt: null },
];

function _daysFromNow(days: number, hour = 12, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    AppShellComponent,
    StatCardComponent,
    StatusPillComponent,
    ChannelChipComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  // ── State ──────────────────────────────────────────────────────────────────
  stats: DashboardStats | null = null;
  loading = true;
  error = false;

  appointments: Appointment[] = [];
  reminders: Reminder[] = [];

  // ── Chart data ─────────────────────────────────────────────────────────────
  areaChartData: ChartData<'line'> = { labels: [], datasets: [] };
  donutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  areaChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'var(--card)',
        titleColor: 'var(--foreground)',
        bodyColor: 'var(--muted-foreground)',
        borderWidth: 1,
        padding: 10,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(128,128,128,0.12)' },
        ticks: { font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(128,128,128,0.12)' },
        beginAtZero: true,
        ticks: { stepSize: 5, font: { size: 11 } },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
      },
      line: {
        borderWidth: 2,
      },
    },
  };

  donutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'var(--card)',
        titleColor: 'var(--foreground)',
        bodyColor: 'var(--muted-foreground)',
        borderWidth: 1,
        padding: 10,
      },
    },
    cutout: '68%',
  };

  // ── Donut legend data (rendered manually for custom layout) ────────────────
  donutLegend: { label: string; color: string; count: number }[] = [];

  // ── Derived lists ──────────────────────────────────────────────────────────
  get upcomingAppointments(): Appointment[] {
    const now = new Date();
    return [...this.appointments]
      .filter(a => new Date(a.scheduledAt) >= now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 5);
  }

  get recentReminders(): Reminder[] {
    return [...this.reminders]
      .sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime())
      .slice(0, 5);
  }

  // ── Private ────────────────────────────────────────────────────────────────
  private themeSub?: Subscription;

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.themeSub = this.themeService.theme$.subscribe(() => {
      this.buildChartData();
    });
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
  }

  // ── Data loading ───────────────────────────────────────────────────────────
  private loadData(): void {
    this.loading = true;
    this.error = false;

    let appointmentsDone = false;
    let remindersDone = false;

    const checkDone = () => {
      if (appointmentsDone && remindersDone) {
        this.deriveStats();
        this.buildChartData();
        this.loading = false;
      }
    };

    this.api.get<Appointment[]>('/appointments').subscribe({
      next: (appointments) => {
        // Merge real data with mock; real data takes precedence
        this.appointments = appointments.length > 0 ? appointments : MOCK_APPOINTMENTS;
        appointmentsDone = true;
        checkDone();
      },
      error: () => {
        // Fall back to mock data so the UI is never empty
        this.appointments = MOCK_APPOINTMENTS;
        appointmentsDone = true;
        checkDone();
      },
    });

    this.api.get<Reminder[]>('/reminders').subscribe({
      next: (reminders) => {
        this.reminders = reminders.length > 0 ? reminders : MOCK_REMINDERS;
        remindersDone = true;
        checkDone();
      },
      error: () => {
        this.reminders = MOCK_REMINDERS;
        remindersDone = true;
        checkDone();
      },
    });
  }

  // ── Stats derivation ───────────────────────────────────────────────────────
  private deriveStats(): void {
    const today = new Date().toDateString();
    const total = this.appointments.length;
    const completed = this.appointments.filter(a => a.status === 'completed').length;
    const scheduledToday = this.appointments.filter(
      a => new Date(a.scheduledAt).toDateString() === today,
    ).length;

    this.stats = {
      totalAppointments: total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      scheduledToday,
      completed,
    };
  }

  // ── Chart building ─────────────────────────────────────────────────────────
  private getChartColors(): { chart1: string; chart2: string; gridColor: string; textColor: string; borderColor: string } {
    const style = getComputedStyle(document.documentElement);
    const isDark = !document.documentElement.classList.contains('light');
    return {
      chart1: style.getPropertyValue('--chart-1').trim() || '#e879f9',
      chart2: style.getPropertyValue('--chart-2').trim() || '#22d3ee',
      gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
      textColor: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)',
      borderColor: isDark ? 'rgba(255,255,255,0)' : 'rgba(0,0,0,0)',
    };
  }

  private buildChartData(): void {
    const { chart1, chart2, gridColor, textColor, borderColor } = this.getChartColors();

    // SMS = primary (pink/magenta), Email = teal/cyan (distinct), Both = muted
    const smsColor   = chart1;                    // pink / magenta
    const emailColor = '#22d3ee';                 // teal / cyan — always distinct
    const bothColor  = 'rgba(128,128,128,0.55)';  // neutral grey

    // Update area chart options with theme-aware colors
    this.areaChartOptions = {
      ...this.areaChartOptions,
      plugins: {
        ...this.areaChartOptions.plugins,
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
            padding: 16,
            font: { size: 12 },
            color: textColor,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(30,20,50,0.92)',
          titleColor: '#fff',
          bodyColor: 'rgba(255,255,255,0.7)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 10,
          usePointStyle: true,
        },
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 11 } },
          border: { color: borderColor },
        },
        y: {
          grid: { color: gridColor },
          beginAtZero: true,
          ticks: { stepSize: 5, color: textColor, font: { size: 11 } },
          border: { color: borderColor },
        },
      },
    };

    // Build last 7 days labels + data
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const labels: string[] = [];
    const apptCounts: number[] = [];
    const reminderCounts: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(days[d.getDay()]);
      const dateStr = d.toDateString();
      apptCounts.push(
        this.appointments.filter(a => new Date(a.scheduledAt).toDateString() === dateStr).length,
      );
      reminderCounts.push(
        this.reminders.filter(r => new Date(r.scheduledFor).toDateString() === dateStr).length,
      );
    }

    this.areaChartData = {
      labels,
      datasets: [
        {
          label: 'Appointments',
          data: apptCounts,
          borderColor: chart1,
          backgroundColor: chart1 + '28',
          fill: true,
          tension: 0.45,
          pointBackgroundColor: chart1,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Reminders',
          data: reminderCounts,
          borderColor: emailColor,
          backgroundColor: emailColor + '22',
          fill: true,
          tension: 0.45,
          pointBackgroundColor: emailColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    // Donut chart — breakdown by channel
    const smsCount   = this.reminders.filter(r => r.channel === 'sms').length;
    const emailCount = this.reminders.filter(r => r.channel === 'email').length;
    const bothCount  = this.reminders.filter(r => r.channel === 'both').length;

    this.donutChartData = {
      labels: ['SMS', 'Email', 'Both'],
      datasets: [
        {
          data: [smsCount, emailCount, bothCount],
          backgroundColor: [smsColor, emailColor, bothColor],
          borderColor: 'transparent',
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };

    // Build manual legend
    this.donutLegend = [
      { label: 'SMS',   color: smsColor,   count: smsCount   },
      { label: 'Email', color: emailColor, count: emailCount },
      ...(bothCount > 0 ? [{ label: 'Both', color: bothColor, count: bothCount }] : []),
    ];
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getAppointmentTitle(appointmentId: number): string {
    return this.appointments.find(a => a.id === appointmentId)?.title ?? '—';
  }

  getContactName(appointmentId: number): string {
    return this.appointments.find(a => a.id === appointmentId)?.Contact?.name ?? '—';
  }

  /** Returns a relative time string like "in 2 days", "3 hours ago" */
  formatRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (Math.abs(diffMins) < 60) {
      return diffMins >= 0
        ? `in ${diffMins} min`
        : `${Math.abs(diffMins)} min ago`;
    }
    if (Math.abs(diffHours) < 24) {
      return diffHours >= 0
        ? `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
        : `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''} ago`;
    }
    return diffDays >= 0
      ? `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`
      : `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
  }

  /** Short date like "Apr 30, 11:13 AM" */
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}
