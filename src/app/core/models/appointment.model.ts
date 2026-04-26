// Matches backend Appointment Sequelize model fields
export type ReminderChannel = 'sms' | 'email' | 'both';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id: number;
  tenant_id: number;
  contactId: number;
  title: string;
  scheduledAt: string;    // ISO 8601 datetime string
  reminderChannel: ReminderChannel;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  Contact?: {             // included via Sequelize association on GET /appointments
    id: number;
    name: string;
    email: string;
    phone: string;
  };
}

export interface AppointmentCreateDto {
  contactId: number;
  title: string;
  scheduledAt: string;    // ISO 8601 datetime string
  reminderChannel: ReminderChannel;
}
