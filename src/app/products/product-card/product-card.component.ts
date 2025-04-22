import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Product } from '../services/product.service';
import { CartService } from '../../cart/services/cart.service';
import { AuthService } from '../../auth/services/auth.service';
import { UserRole } from '../../auth/models/user.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="product-card">
      <div class="product-image">
        <img [src]="product.imageUrl || 'assets/images/placeholder.jpg'" [alt]="product.name">
      </div>
      <div class="product-info">
        <h3 class="product-name">{{ product.name }}</h3>
        <div class="product-meta">
          <span class="product-category">{{ product.category }}</span>
          <div class="product-rating">
            <span class="rating-stars">
              <ng-container *ngFor="let star of [1, 2, 3, 4, 5]">
                <i class="fa" [ngClass]="{
                  'fa-star': star <= product.averageRating,
                  'fa-star-half-o': star - 0.5 <= product.averageRating && star > product.averageRating,
                  'fa-star-o': star > product.averageRating && star - 0.5 > product.averageRating
                }"></i>
              </ng-container>
            </span>
          </div>
        </div>
        <div class="product-price">
          {{ product.price | currency }}
        </div>
        <div class="product-actions">
          <a [routerLink]="['/products', product.id]" class="view-details">View Details</a>
          <button *ngIf="!isAdminOrStaff" class="add-to-cart" (click)="addToCart($event)" [disabled]="isAddingToCart">
            <i class="fa" [ngClass]="{'fa-shopping-cart': !isAddingToCart, 'fa-spinner fa-spin': isAddingToCart}"></i>
          </button>
        </div>
        <div class="added-notification" *ngIf="showAddedNotification">
          Added to cart!
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as vars;

    .product-card {
      border: 1px solid vars.$color-gray-200;
      border-radius: 4px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      background: vars.$color-white;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
      }
    }

    .product-image {
      position: relative;
      padding-bottom: 100%; // 1:1 aspect ratio
      overflow: hidden;
      
      img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }
      
      &:hover img {
        transform: scale(1.05);
      }
    }

    .product-info {
      padding: vars.$spacing-md;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .product-name {
      font-size: vars.$font-size-base;
      margin: 0 0 vars.$spacing-xs;
      color: vars.$color-black;
      font-weight: 500;
      line-height: 1.4;
    }

    .product-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: vars.$spacing-sm;
    }

    .product-category {
      font-size: vars.$font-size-xs;
      color: vars.$color-gray-600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .product-rating {
      font-size: vars.$font-size-xs;
      color: #FFB800; // Star color
    }

    .product-price {
      font-size: vars.$font-size-base;
      font-weight: 500;
      margin-bottom: vars.$spacing-md;
      margin-top: auto;
    }

    .product-actions {
      display: flex;
      justify-content: space-between;
      gap: vars.$spacing-sm;
    }

    .view-details {
      flex: 1;
      display: inline-block;
      padding: vars.$spacing-xs vars.$spacing-sm;
      font-size: vars.$font-size-xs;
      text-transform: uppercase;
      text-decoration: none;
      color: vars.$color-black;
      border: 1px solid vars.$color-gray-300;
      text-align: center;
      transition: all 0.3s ease;
      
      &:hover {
        background: vars.$color-black;
        color: vars.$color-white;
        border-color: vars.$color-black;
      }
    }

    .add-to-cart {
      width: 36px;
      height: 36px;
      border: 1px solid vars.$color-gray-300;
      background: vars.$color-white;
      color: vars.$color-black;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background: vars.$primary-color;
        color: vars.$color-white;
        border-color: vars.$primary-color;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .added-notification {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: #E8F5E9;
      color: #2E7D32;
      text-align: center;
      padding: vars.$spacing-xs;
      font-size: vars.$font-size-xs;
      transform: translateY(0);
      animation: slideUp 3s forwards;
    }

    @keyframes slideUp {
      0% { transform: translateY(100%); }
      10% { transform: translateY(0); }
      90% { transform: translateY(0); }
      100% { transform: translateY(100%); }
    }
  `]
})
export class ProductCardComponent {
  @Input() product!: Product;
  isAddingToCart = false;
  showAddedNotification = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService
  ) {}

  get isAdminOrStaff(): boolean {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return false;
    return currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.STAFF;
  }

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.isAddingToCart) return;
    
    this.isAddingToCart = true;
    
    this.cartService.addToCart(this.product, 1).subscribe({
      next: () => {
        this.isAddingToCart = false;
        this.showAddedNotification = true;
        
        // Force refresh the cart count in header
        this.cartService.refreshCartCount();
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          this.showAddedNotification = false;
        }, 3000);
      },
      error: (error) => {
        console.error('Error adding product to cart:', error);
        this.isAddingToCart = false;
      }
    });
  }
}
