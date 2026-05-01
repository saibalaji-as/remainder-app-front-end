export interface EmailTemplate {
  subject:  string;
  greeting: string;
  body:     string;
  closing:  string;
}

export const DEFAULT_TEMPLATE: EmailTemplate = {
  subject:  'Appointment Reminder — {{appointmentDate}}',
  greeting: 'Hi {{contactName}},',
  body:     'This is a reminder for your upcoming appointment scheduled on {{appointmentDate}}.\n{{notes}}',
  closing:  'If you need to reschedule, please reply to this email.',
};

export const ALLOWED_MERGE_TAGS: string[] = [
  '{{contactName}}',
  '{{appointmentDate}}',
  '{{notes}}',
];
