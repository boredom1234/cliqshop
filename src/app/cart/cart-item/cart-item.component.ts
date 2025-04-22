import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartItem } from '../services/cart.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="cart-item">
      <div class="item-image">
        <img [src]="safeImage" [alt]="safeItemName">
      </div>
      
      <div class="item-details">
        <div class="item-name">
          <a [routerLink]="['/products', safeProductId]">{{ safeItemName }}</a>
        </div>
        
        <div class="item-price">
          {{ safePrice | currency }}
        </div>
        
        <div class="item-quantity">
          <button class="quantity-btn" (click)="updateQuantity(safeQuantity - 1)" [disabled]="safeQuantity <= 1 || updating">
            <i class="fa fa-minus"></i>
          </button>
          
          <input
            type="number"
            [ngModel]="safeQuantity"
            (ngModelChange)="onQuantityChanged($event)"
            min="1"
            max="99"
            step="1"
            class="quantity-input"
            [disabled]="updating"
            (blur)="validateQuantity()"
          >
          
          <button class="quantity-btn" (click)="updateQuantity(safeQuantity + 1)" [disabled]="safeQuantity >= 99 || updating">
            <i class="fa fa-plus"></i>
          </button>
        </div>
      </div>
      
      <div class="item-total">
        <div class="total-price">{{ safeTotalPrice | currency }}</div>
        <button class="remove-btn" (click)="removeItem()" [disabled]="updating">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cart-item {
      display: grid;
      grid-template-columns: 100px 1fr auto;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      align-items: center;
      
      @media (max-width: 640px) {
        grid-template-columns: 80px 1fr;
      }
    }

    .item-image {
      width: 100px;
      height: 100px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      @media (max-width: 640px) {
        width: 80px;
        height: 80px;
      }
    }

    .item-details {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .item-name {
      font-weight: 500;
      margin-bottom: 0.5rem;
      
      a {
        color: #111827;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }

    .item-price {
      color: #4b5563;
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }

    .item-quantity {
      display: flex;
      align-items: center;
      
      .quantity-btn {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        border: 1px solid #d1d5db;
        color: #111827;
        cursor: pointer;
        
        &:hover:not(:disabled) {
          background: #f3f4f6;
        }
        
        &:disabled {
          color: #9ca3af;
          cursor: not-allowed;
        }
      }
      
      .quantity-input {
        width: 40px;
        height: 28px;
        border: 1px solid #d1d5db;
        border-left: none;
        border-right: none;
        text-align: center;
        -moz-appearance: textfield;
        
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        &:focus {
          outline: none;
        }
      }
    }

    .item-total {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.75rem;
      
      @media (max-width: 640px) {
        grid-column: 2;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        margin-top: 0.75rem;
      }
    }

    .total-price {
      font-weight: 500;
      color: #111827;
    }

    .remove-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #ffffff;
      border: 1px solid #111827;
      border-radius: 0.25rem;
      color: #111827;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background: #111827;
        color: #ffffff;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      i {
        font-size: 1rem;
      }
    }

    // Add disabled state for buttons and inputs
    .quantity-btn:disabled, .quantity-input:disabled, .remove-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class CartItemComponent implements OnInit, OnDestroy {
  @Input() item!: CartItem;
  @Output() quantityChanged = new EventEmitter<{itemId: number, quantity: number}>();
  @Output() itemRemoved = new EventEmitter<number>();

  // Track updating state to disable UI during updates
  updating = false;
  
  // Create a subject for debouncing quantity changes
  private quantitySubject = new Subject<number>();
  private subscriptions = new Subscription();

  // Safe getters for potentially undefined properties
  get safeItemId(): number {
    return this.item?.id || 0;
  }
  
  get safeProductId(): number {
    return this.item?.productId || 0;
  }
  
  get safeItemName(): string {
    return this.item?.name || 'Unknown Product';
  }
  
  get safePrice(): number {
    return this.item?.price || 0;
  }
  
  get safeQuantity(): number {
    return this.item?.quantity || 1;
  }
  
  get safeImage(): string {
    return this.item?.image || 'assets/images/placeholder.jpg';
  }
  
  get safeTotalPrice(): number {
    // Use existing totalPrice or calculate if not available
    return this.item?.totalPrice !== undefined 
      ? this.item.totalPrice 
      : this.safePrice * this.safeQuantity;
  }
  
  ngOnInit(): void {
    // Validate item data on initialization
    if (!this.item) {
      console.warn('Cart item component received undefined or null item');
      // Create a default empty item to prevent errors
      this.item = {
        id: 0,
        productId: 0,
        name: 'Unknown Product',
        price: 0,
        image: 'assets/images/placeholder.jpg',
        quantity: 1,
        totalPrice: 0
      };
    }

    // Set up the debounced quantity change handler
    this.subscriptions.add(
      this.quantitySubject.pipe(
        debounceTime(500), // Wait 500ms after last change
        distinctUntilChanged() // Only proceed if value changed
      ).subscribe(quantity => {
        this.updating = true;
        this.quantityChanged.emit({itemId: this.safeItemId, quantity});
        // The updating state will be reset when the cart page finishes updating
        setTimeout(() => this.updating = false, 2000); // Fallback timeout
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.unsubscribe();
  }

  updateQuantity(quantity: number): void {
    if (quantity >= 1 && quantity <= 99 && !this.updating) {
      // Send to the debounce subject
      this.quantitySubject.next(quantity);
    }
  }

  onQuantityChanged(value: string | number): void {
    // Convert value to a number
    let quantity: number;
    if (typeof value === 'string') {
      // Handle empty string case
      if (value.trim() === '') {
        // Reset input to previous valid quantity and return
        setTimeout(() => this.updating = false, 0);
        return;
      }
      quantity = parseInt(value, 10);
    } else {
      quantity = value;
    }

    // Validate the quantity
    if (isNaN(quantity) || quantity < 1) {
      // Reset to 1 if invalid or less than 1
      quantity = 1;
    } else if (quantity > 99) {
      // Cap at 99
      quantity = 99;
    }

    // Only emit if not currently updating and quantity is valid
    if (!this.updating) {
      // Send to the debounce subject
      this.quantitySubject.next(quantity);
    }
  }

  removeItem(): void {
    if (!this.updating) {
      this.updating = true;
      this.itemRemoved.emit(this.safeItemId);
    }
  }

  validateQuantity(): void {
    // When input loses focus, ensure the value is valid
    if (this.safeQuantity < 1) {
      // Reset to 1 if less than 1
      this.updateQuantity(1);
    } else if (this.safeQuantity > 99) {
      // Cap at 99
      this.updateQuantity(99);
    }
  }
}
