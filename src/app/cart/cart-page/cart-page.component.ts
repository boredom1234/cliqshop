import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, Cart } from '../services/cart.service';
import { CartItemComponent } from '../cart-item/cart-item.component';
import { CartSummaryComponent } from '../cart-summary/cart-summary.component';
import { Observable, of, catchError, map, BehaviorSubject, finalize, Subscription, timer, from, tap, switchMap } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { TokenManagerService } from '../../core/services/token-manager.service';
import { HttpErrorResponse } from '@angular/common/http';
import { isAuthIssueDetected, resetAuthIssueStatus } from '../../core/interceptors/auth.interceptor';
import { isPlatformBrowser } from '@angular/common';
import { ApiConfigService } from '../../core/services/api-config.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CartItemComponent,
    CartSummaryComponent
  ],
  template: `
    <div class="cart-container">
      <!-- Loading indicator with improved UI -->
      <div *ngIf="isLoading" class="loading-indicator">
        <div class="spinner"></div>
        <h3>Loading your cart...</h3>
        <p *ngIf="loadingMessage" class="loading-message">{{ loadingMessage }}</p>
        <div *ngIf="retryAttempts > 0" class="retry-info">
          <p>Reconnecting to server... (Attempt {{ retryAttempts }}/{{ MAX_RETRY_ATTEMPTS }})</p>
          <small>We're using your locally saved cart while connecting to the server.</small>
        </div>
      </div>

      <!-- Authentication Issue Alert for all users -->
      <div *ngIf="authIssueDetected && !isLoading" class="auth-issue-alert">
        <p><strong>Authentication Required:</strong> You need to be logged in to manage your cart.</p>
        <p>We're showing your locally saved cart items. To save changes, please log in.</p>
        <button routerLink="/auth/login" class="login-btn">Go to Login</button>
      </div>

      <!-- Cart content (only shown when not loading) -->
      <ng-container *ngIf="!isLoading && (cart$ | async) as cart">
        <div class="cart-header">
          <h1>Your Shopping Cart</h1>
          <p *ngIf="cart.totalItems > 0">
            You have {{ cart.totalItems }} item(s) in your cart
          </p>
        </div>

        <!-- If cart has items, display them -->
        <ng-container *ngIf="cart.items && cart.items.length > 0; else emptyCart">
          <div class="cart-items-container">
            <div class="cart-items">
              <app-cart-item
                *ngFor="let item of cart.items"
                [item]="item"
                (quantityChanged)="updateQuantity($event)"
                (itemRemoved)="removeItem($event)"
              ></app-cart-item>
            </div>

            <div class="cart-actions">
              <button class="clear-cart-btn" (click)="clearCart()">
                Clear Cart
              </button>
              <button class="continue-shopping-btn" routerLink="/products">
                Continue Shopping
              </button>
            </div>

            <div class="cart-summary-container">
              <app-cart-summary
                [cart]="cart"
                (checkout)="goToCheckout()"
              ></app-cart-summary>
            </div>
          </div>
        </ng-container>

        <!-- Empty cart template -->
        <ng-template #emptyCart>
          <div class="empty-cart">
            <div class="empty-cart-icon">
              <i class="fa fa-shopping-cart"></i>
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <button class="continue-shopping-btn" routerLink="/products">
              Start Shopping
            </button>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as vars;
    
    .cart-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: vars.$spacing-xl 0;
      min-height: 400px;
      position: relative;
    }
    
    .loading-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      text-align: center;
    }
    
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid vars.$color-gray-300;
      border-radius: 50%;
      border-top-color: vars.$color-black;
      animation: spin 1s linear infinite;
      margin-bottom: vars.$spacing-md;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .loading-message {
      margin-top: vars.$spacing-sm;
      color: vars.$color-gray-600;
    }
    
    .retry-info {
      margin-top: vars.$spacing-md;
      padding: vars.$spacing-md;
      background-color: vars.$color-gray-100;
      border-radius: 8px;
      max-width: 400px;
      border-left: 4px solid vars.$primary-color;
    }
    
    .retry-info p {
      margin-bottom: vars.$spacing-xs;
      font-weight: 500;
    }
    
    .retry-info small {
      color: vars.$color-gray-600;
    }
    
    .auth-issue-alert {
      margin: vars.$spacing-lg 0;
      padding: vars.$spacing-md;
      background-color: rgba(vars.$danger-color, 0.1);
      border-left: 4px solid vars.$danger-color;
      border-radius: 4px;
    }
    
    .cart-header {
      display: block;
      margin-bottom: vars.$spacing-xl;
      padding-bottom: vars.$spacing-md;
      border-bottom: 1px solid vars.$color-gray-200;
      
      h1 {
        margin-bottom: vars.$spacing-sm;
        font-size: vars.$font-size-xl;
        font-weight: 600;
      }
      
      p {
        margin: 0;
        color: vars.$color-gray-600;
      }
    }
    
    .auth-issue-alert {
      background-color: #fff4e5;
      border: 1px solid #ffa940;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      p {
        margin: 0;
        color: #873800;
      }
      
      .login-btn {
        background-color: vars.$color-black;
        color: vars.$color-white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        transition: all 0.2s ease;
        height: 40px;
        line-height: 1;
        
        &:hover {
          background-color: vars.$color-gray-800;
        }
      }
    }
    
    .cart-title {
      font-size: vars.$font-size-xl;
      font-weight: 600;
      margin: 0;
      margin-right: vars.$spacing-md;
    }
    
    .cart-count {
      font-size: vars.$font-size-sm;
      color: vars.$color-gray-600;
    }

    .cart-items-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: vars.$spacing-lg;
      
      @media (min-width: vars.$breakpoint-md) {
        grid-template-columns: 2fr 1fr;
        grid-template-areas:
          "items summary"
          "actions summary";
      }
    }
    
    .cart-items {
      grid-area: items;
    }
    
    .cart-actions {
      grid-area: actions;
      display: flex;
      gap: vars.$spacing-md;
      margin-top: vars.$spacing-lg;
      
      @media (max-width: vars.$breakpoint-sm) {
        flex-direction: column;
      }
      
      button {
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        height: 40px;
        line-height: 1;
        
        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      }
    }
    
    .clear-cart-btn {
      background-color: transparent;
      border: 1px solid vars.$color-black;
      color: vars.$color-black;
      transition: all 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
      
      &:hover {
        background-color: vars.$color-black;
        color: vars.$color-white;
      }
    }
    
    .continue-shopping-btn {
      background-color: vars.$color-black;
      color: vars.$color-white;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: vars.$color-gray-800;
      }
    }
    
    .cart-summary-container {
      grid-area: summary;
    }
    
    .empty-cart {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: vars.$spacing-xl 0;
      
      .empty-cart-icon {
        font-size: 48px;
        color: vars.$color-gray-400;
        margin-bottom: vars.$spacing-md;
      }
      
      h2 {
        margin-top: 0;
        margin-bottom: vars.$spacing-sm;
        color: vars.$color-gray-800;
      }
      
      p {
        margin-bottom: vars.$spacing-lg;
        color: vars.$color-gray-600;
      }
      
      .continue-shopping-btn {
        background-color: vars.$color-black;
        color: vars.$color-white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        transition: all 0.2s ease;
        height: 40px;
        line-height: 1;
        font-size: 14px;
        
        &:hover {
          background-color: vars.$color-gray-800;
        }
      }
    }
  `]
})
export class CartPageComponent implements OnInit, OnDestroy {
  // Component properties
  cart: Cart = { items: [], totalItems: 0, subtotal: 0 };
  isLoading = false;
  loadingMessage = '';
  authIssueDetected = false;
  
  retryAttempts = 0;
  readonly MAX_RETRY_ATTEMPTS = 3;
  private subscriptions = new Subscription();
  private emptyCart: Cart = { items: [], totalItems: 0, subtotal: 0 };
  
  // Use the cart$ observable with error handling
  cart$!: Observable<Cart>;

  constructor(
    private cartService: CartService,
    private router: Router,
    private tokenManager: TokenManagerService,
    public apiConfigService: ApiConfigService,
    @Inject(PLATFORM_ID) private platformId: Object,
    public authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log('CartPageComponent: Initializing...');
    
    // Initialize without waiting for token
    this.initializeWithoutTokenCheck();
    
    // Subscribe to cart updates from the service
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
    });
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();
  }
  
  // Initialize without blocking on token
  private initializeWithoutTokenCheck(): void {
    console.log('CartPageComponent: Initializing without token check');
    
    // Set up cart observable with improved retry logic
    this.setupCartObservable();
  }
  
  // Set up the main cart observable
  private setupCartObservable(): void {
    this.isLoading = true;
    this.loadingMessage = 'Preparing your cart...';
    
    // First check if auth issue is detected
    this.authIssueDetected = isAuthIssueDetected();
    
    // Create a subject that will emit the latest cart value
    const cartSubject = new BehaviorSubject<Cart>(this.emptyCart);
    
    // Always start by showing local cart
    const localCart = this.cartService.currentCart;
    if (localCart && localCart.items.length > 0) {
      cartSubject.next(localCart);
      if (this.isLoading) {
        this.loadingMessage = 'Refreshing cart data...';
      }
    }
    
    // Set up cart observable with finalize
    this.cart$ = cartSubject.asObservable().pipe(
      finalize(() => {
        // Ensure loading is cleared after some time to avoid flickering
        setTimeout(() => {
          this.isLoading = false;
        }, 300);
      })
    );
    
    // Function to load cart with retry
    const loadCartWithRetry = (attempt = 0): void => {
      const maxAttempts = this.MAX_RETRY_ATTEMPTS;
      const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff capped at 5 seconds
      
      // Update UI state
      if (attempt > 0) {
        this.retryAttempts = attempt;
        this.loadingMessage = `Retrying... (${attempt}/${maxAttempts})`;
      }
      
      // Check if we already have a local cart, use it immediately while we fetch from API
      const localCart = this.cartService.currentCart;
      if (localCart && localCart.items.length > 0) {
        // Use saved cart immediately while we fetch
        cartSubject.next(localCart);
      }
      
      // Create a custom HTTP request to avoid console errors
      const customFetchCart = () => {
        // Use a timer to space out retry attempts
        const delayMs = attempt > 0 ? backoffDelay : 200;
        
        return timer(delayMs).pipe(
          switchMap(() => {
            // Make direct API request without showing 401 errors
            return this.cartService.fetchCart().pipe(
              catchError(error => {
                // Process any errors quietly
                if (error.status === 401) {
                  // For auth errors with retries left, try again
                  if (attempt < maxAttempts - 1) {
                    console.log(`Cart auth error, scheduling retry ${attempt + 1}/${maxAttempts} after ${backoffDelay}ms`);
                    setTimeout(() => loadCartWithRetry(attempt + 1), backoffDelay);
                    this.authIssueDetected = true;
                  } else {
                    console.log('Max auth retries reached, using local cart');
                    this.authIssueDetected = true;
                    this.isLoading = false;
                  }
                } else {
                  console.log('Non-auth error fetching cart, using local cart');
                  this.isLoading = false;
                }
                
                // Always return local cart on error
                return of(localCart && localCart.items.length > 0 ? localCart : this.emptyCart);
              })
            );
          })
        );
      };
      
      // Subscribe to the custom fetch observable
      const subscription = customFetchCart().subscribe({
        next: (cart) => {
          // Successfully loaded cart (or got valid fallback)
          cartSubject.next(cart);
          
          // Hide loading after a small delay to avoid flickering
          setTimeout(() => {
            this.isLoading = false;
          }, 200);
          
          // Check authentication status
          this.authIssueDetected = isAuthIssueDetected();
          
          // If this was last retry attempt but we have local data, use it
          if (attempt >= maxAttempts - 1 && localCart && localCart.items.length > 0) {
            cartSubject.next(localCart);
          }
        },
        error: (err) => {
          console.log('Unexpected error in cart loading:', err);
          this.isLoading = false;
          
          // Fall back to saved cart
          if (localCart && localCart.items.length > 0) {
            cartSubject.next(localCart);
          } else {
            cartSubject.next(this.emptyCart);
          }
        }
      });
      
      this.subscriptions.add(subscription);
    };
    
    // Start loading process
    loadCartWithRetry();
  }

  updateQuantity(event: {itemId: number, quantity: number}): void {
    if (event && typeof event.itemId === 'number' && typeof event.quantity === 'number') {
      this.isLoading = true;
      this.loadingMessage = 'Checking authentication...';
      
      // First check if token is available
      from(this.tokenManager.ensureToken()).pipe(
        tap(token => {
          this.loadingMessage = token 
            ? 'Updating quantity...' 
            : 'Token unavailable, using local cart...';
        }),
        // After token check, perform the operation
        switchMap(() => {
          return this.cartService.updateQuantity(event.itemId, event.quantity);
        }),
        finalize(() => {
          setTimeout(() => {
            this.isLoading = false;
            this.loadingMessage = '';
            // Force refresh the cart count in header
            this.cartService.refreshCartCount();
          }, 500); // Extended delay to ensure UI updates properly
        })
      ).subscribe({
        next: (cart) => {
          console.log(`Updated quantity for item ${event.itemId} to ${event.quantity}`, cart);
          // Explicitly update the cart$ observable to refresh the UI
          this.setupCartObservable();
        },
        error: (error: Error) => {
          console.error('Error updating quantity:', error);
          // Check for authentication issues
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.authIssueDetected = true;
          }
          // Force refresh cart on error
          this.refreshCartWithRetry();
        }
      });
    } else {
      console.warn('Invalid update quantity event:', event);
    }
  }

  removeItem(itemId: number): void {
    if (itemId !== undefined && itemId !== null) {
      this.isLoading = true;
      this.loadingMessage = 'Checking authentication...';
      
      // First check if token is available
      from(this.tokenManager.ensureToken()).pipe(
        tap(token => {
          this.loadingMessage = token 
            ? 'Removing item...' 
            : 'Token unavailable, using local cart...';
        }),
        // After token check, perform the operation
        switchMap(() => {
          return this.cartService.removeItem(itemId);
        }),
        finalize(() => {
          setTimeout(() => {
            this.isLoading = false;
            this.loadingMessage = '';
            // Force refresh the cart count in header
            this.cartService.refreshCartCount();
          }, 500); // Extended delay to ensure UI updates properly
        })
      ).subscribe({
        next: (cart) => {
          console.log(`Removed item ${itemId} from cart`, cart);
          // Explicitly update the cart$ observable to refresh the UI
          this.setupCartObservable();
        },
        error: (error: Error) => {
          console.error('Error removing item:', error);
          // Check for authentication issues
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.authIssueDetected = true;
          }
          // Force refresh cart on error
          this.refreshCartWithRetry();
        }
      });
    } else {
      console.warn('Invalid item ID for removal:', itemId);
    }
  }

  clearCart(): void {
    console.log('Clearing cart via API');
    this.isLoading = true;
    this.loadingMessage = 'Checking authentication...';
    
    // First check if token is available
    from(this.tokenManager.ensureToken()).pipe(
      tap(token => {
        this.loadingMessage = token 
          ? 'Clearing cart...' 
          : 'Token unavailable, using local cart...';
        
        // Log whether we have a token
        console.log('CartPageComponent: Token available for clear cart operation:', !!token);
      }),
      // After token check, perform the operation
      switchMap(() => {
        return this.cartService.clearCart();
      }),
      finalize(() => {
        setTimeout(() => {
          this.isLoading = false;
          this.loadingMessage = '';
          // Force refresh the cart count in header
          this.cartService.refreshCartCount();
        }, 500); // Extended delay to ensure UI updates properly
      })
    ).subscribe({
      next: (emptyCart) => {
        console.log('Cart cleared successfully:', emptyCart);
        // Explicitly update the cart$ observable to refresh the UI
        this.setupCartObservable();
      },
      error: (error: Error) => {
        console.error('Error clearing cart:', error);
        // Check for authentication issues
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.authIssueDetected = true;
        }
        // Force refresh the cart to be safe
        this.refreshCartWithRetry();
      }
    });
  }

  goToCheckout(): void {
    console.log('Navigating to checkout');
    // The router navigation is handled by the RouterLink on the button in CartSummaryComponent
  }

  // Refresh cart with simplified retry logic
  refreshCartWithRetry(): void {
    console.log('CartPageComponent: Refreshing cart data from server');
    this.setupCartObservable();
  }
} 