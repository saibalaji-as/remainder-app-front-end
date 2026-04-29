import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-brand-mark',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './brand-mark.component.html',
  styleUrls: ['./brand-mark.component.scss'],
})
export class BrandMarkComponent {
  @Input() size: number = 36;

  get iconSize(): number {
    return this.size * 0.5;
  }
}
