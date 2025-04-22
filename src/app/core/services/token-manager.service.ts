import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { catchError, filter, first, map, switchMap, tap, timeout } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { TokenFactoryService } from './token-factory.service';

@Injectable({
  providedIn: 'root'
})
export class TokenManagerService {
  // Track token loading state
  private tokenLoaded = new BehaviorSubject<boolean>(false);
  private tokenLoading = false;
  private tokenLoadingPromise: Promise<string | null> | null = null;
  
  // Debounce token refreshes to avoid multiple simultaneous refresh attempts
  private lastRefreshAttempt = 0;
  private readonly REFRESH_DEBOUNCE_MS = 2000;
  
  // Track if we're running in a local development environment
  private isLocalDevelopment = window.location.hostname === 'localhost';
  
  // Flag to track if user has explicitly logged out
  private hasUserLoggedOut = false;
  
  constructor(
    private http: HttpClient,
    private apiConfigService: ApiConfigService,
    private tokenFactory: TokenFactoryService
  ) {
    console.log('TokenManagerService: Initializing');
    
    // First check if user has explicitly logged out
    this.hasUserLoggedOut = localStorage.getItem('user_logged_out') === 'true';
    console.log('TokenManagerService: User logged out flag is:', this.hasUserLoggedOut);
    
    // If user has explicitly logged out, don't load or create any tokens
    if (this.hasUserLoggedOut) {
      console.log('TokenManagerService: User has explicitly logged out, skipping token initialization');
      this.tokenLoaded.next(false);
      return;
    }
    
    // Check if we have a token already and update the loaded state
    const token = this.getTokenSync();
    if (token) {
      console.log('TokenManagerService: Token already exists in storage');
      this.tokenLoaded.next(true);
    } else {
      console.log('TokenManagerService: No token found in storage on init');
    }
    
    // Log environment
    console.log(`TokenManagerService: Running in ${this.isLocalDevelopment ? 'local development' : 'production'} environment`);
  }
  
  /**
   * Get token synchronously - returns null if not available
   */
  getTokenSync(): string | null {
    console.log('TokenManagerService: Getting token synchronously');
    
    // If user has explicitly logged out, return null
    this.checkLogoutStatus();
    if (this.hasUserLoggedOut) {
      console.log('TokenManagerService: User has logged out, not returning token');
      return null;
    }
    
    // Get token from token factory
    const token = this.tokenFactory.getToken();
    
    if (!token) {
      console.log('TokenManagerService: No token found in storage');
      return null;
    }
    
    try {
      // Clean the token (remove Bearer if present)
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      
      // Basic validation
      if (!this.isValidTokenFormat(cleanToken)) {
        console.error('TokenManagerService: Invalid token format found in storage');
        this.clearToken(); // Clear invalid token
        return null;
      }
      
      // Check if token is expired - but if we're in local development
      // and using a mock server, we might want to use expired tokens for testing
      if (this.isTokenExpired(cleanToken) && !this.isLocalDevelopment) {
        console.warn('TokenManagerService: Token expired, clearing and requesting refresh');
        this.clearToken(); // Clear expired token
        return null;
      } else if (this.isTokenExpired(cleanToken) && this.isLocalDevelopment) {
        console.warn('TokenManagerService: Token expired but allowing in local development');
      }
      
      // Always return with Bearer prefix
      return this.tokenFactory.formatToken(cleanToken);
      
    } catch (error) {
      console.error('TokenManagerService: Error processing token', error);
      this.clearToken(); // Clear problematic token
      return null;
    }
  }
  
  /**
   * Check if the user has explicitly logged out and update the internal flag
   */
  private checkLogoutStatus(): void {
    const loggedOut = localStorage.getItem('user_logged_out') === 'true';
    if (loggedOut !== this.hasUserLoggedOut) {
      this.hasUserLoggedOut = loggedOut;
      console.log('TokenManagerService: Updated logged out flag to', this.hasUserLoggedOut);
    }
  }
  
  /**
   * Get token as an observable that waits for token if not available
   */
  getToken(): Observable<string | null> {
    const token = this.getTokenSync();
    
    if (token) {
      return of(token);
    }
    
    // If token not immediately available, wait for it
    return this.waitForToken();
  }
  
  /**
   * Wait for token to become available with timeout
   */
  private waitForToken(timeoutMs: number = 5000): Observable<string | null> {
    console.log('TokenManagerService: Waiting for token to become available');
    return this.tokenLoaded.pipe(
      filter(loaded => loaded),
      first(),
      timeout(timeoutMs),
      switchMap(() => of(this.getTokenSync())),
      catchError(err => {
        console.error('TokenManagerService: Timeout waiting for token', err);
        return of(null);
      })
    );
  }
  
  /**
   * Refresh token from the server
   * In a real app, this would call your refresh token endpoint
   */
  refreshToken(): Observable<string | null> {
    console.log('TokenManagerService: Refreshing token');
    
    // In development mode, generate a development token
    if (this.isLocalDevelopment) {
      console.log('TokenManagerService: Using development token for refresh');
      const devToken = this.generateDevToken();
      if (devToken) {
        this.setToken(devToken);
        return of(this.tokenFactory.formatToken(devToken));
      }
    }
    
    // In a real app, you would call your refresh token endpoint here
    // For now, just return null or a dev token
    return of(null);
  }
  
  /**
   * Ensure a token is available, loading/refreshing if needed
   * Returns a Promise that resolves when token is loaded or fails
   */
  ensureToken(): Promise<string | null> {
    // Check if user has explicitly logged out
    this.checkLogoutStatus();
    if (this.hasUserLoggedOut) {
      console.log('TokenManagerService: User has explicitly logged out, not ensuring token');
      return Promise.resolve(null);
    }
    
    // If we already have a token, return it immediately
    const currentToken = this.getTokenSync();
    if (currentToken) {
      console.log('TokenManagerService: Using existing token from storage');
      return Promise.resolve(currentToken);
    }
    
    // If token loading is already in progress, return the existing promise
    if (this.tokenLoadingPromise) {
      console.log('TokenManagerService: Token loading already in progress, waiting for it');
      return this.tokenLoadingPromise;
    }
    
    // Start token loading process
    this.tokenLoading = true;
    console.log('TokenManagerService: Starting token load/refresh process');
    
    // Create a new promise for the token loading
    this.tokenLoadingPromise = new Promise<string | null>((resolve) => {
      // Check again for logout status before proceeding
      this.checkLogoutStatus();
      if (this.hasUserLoggedOut) {
        console.log('TokenManagerService: User logged out during token loading, aborting');
        this.tokenLoading = false;
        this.tokenLoadingPromise = null;
        resolve(null);
        return;
      }
      
      // If in local development and no token, generate a testing token
      if (this.isLocalDevelopment) {
        console.log('TokenManagerService: Local development environment detected');
        
        // Check for existing raw token (without Bearer)
        const existingRawToken = this.tokenFactory.getToken();
        if (existingRawToken) {
          console.log('TokenManagerService: Using existing raw token in local dev');
          
          // Format token
          const token = this.tokenFactory.formatToken(existingRawToken);
          
          // For cart operations, try to validate token more thoroughly
          try {
            // Clean the token (remove Bearer if present)
            const cleanToken = existingRawToken.startsWith('Bearer ') ? existingRawToken.substring(7) : existingRawToken;
            
            // Validate format (at least make sure it's a proper JWT)
            const parts = cleanToken.split('.');
            if (parts.length === 3) {
              console.log('TokenManagerService: Token appears to be valid JWT format');
              const payload = JSON.parse(atob(parts[1]));
              
              if (payload.exp) {
                const expiryDate = new Date(payload.exp * 1000);
                const isExpired = Date.now() > payload.exp * 1000;
                console.log(`TokenManagerService: Token expiry info - Expires: ${expiryDate.toISOString()}, Expired: ${isExpired}`);
                
                // If token is expired in dev mode, consider regenerating it
                if (isExpired) {
                  console.log('TokenManagerService: Token is expired, but in dev mode so using anyway');
                }
              }
            } else {
              console.warn('TokenManagerService: Token does not appear to be valid JWT format');
            }
          } catch (e) {
            console.error('TokenManagerService: Error validating token:', e);
          }
          
          this.tokenLoaded.next(true);
          this.tokenLoading = false;
          this.tokenLoadingPromise = null;
          resolve(token);
          return;
        } else {
          // Check again for logout status before generating a development token
          this.checkLogoutStatus();
          if (this.hasUserLoggedOut) {
            console.log('TokenManagerService: User has logged out, not generating dev token');
            this.tokenLoading = false;
            this.tokenLoadingPromise = null;
            resolve(null);
            return;
          }
          
          // In development mode with no token, generate one
          console.log('TokenManagerService: No token found in dev mode, generating test token');
          const newToken = this.generateDevToken();
          if (newToken) {
            this.setToken(newToken);
            const formattedToken = this.tokenFactory.formatToken(newToken);
            this.tokenLoaded.next(true);
            this.tokenLoading = false;
            this.tokenLoadingPromise = null;
            resolve(formattedToken);
            return;
          }
        }
      }
    
      // Try to refresh token from the server
      this.refreshToken().subscribe({
        next: (token: string | null) => {
          console.log('TokenManagerService: Token refresh successful');
          this.tokenLoaded.next(true);
          this.tokenLoading = false;
          this.tokenLoadingPromise = null;
          resolve(token);
        },
        error: (error: any) => {
          console.error('TokenManagerService: Token refresh failed', error);
          this.tokenLoaded.next(false);
          this.tokenLoading = false;
          this.tokenLoadingPromise = null;
          resolve(null);
        }
      });
    });
    
    return this.tokenLoadingPromise;
  }
  
  /**
   * Set token in storage
   */
  setToken(token: string, useSession: boolean = false): void {
    console.log('TokenManagerService: Setting token in storage');
    
    if (!token) {
      console.warn('TokenManagerService: Attempted to set empty token, ignoring');
      return;
    }
    
    // Save token using token factory
    this.tokenFactory.setToken(token, useSession);
    
    // Signal token is loaded
    this.tokenLoaded.next(true);
    console.log('TokenManagerService: Token set successfully');
  }
  
  /**
   * Clear token from storage
   */
  clearToken(isLogout: boolean = false): void {
    console.log('TokenManagerService: Clearing token from storage', isLogout ? '(during logout)' : '');
    
    // If this is a logout operation, set the flag
    if (isLogout) {
      this.hasUserLoggedOut = true;
      localStorage.setItem('user_logged_out', 'true');
      console.log('TokenManagerService: Setting user_logged_out flag to true');
    }
    
    this.tokenFactory.clearToken();
    this.tokenLoaded.next(false);
  }
  
  /**
   * Determine if token is in a valid format
   */
  private isValidTokenFormat(token: string): boolean {
    // Basic validation - should be in JWT format
    return token.split('.').length === 3;
  }
  
  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      // Parse the token
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Check expiration (exp is in seconds, convert to milliseconds)
      if (payload.exp) {
        return Date.now() > payload.exp * 1000;
      }
      
      // If no expiration in the token, assume it's valid
      return false;
    } catch (e) {
      console.error('TokenManagerService: Error checking token expiration', e);
      return true; // Assume expired if we can't parse it
    }
  }
  
  /**
   * Generate a development token for testing
   */
  private generateDevToken(): string | null {
    // Check if user has explicitly logged out
    this.checkLogoutStatus();
    if (this.hasUserLoggedOut) {
      console.log('TokenManagerService: User has explicitly logged out, not generating dev token');
      return null;
    }
    
    // Create a simple test token that resembles a JWT
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    
    // Create a payload that expires in 1 day
    const payload = btoa(JSON.stringify({
      sub: 'test@example.com',
      id: 1,
      role: 'USER',
      exp: Math.floor(Date.now() / 1000) + 86400,
      iat: Math.floor(Date.now() / 1000)
    }));
    
    // Create a signature (this is just fake data for a dev token)
    const signature = btoa('devSignature123');
    
    // Combine to form JWT format
    return `${header}.${payload}.${signature}`;
  }
  
  /**
   * For debugging: get complete token info
   */
  getTokenDebugInfo(): any {
    // Use tokenFactory to get token instead of directly accessing localStorage/sessionStorage
    const token = this.tokenFactory.getToken();
    
    if (!token) {
      return {
        exists: false,
        tokenState: {
          loaded: this.tokenLoaded.value,
          loading: this.tokenLoading
        },
        environment: this.isLocalDevelopment ? 'development' : 'production'
      };
    }
    
    try {
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      const parts = cleanToken.split('.');
      
      // In development mode, handle non-standard tokens
      if (this.isLocalDevelopment && parts.length !== 3) {
        return {
          exists: true,
          preview: token.substring(0, 20) + '...',
          isValidFormat: false,
          environment: 'development',
          note: 'Non-standard token format but allowed in development mode',
          tokenState: {
            loaded: this.tokenLoaded.value,
            loading: this.tokenLoading
          }
        };
      }
      
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      return {
        exists: true,
        preview: token.substring(0, 20) + '...',
        header,
        payload,
        expiry: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown',
        expired: payload.exp ? (Date.now() > payload.exp * 1000) : true,
        environment: this.isLocalDevelopment ? 'development' : 'production',
        tokenState: {
          loaded: this.tokenLoaded.value,
          loading: this.tokenLoading
        }
      };
    } catch (error) {
      return {
        exists: true,
        error: 'Failed to parse token',
        token: token.substring(0, 20) + '...',
        environment: this.isLocalDevelopment ? 'development' : 'production',
        tokenState: {
          loaded: this.tokenLoaded.value,
          loading: this.tokenLoading
        }
      };
    }
  }
} 