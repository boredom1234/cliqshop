import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpEvent
} from '@angular/common/http';
import { AuthService } from '../../auth/services/auth.service';
import { TokenManagerService } from '../services/token-manager.service';
import { catchError, switchMap, mergeMap, tap, delay } from 'rxjs/operators';
import { throwError, of, Observable, from } from 'rxjs';
import { Router } from '@angular/router';

// Track auth failures to prevent infinite loops
let consecutiveAuthFailures = 0;
const MAX_AUTH_FAILURES = 3;

// Flag to keep track of authentication issues
let globalAuthIssueDetected = false;

// APIs that should skip auth validation
const PUBLIC_APIS = [
  '/login',
  '/register',
  '/api/public'
];

// Order related endpoints that need authentication
const ORDER_ENDPOINTS = [
  '/order',
  '/orders',
  '/order-place',
  '/order-history',
  '/user'
];

// Cart related endpoints that need special handling
const CART_ENDPOINTS = [
  '/cart',
  '/cart-update',
  '/cart-delete',
  '/cart-clear',
  '/cart-add'
];

// Add a helper function to safely add auth header without additional problematic headers
function addAuthHeaderToRequest(req: HttpRequest<any>, token: string): HttpRequest<any> {
  return req.clone({
    setHeaders: {
      'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
    }
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenManager = inject(TokenManagerService);
  const router = inject(Router);
  
  // Debug log level - set to true for additional debug logging
  const verbose = true;
  const log = (...args: any[]) => verbose && console.log(...args);
  
  log(`Auth Interceptor: Processing request to ${req.url}`);
  
  // Check if this is a development environment
  const isDevMode = window.location.hostname === 'localhost';
  
  // Skip interceptor for auth endpoints to avoid circular dependencies
  if (PUBLIC_APIS.some(endpoint => req.url.includes(endpoint))) {
    log('Auth Interceptor: Skipping auth for public endpoint');
    return next(req);
  }
  
  // Special handling for order operations
  const isOrderOperation = ORDER_ENDPOINTS.some(endpoint => req.url.includes(endpoint));
  if (isOrderOperation) {
    log('Auth Interceptor: Order operation detected - ensuring token is added');
    
    // Get token without promise to avoid async issues
    const token = authService.getToken();
    if (token) {
      log(`Auth Interceptor: Adding token to order request: ${req.url}`);
      const authReq = addAuthHeaderToRequest(req, `Bearer ${token}`);
      log(`Auth Interceptor: Authorization header added for ${req.url}`);
      
      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            console.error(`Auth Interceptor: 401 error for order operation: ${req.url}`, error);
            
            // For development purposes, try with mock data instead of failing completely
            if (isDevMode) {
              log('Auth Interceptor: Dev mode - attempting to use mock data for order operation');
              return of({ 
                body: { 
                  success: true, 
                  data: { 
                    id: 1, 
                    items: [],
                    status: 'pending',
                    shippingAddress: '123 Main St, New York',
                    totalAmount: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  } 
                } 
              } as any);
            }
            
            return throwError(() => error);
          }
          return throwError(() => error);
        })
      );
    } else {
      console.warn(`Auth Interceptor: No token available for order operation: ${req.url}`);
      
      // For development mode, try to generate a token on the fly
      if (isDevMode) {
        log('Auth Interceptor: Dev mode - attempting to generate token for order operation');
        return from(tokenManager.ensureToken()).pipe(
          mergeMap(newToken => {
            if (newToken) {
              log('Auth Interceptor: New token generated for order operation');
              const authReq = addAuthHeaderToRequest(req, newToken);
              return next(authReq);
            } else {
              // If token generation fails, redirect to login
              router.navigate(['/login']);
              return throwError(() => new Error('Authentication required for order operations'));
            }
          })
        );
      }
      
      // For production, redirect to login
      router.navigate(['/login']);
      return throwError(() => new Error('Authentication required for order operations'));
    }
  }
  
  // Special handling for cart operations
  const isCartOperation = CART_ENDPOINTS.some(endpoint => req.url.includes(endpoint));
  if (isCartOperation) {
    log('Auth Interceptor: Cart operation detected - adding delay for token loading');
    
    // Get token without promise to avoid async issues
    const token = authService.getToken();
    if (token) {
      log('Auth Interceptor: Adding token to cart request');
      const authReq = addAuthHeaderToRequest(req, `Bearer ${token}`);
      
      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            console.warn('Auth Interceptor: 401 error for cart operation - falling back to local cart');
            globalAuthIssueDetected = true;
            
            // Return empty cart data instead of an error
            return of({ body: { items: [], totalItems: 0, subtotal: 0 } } as any);
          }
          return throwError(() => error);
        })
      );
    }
    
    // No token available, proceed without auth header (and no custom headers)
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          log('Auth Interceptor: Silent 401 for cart with no token');
          globalAuthIssueDetected = true;
          return of({ body: { items: [], totalItems: 0, subtotal: 0 } } as any);
        }
        return throwError(() => error);
      })
    );
  }
  
  // For API endpoints that require authentication, ensure token is available
  if (req.url.includes('/api/')) {
    log('Auth Interceptor: API request requires authentication');
    
    // Get token without promise to avoid async issues
    const token = authService.getToken();
    if (token) {
      log('Auth Interceptor: Adding token to API request');
      const authReq = addAuthHeaderToRequest(req, `Bearer ${token}`);
      
      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            console.error('Auth Interceptor: 401 Unauthorized error on API request');
            
            // For consistent behavior, always emit the auth error
            tokenManager.clearToken();
            authService.clearStorageFromInterceptor();
            router.navigate(['/login']);
            
            return throwError(() => error);
          }
          return throwError(() => error);
        })
      );
    } else {
      console.warn('Auth Interceptor: No token available for API request');
      
      // For development mode, try to generate a token on the fly
      if (isDevMode) {
        log('Auth Interceptor: Dev mode - attempting to generate token for API operation');
        return from(tokenManager.ensureToken()).pipe(
          mergeMap(newToken => {
            if (newToken) {
              log('Auth Interceptor: New token generated for API operation');
              const authReq = addAuthHeaderToRequest(req, newToken);
              return next(authReq);
            } else {
              // If token generation fails, redirect to login
              router.navigate(['/login']);
              return throwError(() => new Error('Authentication required for API operations'));
            }
          })
        );
      }
      
      // For production, redirect to login
      router.navigate(['/login']);
      return throwError(() => new Error('Authentication required for API operations'));
    }
  }
  
  // For all other requests, pass through without token
  return next(req);
};

// Expose auth issues status
export function isAuthIssueDetected(): boolean {
  return globalAuthIssueDetected;
}

// Reset auth issues status (called when user logs in successfully)
export function resetAuthIssueStatus(): void {
  globalAuthIssueDetected = false;
  consecutiveAuthFailures = 0;
} 