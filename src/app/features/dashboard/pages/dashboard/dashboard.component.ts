import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Subscription } from 'rxjs';
import { ToastService } from '../../../../shared/services/toast.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStatsResponse } from '../../models/dashboard-stats.model';
import {
  AppShellComponent,
  StatCardComponent,
  StatusPillComponent,
  SkeletonLoaderComponent,
} from '../../../../shared/components/index';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    AppShellComponent,
    StatCardComponent,
    StatusPillComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  // ── State ──────────────────────────────────────────────────────────────────
  statsResponse: DashboardStatsResponse | null = null;
  loading = true;
  error = false;

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
        ticks: { stepSize: 2, font: { size: 11 } },
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

  // ── Private ────────────────────────────────────────────────────────────────
  private themeSub?: Subscription;
  private statsSub?: Subscription;

  constructor(
    private toast: ToastService,
    private themeService: ThemeService,
    private dashboardService: DashboardService,
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.themeSub = this.themeService.theme$.subscribe(() => {
      this.buildChartData();
    });
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
    this.statsSub?.unsubscribe();
  }

  // ── Data loading ───────────────────────────────────────────────────────────
  private loadStats(): void {
    this.loading = true;
    this.error = false;

    this.statsSub = this.dashboardService.getStats().subscribe({
      next: (response) => {
        this.statsResponse = response;
        this.buildChartData();
        this.loading = false;
        this.error = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  // ── Chart building ─────────────────────────────────────────────────────────
  private getChartColors(): { chart1: string; chart2: string; gridColor: string; textColor: string; borderColor: string } {
    const style = getComputedStyle(document.documentElement);
    const isDark = !document.documentElement.classList.contains('light');
    return {
      chart1: style.getPropertyValue('--chart-1').trim() || '#e879f9',
      chart2: style.getPropertyValue('--chart-2').trim() || '#22d3ee',
      gridColor:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
      textColor:   isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)',
      borderColor: isDark ? 'rgba(255,255,255,0)'    : 'rgba(0,0,0,0)',
    };
  }

  private buildChartData(): void {
    const { chart1, chart2, gridColor, textColor, borderColor } = this.getChartColors();

    // Appointments = pink/magenta, Reminders = teal/cyan
    // Use hardcoded hex so rgba() alpha appending always works correctly.
    // chart1 from CSS variables returns hsl/rgb strings — not safe to append hex alpha.
    const apptColor     = '#e879f9';  // pink / magenta
    const reminderColor = '#22d3ee';  // teal / cyan
    const smsColor      = apptColor;  // alias for donut chart

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
          ticks: { stepSize: 2, color: textColor, font: { size: 11 } },
          border: { color: borderColor },
        },
      },
    };

    // Area chart — read from statsResponse.graphData
    const graphData = this.statsResponse?.graphData ?? [];
    const labels = graphData.map(d => d.day);
    const apptCounts = graphData.map(d => d.appts);
    const reminderCounts = graphData.map(d => d.reminders);

    this.areaChartData = {
      labels,
      datasets: [
        {
          label: 'Appointments',
          data: apptCounts,
          borderColor: apptColor,
          backgroundColor: apptColor + '22',   // ~13% opacity — matches Reminders shade
          fill: true,
          tension: 0.45,
          pointBackgroundColor: apptColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Reminders',
          data: reminderCounts,
          borderColor: reminderColor,
          backgroundColor: reminderColor + '22', // ~13% opacity
          fill: true,
          tension: 0.45,
          pointBackgroundColor: reminderColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    // Donut chart — read from statsResponse.pieData
    const smsCount   = this.statsResponse?.pieData?.sms   ?? 0;
    const emailCount = this.statsResponse?.pieData?.email ?? 0;

    this.donutChartData = {
      labels: ['SMS', 'Email'],
      datasets: [
        {
          data: [smsCount, emailCount],
          backgroundColor: [smsColor, reminderColor],
          borderColor: 'transparent',
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };

    // Build manual legend — exactly two entries
    this.donutLegend = [
      { label: 'SMS',   color: smsColor,      count: smsCount   },
      { label: 'Email', color: reminderColor, count: emailCount },
    ];
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Formats a trend value as a human-readable label. */
  formatTrendLabel(value: number | null): string {
    if (value === null) return 'No data';
    if (value > 0) return `+${value}% this week`;
    return `${value}% this week`;
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
