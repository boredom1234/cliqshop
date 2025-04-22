import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-add-review',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="add-review-container">
      <h3 class="add-review-title">Write a Review</h3>
      
      <div *ngIf="!isLoggedIn()" class="login-prompt">
        <p>Please log in to write a review.</p>
        <a [routerLink]="['/login']" [queryParams]="{returnUrl: getCurrentUrl()}" class="login-button">
          Log In to Write a Review
        </a>
      </div>
      
      <form *ngIf="isLoggedIn()" [formGroup]="reviewForm" (ngSubmit)="onSubmit()" class="review-form">
        <div class="form-group">
          <label for="rating">Rating</label>
          <div class="star-rating">
            <ng-container *ngFor="let star of [1, 2, 3, 4, 5]">
              <button 
                type="button"
                class="star-button" 
                [class.selected]="star <= selectedRating"
                [class.hovered]="star <= hoveredRating && hoveredRating > 0"
                (mouseenter)="hoverRating(star)"
                (mouseleave)="hoverRating(0)"
                (click)="selectRating(star)"
              >
                ★
              </button>
            </ng-container>
          </div>
          <div class="rating-text" *ngIf="selectedRating > 0">
            Selected rating: {{ selectedRating }} {{ selectedRating === 1 ? 'star' : 'stars' }}
          </div>
          <div *ngIf="submitted && f['rating'].errors" class="invalid-feedback">
            <div *ngIf="f['rating'].errors['required']">Please select a rating</div>
            <div *ngIf="f['rating'].errors['min']">Rating must be at least 1 star</div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="comment">Your Review</label>
          <textarea 
            id="comment" 
            formControlName="comment" 
            rows="4" 
            placeholder="Share your thoughts about this product..."
            class="form-control"
            [ngClass]="{'is-invalid': submitted && f['comment'].errors}"
          ></textarea>
          <div *ngIf="submitted && f['comment'].errors" class="invalid-feedback">
            <div *ngIf="f['comment'].errors['required']">Please write your review</div>
            <div *ngIf="f['comment'].errors['minlength']">Review must be at least 5 characters</div>
          </div>
        </div>
        
        <div *ngIf="errorMessage" class="error-message">
          <i class="fa fa-exclamation-circle"></i>
          {{ errorMessage }}
          <a *ngIf="errorMessage.includes('session has expired')" 
             [routerLink]="['/login']" 
             [queryParams]="{returnUrl: getCurrentUrl()}" 
             class="relogin-link">
            Log in again
          </a>
        </div>
        
        <div *ngIf="successMessage" class="success-message">
          <i class="fa fa-check-circle"></i>
          {{ successMessage }}
        </div>
        
        <button type="submit" class="submit-button" [disabled]="loading">
          <i *ngIf="loading" class="fa fa-spinner fa-spin"></i>
          {{ loading ? 'Submitting...' : 'Submit Review' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .add-review-container {
      margin-top: 2rem;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      background: #ffffff;
    }

    .login-prompt {
      text-align: center;
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 0.375rem;
      
      p {
        margin: 0 0 1rem;
        color: #4b5563;
      }
    }

    .login-button, .relogin-link {
      display: inline-block;
      padding: 0.5rem 1rem;
      background-color: #111827;
      color: #ffffff;
      text-decoration: none;
      border-radius: 0.375rem;
      font-weight: 500;
      transition: background-color 0.2s;
      
      &:hover {
        background-color: #374151;
      }
    }

    .relogin-link {
      margin-left: 0.5rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }

    .add-review-title {
      font-size: 1.25rem;
      margin: 0 0 1rem;
      font-weight: 500;
      color: #111827;
    }

    .review-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 0.5rem;
      
      label {
        display: block;
        margin-bottom: 0.25rem;
        color: #111827;
        font-weight: 500;
      }
    }

    .star-rating {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 0.25rem;
    }

    .star-button {
      cursor: pointer;
      font-size: 24px;
      background: none;
      border: none;
      padding: 0.25rem 0.5rem;
      color: #d1d5db;
      transition: all 0.2s ease;
      
      &.hovered {
        color: #9ca3af;
      }

      &.selected {
        color: #111827;
      }

      &:hover {
        transform: scale(1.1);
      }

      &:focus {
        outline: none;
        color: #111827;
      }
    }

    .rating-text {
      margin-top: 0.25rem;
      color: #4b5563;
      font-size: 0.875rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-family: inherit;
      font-size: 1rem;
      resize: vertical;
      min-height: 100px;
      transition: all 0.2s ease;
      
      &:focus {
        outline: none;
        border-color: #111827;
        box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.1);
      }
      
      &.is-invalid {
        border-color: #dc2626;
        
        &:focus {
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
        }
      }

      &::placeholder {
        color: #9ca3af;
      }
    }

    .invalid-feedback {
      display: block;
      color: #dc2626;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .error-message, .success-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      
      i {
        font-size: 1rem;
      }
    }

    .error-message {
      background-color: #fef2f2;
      border: 1px solid #fee2e2;
      color: #dc2626;
    }

    .success-message {
      background-color: #f0fdf4;
      border: 1px solid #dcfce7;
      color: #16a34a;
    }

    .submit-button {
      padding: 0.75rem 1rem;
      background-color: #111827;
      color: #ffffff;
      border: none;
      border-radius: 0.375rem;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      
      &:hover:not(:disabled) {
        background-color: #374151;
      }
      
      &:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
      }

      i {
        font-size: 1rem;
      }
    }
  `]
})
export class AddReviewComponent implements OnDestroy {
  @Input() productId!: number;
  @Output() reviewAdded = new EventEmitter<void>();
  
  reviewForm: FormGroup;
  selectedRating = 0;
  hoveredRating = 0;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private productService: ProductService,
    private router: Router
  ) {
    this.reviewForm = this.formBuilder.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('auth_token');
    const currentUser = localStorage.getItem('current_user');
    return !!(token && currentUser);
  }

  getCurrentUrl(): string {
    return window.location.pathname;
  }

  // convenience getter for easy access to form fields
  get f() { 
    return this.reviewForm.controls; 
  }

  hoverRating(rating: number): void {
    this.hoveredRating = rating;
  }

  selectRating(rating: number): void {
    this.selectedRating = rating;
    this.reviewForm.patchValue({ rating });
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    // stop here if form is invalid
    if (this.reviewForm.invalid) {
      return;
    }

    this.loading = true;
    const { rating, comment } = this.reviewForm.value;

    const submitSub = this.productService.addProductReview(this.productId, rating, comment)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.successMessage = 'Thank you! Your review has been submitted successfully.';
          this.reviewForm.reset();
          this.selectedRating = 0;
          this.submitted = false;
          this.reviewAdded.emit();
          
          // Clear success message after a delay
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error submitting review:', error);
          if (error.status === 401) {
            this.errorMessage = 'Please log in to submit a review. ';
            // Add a login link that navigates to the login page with a return URL
            const returnUrl = window.location.pathname;
            const loginLink = document.createElement('a');
            loginLink.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
            loginLink.textContent = 'Click here to log in';
            loginLink.style.color = '#2B6CB0';
            loginLink.style.textDecoration = 'underline';
            loginLink.style.marginLeft = '4px';
            
            // Clear any existing error message element
            const existingError = document.querySelector('.error-message');
            if (existingError) {
              existingError.innerHTML = this.errorMessage;
              existingError.appendChild(loginLink);
            }
          } else {
            this.errorMessage = error.error?.message || 'Failed to submit review. Please try again.';
          }
        }
      });
      
    this.subscriptions.push(submitSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
