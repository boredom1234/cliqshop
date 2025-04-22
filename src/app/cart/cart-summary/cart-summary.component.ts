import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Cart } from '../services/cart.service';

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="cart-summary">
      <h2 class="summary-title">Order Summary</h2>
      
      <div class="summary-details">
        <div class="summary-row">
          <span class="summary-label">Subtotal ({{ cart.totalItems }} {{ cart.totalItems === 1 ? 'item' : 'items' }})</span>
          <span class="summary-value">{{ cart.subtotal | currency }}</span>
        </div>
        
        <div class="summary-row">
          <span class="summary-label">Shipping</span>
          <span class="summary-value shipping-value">Calculated at checkout</span>
        </div>
        
        <div class="summary-row">
          <span class="summary-label">Tax</span>
          <span class="summary-value shipping-value">Calculated at checkout</span>
        </div>
        
        <div class="summary-divider"></div>
        
        <div class="summary-row total-row">
          <span class="summary-label">Estimated Total</span>
          <span class="summary-value total-value">{{ cart.subtotal | currency }}</span>
        </div>
      </div>
      
      <div class="summary-actions">
        <button class="checkout-button" [disabled]="cart.totalItems === 0" (click)="onCheckout()" [routerLink]="cart.totalItems > 0 ? ['/order/checkout'] : null">
          Proceed to Checkout
        </button>
        
        <button class="continue-shopping" routerLink="/products">
          Continue Shopping
        </button>
      </div>
      
      <div class="payment-methods">
        <p class="payment-title">We Accept</p>
        <div class="payment-icons">
          <i class="fa fa-cc-visa"></i>
          <i class="fa fa-cc-mastercard"></i>
          <i class="fa fa-cc-amex"></i>
          <i class="fa fa-cc-paypal"></i>
          <i class="fa-solid fa-qrcode"></i>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as vars;

    .cart-summary {
      background-color: vars.$color-gray-100;
      border-radius: 4px;
      padding: vars.$spacing-lg;
    }

    .summary-title {
      font-size: vars.$font-size-lg;
      font-weight: 500;
      margin: 0 0 vars.$spacing-lg;
    }

    .summary-details {
      margin-bottom: vars.$spacing-lg;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: vars.$spacing-sm;
      font-size: vars.$font-size-sm;
    }

    .summary-label {
      color: vars.$color-gray-700;
    }

    .summary-value {
      font-weight: 500;
    }

    .shipping-value {
      font-weight: normal;
      font-style: italic;
      color: vars.$color-gray-600;
    }

    .summary-divider {
      height: 1px;
      background-color: vars.$color-gray-300;
      margin: vars.$spacing-md 0;
    }

    .total-row {
      font-size: vars.$font-size-base;
      margin-top: vars.$spacing-sm;
    }

    .total-value {
      font-weight: 600;
    }

    .summary-actions {
      display: flex;
      flex-direction: column;
      gap: vars.$spacing-sm;
      margin-bottom: vars.$spacing-lg;
    }

    .checkout-button {
      background-color: vars.$color-black;
      color: vars.$color-white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      height: 40px;
      line-height: 1;
      
      &:hover:not(:disabled) {
        background-color: vars.$color-gray-800;
      }
      
      &:disabled {
        background-color: vars.$color-gray-500;
        cursor: not-allowed;
      }
    }

    .continue-shopping {
      background-color: transparent;
      color: vars.$color-black;
      border: 1px solid vars.$color-black;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      height: 40px;
      line-height: 1;
      
      &:hover {
        background-color: vars.$color-black;
        color: vars.$color-white;
      }
    }

    .payment-methods {
      text-align: center;
      margin-top: vars.$spacing-lg;
    }

    .payment-title {
      font-size: vars.$font-size-xs;
      color: vars.$color-gray-600;
      margin-bottom: vars.$spacing-xs;
    }

    .payment-icons {
      display: flex;
      justify-content: center;
      gap: vars.$spacing-sm;
      font-size: vars.$font-size-xl;
      color: vars.$color-gray-500;
    }
  `]
})
export class CartSummaryComponent {
  @Input() cart!: Cart;
  @Output() checkout = new EventEmitter<void>();

  onCheckout(): void {
    this.checkout.emit();
  }
}
