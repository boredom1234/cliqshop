import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="close.emit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <button class="modal__close" (click)="close.emit()">×</button>
        <div class="modal__content">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba($color-black, 0.5);
      z-index: $z-index-modal;
      @include flex-center;
    }

    .modal {
      background: $color-white;
      padding: $spacing-xl;
      max-width: 90%;
      width: 500px;
      position: relative;

      &__close {
        position: absolute;
        top: $spacing-sm;
        right: $spacing-sm;
        border: none;
        background: none;
        font-size: $font-size-2xl;
        cursor: pointer;
        padding: $spacing-xs;
      }
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
}
