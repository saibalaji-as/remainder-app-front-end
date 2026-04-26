# Reminder App Frontend

B2B Appointment Reminder SaaS Dashboard built with Angular 21, Angular Material, RxJS, and SCSS.

## Project Structure

```
src/app/
├── core/
│   ├── guards/          # AuthGuard (functional)
│   ├── interceptors/    # JWT interceptor (functional)
│   ├── models/          # TypeScript interfaces (Tenant, Contact, Appointment, Reminder, BillingPlan)
│   └── services/        # ApiService, AuthService, TenantService
├── shared/
│   ├── components/      # LoadingSpinnerComponent, ConfirmDialogComponent (standalone)
│   └── services/        # ToastService
└── features/
    ├── auth/            # Login, Register pages
    ├── dashboard/       # Stats overview
    ├── contacts/        # Contact list, add form, CSV import
    ├── appointments/    # Appointment list, add form, reminder rules
    ├── reminders/       # Reminder log, SMS template editor
    └── billing/         # Plan display, credits, upgrade
```

## Getting Started

```bash
npm install
npm start          # dev server at http://localhost:4200
npm run build      # production build
```

## Key Features

- JWT authentication with automatic token injection via HTTP interceptor
- Functional AuthGuard protecting all routes except `/login` and `/register`
- All feature modules are lazy-loaded
- Standalone components throughout feature modules
- Debounced search (300ms) in Contacts
- CSV import with preview in Contacts
- Configurable reminder rules (24h, 2h, 1h) per appointment
- Reminder delivery log with status filtering (sent / delivered / failed)
- SMS template editor with placeholder support
- Low-credit warning when SMS balance < 10
- Environment-based API URL configuration

## Environment Configuration

Edit `src/environments/environment.ts` for development:
```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api'
};
```
