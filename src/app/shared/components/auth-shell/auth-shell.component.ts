import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrandMarkComponent } from '../brand-mark/brand-mark.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule, BrandMarkComponent, ThemeToggleComponent],
  templateUrl: './auth-shell.component.html',
  styleUrls: ['./auth-shell.component.scss'],
})
export class AuthShellComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
}
