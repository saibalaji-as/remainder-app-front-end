import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { DialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmailTemplate, DEFAULT_TEMPLATE, ALLOWED_MERGE_TAGS } from '../../../../core/models/email-template.model';
import {
  AppShellComponent,
  PageHeaderComponent,
  SkeletonLoaderComponent,
} from '../../../../shared/components/index';

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppShellComponent,
    PageHeaderComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './template-editor.component.html',
  styleUrls: ['./template-editor.component.scss'],
})
export class TemplateEditorComponent implements OnInit {
  form: FormGroup;
  loading = false;
  saving = false;
  preview = '';
  validationWarnings: string[] = [];

  // Exposed so the template can reference them in hint/placeholder text
  readonly contactName = '{{contactName}}';
  readonly appointmentDate = '{{appointmentDate}}';
  readonly notes = '{{notes}}';

  private readonly sampleContext = {
    contactName: 'Jane Smith',
    appointmentDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    notes: 'Please bring your insurance card',
  };

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private toast: ToastService,
    private dialog: DialogService,
  ) {
    this.form = this.fb.group({
      subject:  ['', [Validators.required, Validators.maxLength(150)]],
      greeting: ['', Validators.required],
      body:     ['', Validators.required],
      closing:  ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.api.get<EmailTemplate>('/email-templates').subscribe({
      next: (data) => {
        this.form.patchValue(data);
        this.loading = false;
        this.updatePreview();
      },
      error: () => {
        this.form.patchValue(DEFAULT_TEMPLATE);
        this.loading = false;
        this.toast.error('Failed to load template. Showing default.');
        this.updatePreview();
      },
    });
  }

  onFieldChange(): void {
    this.updatePreview();
    this.updateWarnings();
  }

  updatePreview(): void {
    const { subject, greeting, body, closing } = this.form.value as EmailTemplate;
    const render = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/\{\{contactName\}\}/g, this.sampleContext.contactName)
        .replace(/\{\{appointmentDate\}\}/g, this.sampleContext.appointmentDate)
        .replace(/\{\{notes\}\}/g, this.sampleContext.notes);
    };

    this.preview = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 1.5rem; color: #1a1a1a;">
        <p style="font-size: 0.75rem; color: #888; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">
          Subject: ${render(subject)}
        </p>
        <p style="margin-bottom: 1rem;">${render(greeting)}</p>
        <p style="margin-bottom: 1rem; white-space: pre-line;">${render(body)}</p>
        <p style="margin-top: 1.5rem; color: #555;">${render(closing)}</p>
      </div>
    `;
  }

  updateWarnings(): void {
    const allText = Object.values(this.form.value as EmailTemplate).join('\n');
    const tagPattern = /\{\{[^}]+\}\}/g;
    const found = allText.match(tagPattern) ?? [];
    const unique = [...new Set(found)];
    this.validationWarnings = unique.filter(tag => !ALLOWED_MERGE_TAGS.includes(tag));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.api.post<EmailTemplate>('/email-templates', this.form.value).subscribe({
      next: () => {
        this.toast.success('Template saved successfully.');
        this.saving = false;
      },
      error: (err) => {
        if (err?.status === 422 && err?.error?.errors) {
          const errors: { param: string; msg: string }[] = err.error.errors;
          errors.forEach(e => {
            const ctrl = this.form.get(e.param);
            if (ctrl) {
              ctrl.setErrors({ serverError: e.msg });
            }
          });
          this.toast.error('Please fix the highlighted errors.');
        } else {
          this.toast.error('Failed to save template. Please try again.');
        }
        this.saving = false;
      },
    });
  }

  resetToDefault(): void {
    const ref = this.dialog.open({
      title: 'Reset to Default',
      message: 'This will restore the default email template. Continue?',
      confirmLabel: 'Reset',
      cancelLabel: 'Cancel',
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.form.patchValue(DEFAULT_TEMPLATE);
        this.updatePreview();
        this.updateWarnings();
      }
    });
  }
}
