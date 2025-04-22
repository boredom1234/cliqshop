import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductReview, ProductService } from '../services/product.service';
import { Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

interface ApiResponse {
  success: boolean;
  message: string;
  data: ProductReview[];
}

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reviews-container">
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading reviews...</p>
      </div>
      
      <div *ngIf="error" class="error-message">
        <i class="fa fa-exclamation-circle"></i>
        <p>{{ error }}</p>
        <button (click)="loadReviews()" class="retry-button">Try Again</button>
      </div>
      
      <ng-container *ngIf="!loading && !error">
        <div class="reviews-header">
          <h3 class="reviews-title">
            Customer Reviews
            <span class="review-count" *ngIf="reviews">({{ reviews.length }})</span>
          </h3>
          
          <div class="reviews-summary" *ngIf="reviews && reviews.length > 0">
            <div class="average-rating">
              <span class="rating-value">{{ calculateAverageRating() | number:'1.1-1' }}</span>
              <div class="rating-stars">
                <ng-container *ngFor="let star of [1, 2, 3, 4, 5]">
                  <i class="fa" [ngClass]="{
                    'fa-star': star <= calculateAverageRating(),
                    'fa-star-half-o': star - 0.5 <= calculateAverageRating() && star > calculateAverageRating(),
                    'fa-star-o': star > calculateAverageRating() && star - 0.5 > calculateAverageRating()
                  }"></i>
                </ng-container>
              </div>
              <p>Based on {{ reviews.length }} reviews</p>
            </div>
          </div>
        </div>
        
        <div class="review-list" *ngIf="reviews && reviews.length > 0">
          <div class="review-item" *ngFor="let review of reviews">
            <div class="review-header">
              <div class="review-rating">
                <ng-container *ngFor="let star of [1, 2, 3, 4, 5]">
                  <i class="fa" [ngClass]="star <= review.rating ? 'fa-star' : 'fa-star-o'"></i>
                </ng-container>
              </div>
              <span class="review-date">{{ formatDate(review.createdAt) }}</span>
            </div>
            <p class="review-comment">{{ review.comment }}</p>
          </div>
        </div>
        
        <div class="no-reviews" *ngIf="!loading && (!reviews || reviews.length === 0)">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as vars;

    .reviews-container {
      margin-bottom: vars.$spacing-xl;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: vars.$spacing-xl;
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: vars.$primary-color;
        animation: spin 1s linear infinite;
        margin-bottom: vars.$spacing-md;
      }
      
      p {
        color: vars.$color-gray-600;
      }
    }
    
    .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: vars.$spacing-lg;
      background-color: #FFF5F5;
      border: 1px solid #FED7D7;
      border-radius: 4px;
      color: #E53E3E;
      text-align: center;
      
      i {
        font-size: vars.$font-size-xl;
        margin-bottom: vars.$spacing-sm;
      }
      
      p {
        margin-bottom: vars.$spacing-md;
      }
      
      .retry-button {
        padding: vars.$spacing-xs vars.$spacing-md;
        background-color: vars.$primary-color;
        color: vars.$color-white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: vars.$font-size-sm;
        
        &:hover {
          background-color: darken(vars.$primary-color, 10%);
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
    }

    .reviews-title {
      font-size: vars.$font-size-xl;
      margin: 0;
      font-weight: 500;
      
      .review-count {
        color: vars.$color-gray-600;
        font-weight: normal;
      }
    }

    .reviews-summary {
      display: flex;
      align-items: center;
    }

    .average-rating {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .rating-value {
        font-size: vars.$font-size-2xl;
        font-weight: 500;
      }
      
      .rating-stars {
        color: #FFB800;
        font-size: vars.$font-size-lg;
        margin: vars.$spacing-xs 0;
      }
      
      p {
        font-size: vars.$font-size-sm;
        color: vars.$color-gray-600;
        margin: 0;
      }
    }

    .review-list {
      display: flex;
      flex-direction: column;
      gap: vars.$spacing-lg;
    }

    .review-item {
      padding: vars.$spacing-md;
      border: 1px solid vars.$color-gray-200;
      border-radius: 4px;
      background: vars.$color-white;
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: vars.$spacing-sm;
      
      .review-rating {
        color: #FFB800;
      }
      
      .review-date {
        font-size: vars.$font-size-xs;
        color: vars.$color-gray-600;
      }
    }

    .review-comment {
      margin: 0;
      line-height: 1.6;
    }

    .no-reviews {
      padding: vars.$spacing-lg;
      background: vars.$color-gray-100;
      text-align: center;
      border-radius: 4px;
      
      p {
        color: vars.$color-gray-600;
        margin: 0;
      }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ReviewListComponent implements OnInit, OnDestroy {
  @Input() productId!: number;
  
  reviews: ProductReview[] = [];
  loading = true;
  error = '';
  
  private subscriptions: Subscription[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadReviews();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadReviews(): void {
    this.loading = true;
    this.error = '';
    
    const reviewsSub = this.productService.getProductReviews(this.productId)
      .pipe(
        map((response: ApiResponse) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to load reviews');
          }
          return response.data;
        }),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (reviews) => {
          this.reviews = reviews;
        },
        error: (error) => {
          console.error('Error loading reviews:', error);
          this.error = 'Unable to load reviews. Please try again.';
        }
      });
      
    this.subscriptions.push(reviewsSub);
  }

  calculateAverageRating(): number {
    if (!this.reviews || this.reviews.length === 0) {
      return 0;
    }
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / this.reviews.length;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  }
}
