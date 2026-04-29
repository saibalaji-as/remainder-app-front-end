import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss'],
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);

  theme$ = this.themeService.theme$;

  toggle(): void {
    this.themeService.toggle();
  }
}
