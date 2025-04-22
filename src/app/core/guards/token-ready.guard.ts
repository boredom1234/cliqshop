import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of, timer, from } from 'rxjs';
import { map, switchMap, tap, catchError, retry, delay } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class TokenReadyGuard implements CanActivate {
  // Track token check attempts to avoid infinite loops
  private tokenCheckAttempts = 0;
  private readonly MAX_TOKEN_CHECK_ATTEMPTS = 3;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    console.log('TokenReadyGuard: Checking if token is loaded...');
    this.tokenCheckAttempts = 0;
    
    // First check if we're already logged in
    if (this.authService.isLoggedIn) {
      console.log('TokenReadyGuard: User is already logged in, proceeding');
      return of(true);
    }
    
    // Function to check token availability with exponential backoff
    const checkToken = (): Observable<boolean> => {
      this.tokenCheckAttempts++;
      console.log(`TokenReadyGuard: Attempt ${this.tokenCheckAttempts} to check for token`);
      
      // Wait longer with each attempt (exponential backoff: 800ms, 1600ms, 2400ms)
      const waitTime = Math.min(800 * this.tokenCheckAttempts, 2500);
      
      return timer(waitTime).pipe(
        switchMap(() => {
          console.log(`TokenReadyGuard: Checking auth status after waiting ${waitTime}ms`);
          
          // Check if token is now available
          if (this.authService.getToken()) {
            console.log('TokenReadyGuard: Token found after waiting, proceeding');
            return of(true);
          } 
          
          // If we've tried multiple times and still no token, check if there's a cart
          if (this.tokenCheckAttempts >= this.MAX_TOKEN_CHECK_ATTEMPTS) {
            console.log('TokenReadyGuard: Max attempts reached, checking for local cart');
            
            // If the user isn't logged in but they have items in cart, show local cart
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
              try {
                const cart = JSON.parse(savedCart);
                if (cart.items && cart.items.length > 0) {
                  console.log('TokenReadyGuard: User not logged in but has saved cart, proceeding');
                  return of(true);
                }
              } catch (e) {
                console.error('TokenReadyGuard: Error parsing saved cart', e);
              }
            }
            
            console.log('TokenReadyGuard: No token available after multiple attempts and no local cart, redirecting to login');
            this.router.navigate(['/auth/login'], { 
              queryParams: { returnUrl: '/cart' } 
            });
            return of(false);
          }
          
          // Try again if we haven't reached max attempts
          return checkToken();
        }),
        catchError(err => {
          console.error('TokenReadyGuard: Error checking auth status', err);
          
          // If we have errors but there's a cart, allow access
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            try {
              const cart = JSON.parse(savedCart);
              if (cart.items && cart.items.length > 0) {
                return of(true);
              }
            } catch (e) { /* Ignore parse errors */ }
          }
          
          return of(false);
        })
      );
    };
    
    // Start the token check process
    return checkToken();
  }
} 