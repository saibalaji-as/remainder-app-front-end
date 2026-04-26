import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  form = this.fb.group({
    name:       ['', Validators.required],
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', [Validators.required, Validators.minLength(8)]],
    tenantName: ['', Validators.required]
  });

  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const { name, email, password, tenantName } = this.form.value;
    this.authService.register({
      name: name!,
      email: email!,
      password: password!,
      tenantName: tenantName!
    }).subscribe({
      next: () => {
        this.toast.success('Account created successfully!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.toast.error(err?.error?.message ?? 'Registration failed. Please try again.');
        this.loading = false;
      }
    });
  }
}
