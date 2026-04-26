// Matches backend Reminder Sequelize model fields
export type DeliveryStatus = 'pending' | 'sent' | 'failed';
export type ReminderChannel = 'sms' | 'email' | 'both';

export interface Reminder {
  id: number;
  tenant_id: number;
  appointmentId: number;
  channel: ReminderChannel;
  status: DeliveryStatus;
  scheduledFor: string;   // ISO datetime
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}
