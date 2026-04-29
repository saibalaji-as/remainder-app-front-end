import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.scss'],
})
export class SkeletonLoaderComponent {
  /** Width of the skeleton block (any valid CSS value) */
  @Input() width = '100%';
  /** Height of the skeleton block (any valid CSS value) */
  @Input() height = '1rem';
  /** When true, applies full border-radius (pill/circle shape) */
  @Input() rounded = false;
}
