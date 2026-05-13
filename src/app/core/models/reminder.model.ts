// Matches Supabase reminders table column names (snake_case)
export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'skipped';
export type ReminderChannel = 'sms' | 'email' | 'both' | 'whatsapp' | 'whatsapp_sms' | 'whatsapp_email' | 'all';

export interface Reminder {
  id: string;
  appointment_id: string;
  channel: ReminderChannel;
  status: DeliveryStatus;
  scheduled_at: string;   // ISO datetime
  sent_at: string | null;
  provider_message_id?: string | null;
  provider_status?: string | null;
  provider_error_code?: string | null;
  created_at: string;
  updated_at: string;
}
