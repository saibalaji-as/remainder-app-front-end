import { AppointmentStatus } from './appointment.model';

export interface AppointmentConfirmView {
  appointmentId: string;
  title: string;
  contactName: string;
  scheduledAt: string;
  notes: string | null;
  status: AppointmentStatus;
}

export interface NudgeEvent {
  appointmentId: string;
  title: string;
  contactName: string;
  scheduledAt: string;
}
