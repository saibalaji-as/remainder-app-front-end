import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { Subscription, SubscribeDto } from '../../../../core/models/billing.model';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
  subscription: Subscription | null = null;
  loading = true;
  showSubscribeForm = false;
  cancelling = false;

  subscribeForm = this.fb.group({
    priceId:         ['', Validators.required],
    paymentMethodId: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadSubscription();
  }

  loadSubscription(): void {
    this.loading = true;
    // GET /billing/subscribe is not a backend endpoint — subscription info
    // comes back after POST. We show the subscribe form if no active subscription.
    this.loading = false;
  }

  subscribe(): void {
    if (this.subscribeForm.invalid) return;
    const dto = this.subscribeForm.value as SubscribeDto;
    this.api.post<Subscription>('/billing/subscribe', dto).subscribe({
      next: (sub) => {
        this.subscription = sub;
        this.showSubscribeForm = false;
        this.toast.success('Subscription activated.');
      },
      error: (err) => this.toast.error(err?.error?.error ?? 'Subscription failed.')
    });
  }

  cancelSubscription(): void {
    this.cancelling = true;
    this.api.delete<Subscription>('/billing/subscribe').subscribe({
      next: (sub) => {
        this.subscription = sub;
        this.cancelling = false;
        this.toast.success('Subscription cancelled.');
      },
      error: (err) => {
        this.toast.error(err?.error?.error ?? 'Cancellation failed.');
        this.cancelling = false;
      }
    });
  }
}
