import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AppShellComponent } from '../../../../shared/components/app-shell/app-shell.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusPillComponent } from '../../../../shared/components/status-pill/status-pill.component';
import { Subscription, SubscribeDto } from '../../../../core/models/billing.model';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: string;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppShellComponent,
    PageHeaderComponent,
    StatusPillComponent
  ],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
  subscription: Subscription | null = null;
  loading = true;
  showSubscribeForm = false;
  cancelling = false;

  activePlanId = 'pro';

  plans: Plan[] = [
    { id: 'starter', name: 'Starter', price: '$9', period: '/mo', features: ['Up to 100 reminders/mo', 'SMS + Email', 'CSV import', 'Email support'] },
    { id: 'pro', name: 'Pro', price: '$29', period: '/mo', features: ['Up to 500 reminders/mo', 'SMS + Email', 'CSV import', 'Confirmation tracking', 'Priority support'] },
    { id: 'business', name: 'Business', price: '$79', period: '/mo', features: ['Unlimited reminders', 'SMS + Email', 'CSV import', 'Confirmation tracking', 'Custom branding', 'Dedicated support'] },
  ];

  invoices: Invoice[] = [
    { id: 'INV-001', date: '2024-01-01', amount: '$29.00', status: 'paid' },
    { id: 'INV-002', date: '2024-02-01', amount: '$29.00', status: 'paid' },
    { id: 'INV-003', date: '2024-03-01', amount: '$29.00', status: 'pending' },
  ];

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
    this.api.get<{ subscription: Subscription | null }>('/billing/subscribe').subscribe({
      next: (res) => {
        this.subscription = res.subscription;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load subscription.');
        this.loading = false;
      }
    });
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
