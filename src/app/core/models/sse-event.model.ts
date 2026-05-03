export interface EmailSentEvent {
  reminderId:       number;
  contactName:      string;
  appointmentTitle: string;
}

export interface SmsSentEvent {
  reminderId:       number;
  contactName:      string;
  appointmentTitle: string;
}

export interface WhatsAppSentEvent {
  reminderId:       number;
  contactName:      string;
  appointmentTitle: string;
}
