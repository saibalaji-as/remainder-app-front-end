import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-brand-mark',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './brand-mark.component.html',
  styleUrls: ['./brand-mark.component.scss'],
})
export class BrandMarkComponent {
  @Input() size: number = 36;
  @Input() link: string = '/';

  get iconSize(): number {
    return this.size * 0.5;
  }
}
