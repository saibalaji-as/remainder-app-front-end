// Matches Supabase appointments table column names (snake_case)
export type ReminderChannel =
  | 'sms'
  | 'email'
  | 'both'
  | 'whatsapp'
  | 'whatsapp_sms'
  | 'whatsapp_email'
  | 'all';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

export const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled:  ['confirmed', 'cancelled'],
  confirmed:  ['completed', 'cancelled'],
  completed:  [],
  cancelled:  [],
};

export interface Appointment {
  id: string;
  tenant_id?: string;
  contact_id?: string;
  title: string;
  scheduled_at?: string;      // ISO 8601 datetime string (snake_case from Supabase)
  reminder_channel?: ReminderChannel;
  status: AppointmentStatus;
  confirmation_token?: string;
  notes?: string;             // optional, max 500 chars
  created_at?: string;
  updated_at?: string;
  contacts?: {                // included via Supabase join on GET /appointments
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  // Legacy camelCase aliases kept for backward compat (populated by some endpoints)
  contactId?: string;
  scheduledAt?: string;
  reminderChannel?: ReminderChannel;
  Contact?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export interface AppointmentCreateDto {
  contactId: number;
  title: string;
  scheduledAt: string;        // ISO 8601 datetime string
  reminderChannel: ReminderChannel;
  notes?: string;
}

export interface AppointmentUpdateDto {
  title?: string;
  scheduledAt?: string;
  reminderChannel?: ReminderChannel;
  status?: AppointmentStatus;
  notes?: string;
}
