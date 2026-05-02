import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppointmentConfirmView } from '../../core/models/confirm.model';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-confirmation-page',
  standalone: true,
  imports: [CommonModule, StatusPillComponent],
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss'],
})
export class ConfirmationPageComponent implements OnInit {
  token: string | null = null;
  appointment: AppointmentConfirmView | null = null;
  loading = true;
  responding = false;
  responded = false;
  responseType: 'yes' | 'no' | null = null;
  error: string | null = null;

  @ViewChild('successState') successStateRef?: ElementRef<HTMLElement>;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] ?? null;

      if (!this.token) {
        this.loading = false;
        this.error = 'Invalid confirmation link';
        return;
      }

      const autoResponse = params['response'] as 'yes' | 'no' | undefined;
      this.loadAppointment(autoResponse);
    });
  }

  loadAppointment(autoResponse?: 'yes' | 'no'): void {
    this.loading = true;
    this.error = null;

    this.http
      .get<AppointmentConfirmView>(
        `${environment.apiBaseUrl}/confirm?token=${this.token}`,
      )
      .subscribe({
        next: appt => {
          this.appointment = appt;
          this.loading = false;

          // Auto-submit if a response query param was provided (email button links)
          if (autoResponse === 'yes' || autoResponse === 'no') {
            const alreadyActioned =
              appt.status === 'confirmed' || appt.status === 'cancelled';
            if (!alreadyActioned) {
              this.respond(autoResponse);
            }
          }
        },
        error: err => {
          this.loading = false;
          this.error =
            err?.error?.message ?? 'Failed to load appointment details. Please try again.';
        },
      });
  }

  respond(answer: 'yes' | 'no'): void {
    if (this.responding || this.responded) return;

    this.responding = true;
    this.error = null;

    this.http
      .post<{ status: string }>(`${environment.apiBaseUrl}/confirm`, {
        token: this.token,
        response: answer,
      })
      .subscribe({
        next: () => {
          this.responding = false;
          this.responded = true;
          this.responseType = answer;
          setTimeout(() => this.successStateRef?.nativeElement?.focus(), 50);
        },
        error: err => {
          this.responding = false;
          this.error =
            err?.error?.message ?? 'Something went wrong. Please try again.';
        },
      });
  }

  get isAlreadyActioned(): boolean {
    return (
      this.appointment?.status === 'confirmed' ||
      this.appointment?.status === 'cancelled'
    );
  }

  get areButtonsDisabled(): boolean {
    return this.responded || this.responding || this.isAlreadyActioned;
  }
}
