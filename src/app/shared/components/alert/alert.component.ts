import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alert" [class]="'alert--' + type" *ngIf="message">
      {{ message }}
    </div>
  `,
  styles: [`
    .alert {
      padding: $spacing-md;
      margin: $spacing-md 0;
      border: 1px solid transparent;

      &--success {
        border-color: $color-black;
        background: $color-gray-100;
      }

      &--error {
        border-color: #ff0000;
        background: #fff5f5;
      }

      &--info {
        border-color: $color-gray-400;
        background: $color-gray-100;
      }
    }
  `]
})
export class AlertComponent {
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'info' = 'info';
}
