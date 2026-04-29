import { AfterViewInit, Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from '../../../../core/services/theme.service';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';

interface PhoneMsg {
  id: number;
  kind: 'sms' | 'email' | 'confirm';
  title: string;
  body: string;
  time: string;
}

const MSG_SEQ: PhoneMsg[] = [
  { id: 1, kind: 'sms',     title: 'Schedify SMS',         body: 'Hi Sarah — reminder: dental cleaning tomorrow at 10:00 AM.', time: '24h before' },
  { id: 2, kind: 'email',   title: 'Appointment reminder', body: 'Your visit with Dr. Chen is confirmed for tomorrow.',         time: 'Email · 24h' },
  { id: 3, kind: 'sms',     title: 'Schedify SMS',         body: 'Starting in 2 hours. Reply C to confirm, R to reschedule.',  time: '2h before'  },
  { id: 4, kind: 'confirm', title: 'Confirmed',            body: 'Sarah confirmed her appointment.',                           time: 'just now'   },
];

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ThemeToggleComponent,
    MatExpansionModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  private themeService = inject(ThemeService);

  navScrolled = false;
  menuOpen = false;
  currentYear = new Date().getFullYear();
  visibleMessages: PhoneMsg[] = [];

  private animCancelled = false;
  private animTimeout: ReturnType<typeof setTimeout> | null = null;
  openFaq: number | null = null;
  private revealObserver!: IntersectionObserver;

  trustedBy = ['BrightSmile', 'Lumen Studio', 'Zenith Clinic', 'Pulse Fitness', 'Atelier Hair', 'Nomad Vet'];

  stats = [
    { value: '20%',    label: 'Average no-show rate across appointment businesses' },
    { value: '$200+',  label: 'Revenue lost per missed appointment on average' },
    { value: '1 in 3', label: 'Appointments missed without any reminder system' },
  ];

  steps = [
    { icon: 'group_add',          title: 'Add your contacts',           desc: 'Import your customer list via CSV or add contacts manually in seconds.' },
    { icon: 'calendar_today',     title: 'Schedule appointments',       desc: 'Book appointments in Schedify and let the system handle the rest automatically.' },
    { icon: 'notifications_active', title: 'Reminders go out automatically', desc: 'SMS and email reminders sent at 24 hrs, 2 hrs, and 30 min before each appointment.' },
  ];

  features = [
    { icon: 'sms',          title: 'SMS Reminders',        desc: 'Instant text reminders delivered straight to your customers\' phones.',          tint: 'violet'  },
    { icon: 'email',        title: 'Email Reminders',      desc: 'Branded email reminders with appointment details and confirmation links.',        tint: 'fuchsia' },
    { icon: 'hub',          title: 'Multi-channel',        desc: 'Reach customers on both SMS and email — maximise reminder delivery.',             tint: 'cyan'    },
    { icon: 'schedule',     title: 'Automated Scheduling', desc: 'Set reminder timing once. Schedify fires them automatically every time.',         tint: 'indigo'  },
    { icon: 'check_circle', title: 'Confirmation Tracking',desc: 'Know who confirmed, who ignored, and follow up accordingly.',                    tint: 'emerald' },
    { icon: 'business',     title: 'Works for Any Business',desc: 'Clinics, salons, consultants, law firms — if you book appointments, we help.',  tint: 'amber'   },
  ];

  plans = [
    {
      name: 'Basic',
      tagline: 'For solo practitioners getting started.',
      price: '₹499',
      period: '/mo',
      popular: false,
      perks: ['Up to 100 reminders/mo', 'SMS + Email', 'CSV import', 'Email support'],
    },
    {
      name: 'Growth',
      tagline: 'For growing teams who need more.',
      price: '₹699',
      period: '/mo',
      popular: true,
      perks: ['Up to 500 reminders/mo', 'SMS + Email', 'CSV import', 'Confirmation tracking', 'Priority support'],
    },
    {
      name: 'Pro',
      tagline: 'For busy clinics and multi-location businesses.',
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
      tint: 'violet',
    },
    {
      quote: 'My salon used to lose 3–4 bookings a week to no-shows. Now clients always show up. Setup took less than 10 minutes!',
      name: 'Kavitha R.',
      business: 'Salon, Bangalore',
      tint: 'fuchsia',
    },
    {
      quote: 'As a consultant, every missed meeting costs me money. Schedify pays for itself with just one recovered appointment per month.',
      name: 'Arjun M.',
      business: 'Consultant, Mumbai',
      tint: 'cyan',
    },
  ];

  faqs = [
    { q: 'How quickly can I get started?',              a: 'You can be up and running in under 10 minutes. Sign up, import your contacts, and schedule your first appointment — Schedify handles the rest.' },
    { q: 'What types of businesses can use Schedify?',  a: 'Any appointment-based business: dental clinics, salons, physiotherapy centers, law firms, consultants, tutors, and more.' },
    { q: 'Does Schedify send both SMS and email reminders?', a: 'Yes. Every plan includes both SMS and email reminders. You can configure which channels to use per appointment type.' },
    { q: 'Can my customers confirm or cancel via the reminder?', a: 'Yes. Reminders include a confirmation link. You can track responses in your Schedify dashboard in real time.' },
    { q: 'Is there a free trial?',                      a: 'Absolutely. Start your free trial with no credit card required. Explore all features for 14 days on us.' },
    { q: 'Can I cancel my subscription at any time?',   a: 'Yes, you can cancel anytime from your billing settings. There are no long-term contracts or cancellation fees.' },
  ];

  footerCols = [
    { title: 'Product',   links: ['Features', 'Pricing', 'Integrations', 'Changelog'] },
    { title: 'Company',   links: ['About', 'Customers', 'Careers', 'Contact'] },
    { title: 'Resources', links: ['Docs', 'Help center', 'API', 'Status'] },
    { title: 'Legal',     links: ['Privacy', 'Terms', 'Security', 'DPA'] },
  ];

  ngOnInit(): void {
    this.runPhoneAnimation();
  }

  ngOnDestroy(): void {
    this.animCancelled = true;
    if (this.animTimeout) clearTimeout(this.animTimeout);
    this.revealObserver?.disconnect();
  }

  ngAfterViewInit(): void {
    this.setupReveal();
  }

  toggleFaq(i: number): void {
    this.openFaq = this.openFaq === i ? null : i;
  }

  private setupReveal(): void {
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset['delay'] ?? '0';
            setTimeout(() => el.classList.add('revealed'), Number(delay));
            this.revealObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );

    const targets = document.querySelectorAll('.reveal');
    targets.forEach(el => this.revealObserver.observe(el));
  }

  private runPhoneAnimation(): void {
    if (this.animCancelled) return;
    this.visibleMessages = [];
    let i = 0;
    const addNext = () => {
      if (this.animCancelled) return;
      if (i < MSG_SEQ.length) {
        this.visibleMessages = [...this.visibleMessages, MSG_SEQ[i]];
        i++;
        this.animTimeout = setTimeout(addNext, 1200);
      } else {
        this.animTimeout = setTimeout(() => this.runPhoneAnimation(), 3200);
      }
    };
    this.animTimeout = setTimeout(addNext, 800);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.navScrolled = window.scrollY > 10;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  scrollTo(id: string): void {
    this.menuOpen = false;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
