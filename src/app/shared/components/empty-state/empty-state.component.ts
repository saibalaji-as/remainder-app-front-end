import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
})
export class EmptyStateComponent {
  /** Optional SVG path string for the icon rendered inside the gradient chip */
  @Input() icon?: string;
  /** Required heading text */
  @Input() title: string = '';
  /** Optional supporting description text */
  @Input() description?: string;
}
