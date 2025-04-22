import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner">
      <div class="spinner__circle"></div>
    </div>
  `,
  styles: [`
    .spinner {
      @include flex-center;
      width: 100%;
      height: 100%;
      
      &__circle {
        width: 40px;
        height: 40px;
        border: 2px solid $color-gray-300;
        border-top-color: $color-black;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SpinnerComponent {}
