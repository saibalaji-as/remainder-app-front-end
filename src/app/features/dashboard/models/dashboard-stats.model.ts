export interface TrendObject {
  value: number | null;
  direction: 'up' | 'down' | 'neutral';
}

export interface DashboardStatsBlock {
  totalContacts: number;
  totalAppointments: number;
  totalRemindersSent: number;
  totalRemindersFailed: number;
  deliveryRate: number;
  trends: {
    totalAppointments: TrendObject;
    totalRemindersSent: TrendObject;
    deliveryRate: TrendObject;
  };
}

export interface GraphDataEntry {
  day: string;
  date: string;
  appts: number;
  reminders: number;
}

export interface UpcomingAppointment {
  id: string;
  title: string;
  scheduled_at: string;
  contact: {
    name: string;
    phone: string;
  };
}

export interface RecentReminder {
  id: string;
  status: string;
  sent_at: string | null;
  scheduled_at: string;
  appointment_id: string;
  channel: string;
  appointment_title: string;
}

export interface DashboardStatsResponse {
  stats: DashboardStatsBlock;
  graphData: GraphDataEntry[];
  pieData: {
    sms: number;
    email: number;
    whatsapp: number;
  };
  upcomingAppointments: UpcomingAppointment[];
  recentReminders: RecentReminder[];
}
