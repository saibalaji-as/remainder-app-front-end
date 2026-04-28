import { Component, HostListener, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  navScrolled = false;

  stats = [
    { value: '20%', label: 'Average no-show rate across appointment businesses' },
    { value: '$200+', label: 'Revenue lost per missed appointment on average' },
    { value: '1 in 3', label: 'Appointments missed without any reminder system' },
  ];

  steps = [
    {
      icon: 'group_add',
      title: 'Add your contacts',
      desc: 'Import your customer list via CSV or add contacts manually in seconds.',
    },
    {
      icon: 'calendar_today',
      title: 'Schedule appointments',
      desc: 'Book appointments in Schedify and let the system handle the rest automatically.',
    },
    {
      icon: 'notifications_active',
      title: 'Reminders go out automatically',
      desc: 'SMS and email reminders sent at 24 hrs, 2 hrs, and 30 min before each appointment.',
    },
  ];

  features = [
    { icon: 'sms', title: 'SMS Reminders', desc: 'Instant text reminders delivered straight to your customers\' phones.' },
    { icon: 'email', title: 'Email Reminders', desc: 'Branded email reminders with appointment details and confirmation links.' },
    { icon: 'hub', title: 'Multi-channel', desc: 'Reach customers on both SMS and email — maximise reminder delivery.' },
    { icon: 'schedule', title: 'Automated Scheduling', desc: 'Set reminder timing once. Schedify fires them automatically every time.' },
    { icon: 'check_circle', title: 'Confirmation Tracking', desc: 'Know who confirmed, who ignored, and follow up accordingly.' },
    { icon: 'business', title: 'Works for Any Business', desc: 'Clinics, salons, consultants, law firms — if you book appointments, we help.' },
  ];

  plans = [
    {
      name: 'Basic',
      price: '₹499',
      period: '/mo',
      popular: false,
      perks: ['Up to 100 reminders/mo', 'SMS + Email', 'CSV import', 'Email support'],
    },
    {
      name: 'Growth',
      price: '₹699',
      period: '/mo',
      popular: true,
      perks: ['Up to 500 reminders/mo', 'SMS + Email', 'CSV import', 'Confirmation tracking', 'Priority support'],
    },
    {
      name: 'Pro',
      price: '₹999',
      period: '/mo',
      popular: false,
      perks: ['Unlimited reminders', 'SMS + Email', 'CSV import', 'Confirmation tracking', 'Custom branding', 'Dedicated support'],
    },
  ];

  testimonials = [
    {
      quote: 'Since using Schedify, our no-show rate dropped from 25% to under 5%. The automated reminders save my receptionist hours every week.',
      name: 'Dr. Priya S.',
      business: 'Dental Clinic, Chennai',
    },
    {
      quote: 'My salon used to lose 3–4 bookings a week to no-shows. Now clients always show up. Setup took less than 10 minutes!',
      name: 'Kavitha R.',
      business: 'Salon, Bangalore',
    },
    {
      quote: 'As a consultant, every missed meeting costs me money. Schedify pays for itself with just one recovered appointment per month.',
      name: 'Arjun M.',
      business: 'Consultant, Mumbai',
    },
  ];

  faqs = [
    {
      q: 'How quickly can I get started?',
      a: 'You can be up and running in under 10 minutes. Sign up, import your contacts, and schedule your first appointment — Schedify handles the rest.',
    },
    {
      q: 'What types of businesses can use Schedify?',
      a: 'Any appointment-based business: dental clinics, salons, physiotherapy centers, law firms, consultants, tutors, and more.',
    },
    {
      q: 'Does Schedify send both SMS and email reminders?',
      a: 'Yes. Every plan includes both SMS and email reminders. You can configure which channels to use per appointment type.',
    },
    {
      q: 'Can my customers confirm or cancel via the reminder?',
      a: 'Yes. Reminders include a confirmation link. You can track responses in your Schedify dashboard in real time.',
    },
    {
      q: 'Is there a free trial?',
      a: 'Absolutely. Start your free trial with no credit card required. Explore all features for 14 days on us.',
    },
    {
      q: 'Can I cancel my subscription at any time?',
      a: 'Yes, you can cancel anytime from your billing settings. There are no long-term contracts or cancellation fees.',
    },
  ];

  ngOnInit(): void {}

  @HostListener('window:scroll')
  onScroll(): void {
    this.navScrolled = window.scrollY > 10;
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
