import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService, Product, ProductDetail } from '../services/product.service';
import { ReviewListComponent } from '../review-list/review-list.component';
import { AddReviewComponent } from '../add-review/add-review.component';
import { CartService } from '../../cart/services/cart.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, ReviewListComponent, AddReviewComponent, FormsModule],
  template: `
    <div class="product-details-container" *ngIf="product && !error; else loadingOrError">
      <div class="product-breadcrumb">
        <a routerLink="/products">All Products</a>
        <span class="separator">/</span>
        <span>{{ product.category }}</span>
        <span class="separator">/</span>
        <span class="current">{{ product.name }}</span>
      </div>
      
      <div class="product-main">
        <div class="product-gallery">
          <div class="product-image">
            <img [src]="product.imageUrl || 'assets/images/placeholder.jpg'" [alt]="product.name">
          </div>
        </div>
        
        <div class="product-info">
          <h1 class="product-name">{{ product.name }}</h1>
          
          <div class="product-rating">
            <div class="rating-stars">
              <ng-container *ngFor="let star of [1, 2, 3, 4, 5]">
                <i class="fa" [ngClass]="{
                  'fa-star': star <= product.averageRating,
                  'fa-star-half-o': star - 0.5 <= product.averageRating && star > product.averageRating,
                  'fa-star-o': star > product.averageRating && star - 0.5 > product.averageRating
                }"></i>
              </ng-container>
            </div>
            <span class="rating-text" *ngIf="product.averageRating > 0">
              {{ product.averageRating.toFixed(1) }} / 5.0
            </span>
            <span class="rating-text" *ngIf="!product.averageRating">
              No ratings yet
            </span>
          </div>
          
          <div class="product-price">
            {{ product.price | currency }}
          </div>
          
          <div class="product-description">
            <p>{{ product.description }}</p>
          </div>
          
          <div class="product-quantity">
            <label for="quantity">Quantity:</label>
            <div class="quantity-controls">
              <button class="quantity-btn" (click)="decreaseQuantity()" [disabled]="quantity <= 1">
                <i class="fa fa-minus"></i>
              </button>
              <input 
                type="number" 
                id="quantity" 
                [(ngModel)]="quantity" 
                min="1" 
                max="99"
                class="quantity-input"
              >
              <button class="quantity-btn" (click)="increaseQuantity()" [disabled]="quantity >= 99">
                <i class="fa fa-plus"></i>
              </button>
            </div>
          </div>
          
          <div class="product-actions">
            <button class="add-to-cart-btn" (click)="addToCart()">
              <i class="fa fa-shopping-cart"></i> Add to Cart
            </button>
          </div>
          
          <div class="product-meta">
            <p><strong>Category:</strong> {{ product.category }}</p>
          </div>
          
          <div class="added-notification" *ngIf="showAddedNotification">
            <i class="fa fa-check-circle"></i>
            Item added to cart
            <button class="view-cart-link" routerLink="/cart">View Cart</button>
          </div>
        </div>
      </div>
      
      <div class="product-tabs">
        <div class="tab-buttons">
          <button 
            class="tab-button" 
            [class.active]="activeTab === 'description'"
            (click)="activeTab = 'description'"
          >
            Description
          </button>
          <button 
            class="tab-button" 
            [class.active]="activeTab === 'reviews'"
            (click)="activeTab = 'reviews'"
          >
            Reviews
          </button>
        </div>
        
        <div class="tab-content">
          <div class="tab-panel" *ngIf="activeTab === 'description'">
            <h3>Product Description</h3>
            <p>{{ product.description }}</p>
          </div>
          
          <div class="tab-panel" *ngIf="activeTab === 'reviews'">
            <app-review-list [productId]="productId"></app-review-list>
            
            <div class="add-review-section">
              <app-add-review [productId]="productId" (reviewAdded)="onReviewAdded()"></app-add-review>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <ng-template #loadingOrError>
      <div class="loading-container" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading product details...</p>
      </div>
      
      <div class="error-container" *ngIf="error">
        <div class="error-icon">
          <i class="fa fa-exclamation-circle"></i>
        </div>
        <h2>Product Not Found</h2>
        <p>{{ error }}</p>
        <button class="back-button" routerLink="/products">Back to Products</button>
      </div>
    </ng-template>
  `,
  styles: [`
    @use '../../../styles/variables' as vars;

    .product-details-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: vars.$spacing-lg;
    }

    .product-breadcrumb {
      margin-bottom: vars.$spacing-lg;
      font-size: vars.$font-size-sm;
      color: vars.$color-gray-600;
      
      a {
        color: vars.$color-gray-600;
        text-decoration: none;
        
        &:hover {
          color: vars.$color-black;
        }
      }
      
      .separator {
        margin: 0 vars.$spacing-xs;
      }
      
      .current {
        color: vars.$color-gray-800;
      }
    }

    .product-main {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: vars.$spacing-xl;
      margin-bottom: vars.$spacing-xl;
      
      @media (max-width: vars.$breakpoint-md) {
        grid-template-columns: 1fr;
      }
    }

    .product-gallery {
      .product-image {
        width: 100%;
        height: 0;
        padding-bottom: 100%; // 1:1 aspect ratio
        position: relative;
        overflow: hidden;
        border: 1px solid vars.$color-gray-200;
        
        img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }

    .product-info {
      display: flex;
      flex-direction: column;
      gap: vars.$spacing-md;
    }

    .product-name {
      font-size: vars.$font-size-2xl;
      margin: 0;
      font-weight: 500;
    }

    .product-rating {
      display: flex;
      align-items: center;
      gap: vars.$spacing-sm;
      
      .rating-stars {
        color: #FFB800;
        font-size: vars.$font-size-base;
      }
      
      .rating-text {
        color: vars.$color-gray-600;
        font-size: vars.$font-size-sm;
      }
    }

    .product-price {
      font-size: vars.$font-size-xl;
      font-weight: 500;
    }

    .product-description {
      margin-top: vars.$spacing-sm;
      
      p {
        line-height: 1.6;
        color: vars.$color-gray-800;
      }
    }
    
    .product-quantity {
      display: flex;
      align-items: center;
      gap: vars.$spacing-md;
      
      label {
        font-weight: 500;
        color: vars.$color-gray-800;
      }
      
      .quantity-controls {
        display: flex;
        align-items: center;
        
        .quantity-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: vars.$color-white;
          border: 1px solid vars.$color-gray-300;
          cursor: pointer;
          
          &:hover:not(:disabled) {
            background: vars.$color-gray-100;
          }
          
          &:disabled {
            cursor: not-allowed;
            color: vars.$color-gray-400;
          }
        }
        
        .quantity-input {
          width: 48px;
          height: 32px;
          border: 1px solid vars.$color-gray-300;
          text-align: center;
          font-size: vars.$font-size-base;
          
          &:focus {
            outline: none;
            border-color: vars.$color-gray-600;
          }
          
          /* Hide spinner */
          &::-webkit-outer-spin-button,
          &::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          &[type=number] {
            -moz-appearance: textfield;
          }
        }
      }
    }
    
    .product-actions {
      display: flex;
      gap: vars.$spacing-sm;
      margin-top: vars.$spacing-sm;
      
      .add-to-cart-btn {
        flex: 1;
        padding: vars.$spacing-sm vars.$spacing-lg;
        background: vars.$color-black;
        color: vars.$color-white;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
        
        &:hover {
          background: vars.$color-gray-800;
        }
      }
    }
    
    .product-meta {
      margin-top: vars.$spacing-sm;
      font-size: vars.$font-size-sm;
      color: vars.$color-gray-600;
    }
    
    .added-notification {
      display: flex;
      align-items: center;
      gap: vars.$spacing-sm;
      padding: vars.$spacing-sm vars.$spacing-md;
      background: #E8F5E9;
      color: #2E7D32;
      border-radius: 4px;
      
      i {
        font-size: vars.$font-size-lg;
      }
      
      .view-cart-link {
        margin-left: auto;
        background: none;
        border: none;
        color: vars.$color-black;
        font-weight: 500;
        cursor: pointer;
        text-decoration: underline;
      }
    }
    
    .product-tabs {
      margin-top: vars.$spacing-xl;
      border: 1px solid vars.$color-gray-200;
      border-radius: 4px;
      overflow: hidden;
      
      .tab-buttons {
        display: flex;
        border-bottom: 1px solid vars.$color-gray-200;
        background: vars.$color-gray-100;
        
        .tab-button {
          padding: vars.$spacing-md vars.$spacing-lg;
          background: none;
          border: none;
          font-size: vars.$font-size-base;
          font-weight: 500;
          color: vars.$color-gray-600;
          cursor: pointer;
          
          &.active {
            color: vars.$color-gray-900;
            border-bottom: 2px solid vars.$primary-color;
          }
          
          &:hover:not(.active) {
            color: vars.$color-gray-800;
          }
        }
      }
      
      .tab-content {
        padding: vars.$spacing-lg;
        background: vars.$color-white;
        
        h3 {
          margin-top: 0;
          margin-bottom: vars.$spacing-md;
          font-size: vars.$font-size-lg;
          font-weight: 500;
        }
        
        p {
          line-height: 1.6;
          color: vars.$color-gray-700;
          margin-bottom: vars.$spacing-md;
          
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
    
    .reviews-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: vars.$spacing-lg;
      
      @media (max-width: vars.$breakpoint-sm) {
        flex-direction: column;
        align-items: flex-start;
        gap: vars.$spacing-md;
      }
      
      h3 {
        margin: 0;
      }
    }
    
    .rating-summary {
      display: flex;
      flex-direction: column;
      
      .average-rating {
        display: flex;
        align-items: center;
        gap: vars.$spacing-sm;
        
        .rating-number {
          font-size: vars.$font-size-xl;
          font-weight: 600;
        }
        
        .review-count {
          font-size: vars.$font-size-sm;
          color: vars.$color-gray-600;
        }
      }
    }
    
    .review-item {
      border-bottom: 1px solid vars.$color-gray-200;
      padding: vars.$spacing-md 0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .review-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: vars.$spacing-sm;
        
        .review-date {
          font-size: vars.$font-size-sm;
          color: vars.$color-gray-600;
        }
      }
      
      .review-content {
        p {
          margin: 0;
        }
      }
    }
    
    .no-reviews {
      text-align: center;
      padding: vars.$spacing-xl 0;
      color: vars.$color-gray-600;
    }
    
    .add-review-section {
      margin-top: vars.$spacing-xl;
      padding-top: vars.$spacing-lg;
      border-top: 1px solid vars.$color-gray-200;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: vars.$spacing-xl * 2;
      
      .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: vars.$primary-color;
        animation: spin 1s infinite linear;
        margin-bottom: vars.$spacing-md;
      }
      
      p {
        font-size: vars.$font-size-lg;
        color: vars.$color-gray-600;
      }
    }
    
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: vars.$spacing-xl * 2;
      text-align: center;
      
      .error-icon {
        font-size: 48px;
        color: #d33;
        margin-bottom: vars.$spacing-md;
      }
      
      h2 {
        margin-bottom: vars.$spacing-md;
      }
      
      p {
        margin-bottom: vars.$spacing-lg;
        color: vars.$color-gray-600;
      }
      
      .back-button {
        padding: vars.$spacing-sm vars.$spacing-lg;
        background: vars.$color-black;
        color: vars.$color-white;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        
        &:hover {
          background: vars.$color-gray-800;
        }
      }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  productId!: number;
  product: ProductDetail | null = null;
  activeTab = 'description';
  quantity = 1;
  showAddedNotification = false;
  
  loading = true;
  error = '';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    const routeSub = this.route.params.subscribe(params => {
      this.productId = +params['id'];
      if (isNaN(this.productId) || this.productId <= 0) {
        this.error = 'Invalid product ID.';
        this.loading = false;
        return;
      }
      
      this.loadProductDetails();
    });
    
    this.subscriptions.push(routeSub);
  }

  loadProductDetails(): void {
    this.loading = true;
    this.error = '';
    
    const productSub = this.productService.getProductDetails(this.productId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (product) => {
          this.product = product;
        },
        error: (error) => {
          console.error('Error loading product details:', error);
          this.error = 'This product could not be found or is no longer available.';
        }
      });
      
    this.subscriptions.push(productSub);
  }

  onReviewAdded(): void {
    // Reload product details to get updated rating
    this.loadProductDetails();
  }

  increaseQuantity(): void {
    if (this.quantity < 99) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity).subscribe({
        next: () => {
          // Show notification
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
          // Could implement error notification here
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
