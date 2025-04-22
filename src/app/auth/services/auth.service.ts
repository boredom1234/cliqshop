import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, of, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiConfigService } from '../../core/services/api-config.service';
import { TokenFactoryService } from '../../core/services/token-factory.service';
import { UserRole } from '../models/user.model';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phoneNumber?: string;
  permissions?: string[];
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  data?: {
    token?: string;
    user?: User;
  };
}

// Token format preference - used for debugging
export type TokenFormat = 'auto' | 'with-bearer' | 'without-bearer' | 'exact';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  private userKey = 'current_user';
  private tokenFormatKey = 'token_format_preference';
  
  // Default token format is 'auto' which means the interceptor decides
  private tokenFormat: TokenFormat = 'auto';

  // Base API URL to avoid circular dependency
  private readonly baseApiUrl = environment.apiUrl || 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenFactory: TokenFactoryService
  ) {
    // Initialize current user from localStorage
    console.log('Initializing AuthService');
    
    // Try to load token format preference
    const savedFormat = localStorage.getItem(this.tokenFormatKey);
    if (savedFormat) {
      this.tokenFormat = savedFormat as TokenFormat;
      console.log(`Using saved token format preference: ${this.tokenFormat}`);
    }
    
    // Try to load user from storage
    const user = this.loadUserFromStorage();
    this.currentUserSubject = new BehaviorSubject<User | null>(user);
    this.currentUser$ = this.currentUserSubject.asObservable();
    
    // Log initial state
    console.log('Initial auth state -', 
      'User:', user, 
      'Is logged in:', !!user,
      'Token format:', this.tokenFormat);
  }

  /**
   * Get the API URL safely without circular dependency
   */
  private getApiUrl(path: string): string {
    // Handle cases where path might already have a leading slash
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Make sure the base URL doesn't end with a slash
    const normalizedBaseUrl = this.baseApiUrl.endsWith('/') 
      ? this.baseApiUrl.slice(0, -1) 
      : this.baseApiUrl;
    
    return `${normalizedBaseUrl}/${normalizedPath}`;
  }

  /**
   * Load user from storage if available
   */
  private loadUserFromStorage(): User | null {
    try {
      // Check token first
      const storedToken = this.tokenFactory.getToken();
      const storedUser = localStorage.getItem(this.userKey);
      
      console.log('Loading from storage - Token exists:', !!storedToken);
      console.log('Loading from storage - User exists:', !!storedUser);
      
      if (!storedToken || !storedUser) {
        console.log('Missing token or user in storage');
        return null;
      }
      
      // Parse user data
      const user: User = JSON.parse(storedUser);
      console.log('Loaded user from storage:', user);
      return user;
    } catch (e) {
      console.error('Error loading user from storage:', e);
      // Clear potentially corrupt data
      this.clearStorage();
      return null;
    }
  }

  /**
   * Clear all auth storage
   */
  private clearStorage(): void {
    console.log('Clearing all local storage data');
    this.tokenFactory.clearToken();
    
    // Clear all items from localStorage
    localStorage.clear();
    
    // Also clear sessionStorage for completeness
    sessionStorage.clear();
  }

  // Get current user value
  public get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Helper method called by auth interceptor when 401 is received
  clearStorageFromInterceptor(): void {
    console.log('Auth Service: Clearing storage after 401 error');
    this.clearStorage();
    this.currentUserSubject.next(null);
  }

  // Check if user is logged in
  public get isLoggedIn(): boolean {
    const user = this.currentUserSubject.value;
    const token = this.tokenFactory.getToken();
    const isLoggedIn = !!user && !!token;
    
    console.log('isLoggedIn check:', isLoggedIn);
    console.log('Current user:', user);
    console.log('Has token:', !!token);
    
    return isLoggedIn;
  }

  // Check if user is admin
  public get isAdmin(): boolean {
    const isAdmin = this.currentUserSubject.value?.role === UserRole.ADMIN;
    console.log('isAdmin check:', isAdmin);
    return isAdmin;
  }

  // Get/set token format preference
  getTokenFormat(): TokenFormat {
    return this.tokenFormat;
  }
  
  setTokenFormat(format: TokenFormat): void {
    console.log(`Setting token format to: ${format}`);
    this.tokenFormat = format;
    localStorage.setItem(this.tokenFormatKey, format);
  }

  /**
   * Get the current authentication token
   */
  getToken(): string | null {
    return this.tokenFactory.getToken();
  }

  /**
   * Set a token manually (for testing or token refresh)
   */
  setManualToken(token: string): boolean {
    try {
      // Check if user has explicitly logged out
      const hasLoggedOut = localStorage.getItem('user_logged_out') === 'true';
      if (hasLoggedOut) {
        console.log('Manual token set rejected: User has explicitly logged out');
        return false;
      }
      
      // Store the token
      this.tokenFactory.setToken(token);
      console.log('Manual token set successfully');
      return true;
    } catch (e) {
      console.error('Error setting manual token:', e);
      return false;
    }
  }

  // 1.1.1 Request OTP
  requestOtp(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      this.getApiUrl('/register/send-otp'), 
      null, 
      { params: { email } }
    );
  }

  // 1.1.2 Verify OTP and Complete Registration
  verifyOtpAndRegister(
    email: string, 
    otp: string, 
    password: string, 
    name: string, 
    address: string,
    city: string,
    state: string,
    postalCode: string,
    country: string,
    phoneNumber: string
  ): Observable<AuthResponse> {
    const params = {
      password,
      name,
      address,
      city,
      state,
      postalCode,
      country,
      phoneNumber
    };
    
    return this.http.post<AuthResponse>(
      this.getApiUrl('/register/verify-otp'), 
      { email, otp },
      { params }
    ).pipe(
      tap(response => {
        console.log('Registration response:', response);
        
        // Handle both nested and non-nested response structures
        const token = response.data?.token || response.token;
        const user = response.data?.user || response.user;
        
        if (response.success && token && user) {
          this.setSession(token, user);
        }
      })
    );
  }

  // 1.2 User Login
  login(email: string, password: string): Observable<AuthResponse> {
    console.log('Attempting login for user:', email);
    return this.http.post<AuthResponse>(
      this.getApiUrl('/login'),
      { email, password }
    ).pipe(
      tap(response => {
        console.log('Login response:', response);
        
        // Handle both nested and non-nested response structures
        const token = response.data?.token || response.token;
        const user = response.data?.user || response.user;
        
        if (response.success && token && user) {
          console.log('Login successful, setting session with token and user');
          this.setSession(token, user);
        } else {
          console.warn('Login response success but missing token or user:', response);
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        return of({ success: false, message: error.error?.message || 'Login failed' });
      })
    );
  }

  // 1.3 Admin Registration
  adminRegister(email: string, password: string, adminKey: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      this.getApiUrl('/admin/auth/register'),
      { email, password },
      { params: { adminKey } }
    ).pipe(
      tap(response => {
        console.log('Admin registration response:', response);
        
        // Handle both nested and non-nested response structures
        const token = response.data?.token || response.token;
        const user = response.data?.user || response.user;
        
        if (response.success && token && user) {
          this.setSession(token, user);
        }
      })
    );
  }

  // 1.4 Admin Login
  adminLogin(email: string, password: string): Observable<AuthResponse> {
    console.log('Attempting admin login for user:', email);
    return this.http.post<AuthResponse>(
      this.getApiUrl('/admin/auth/login'),
      { email, password }
    ).pipe(
      tap(response => {
        console.log('Admin login response:', response);
        
        // Handle both nested and non-nested response structures
        const token = response.data?.token || response.token;
        const user = response.data?.user || response.user;
        
        if (response.success && token && user) {
          console.log('Admin login successful, setting session');
          this.setSession(token, user);
        } else {
          console.warn('Admin login response success but missing token or user:', response);
        }
      })
    );
  }

  // 1.5 Password Reset Request
  requestPasswordReset(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      this.getApiUrl('/forgot-password'),
      null,
      { params: { email } }
    );
  }

  // 1.6 Password Reset
  resetPassword(token: string, newPassword: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      this.getApiUrl('/reset-password'),
      null,
      { params: { token, newPassword } }
    );
  }

  // Logout user
  logout(): void {
    console.log('Logging out user - clearing all storage data');
    
    // Set a flag indicating user has explicitly logged out
    // This flag will be used to prevent automatic dev token creation
    localStorage.setItem('user_logged_out', 'true');
    
    // Tell the token manager this is a logout operation
    this.tokenFactory.clearToken(true);
    
    this.clearStorage();
    this.currentUserSubject.next(null);
    
    // Force refresh to login page
    console.log('Redirecting to login page with force refresh');
    window.location.href = '/auth/login';
  }

  /**
   * Set the session after successful login or registration
   * @param token Authentication token
   * @param user User data
   */
  private setSession(token: string, user: User): void {
    try {
      console.log('Setting session for user:', user.email);
      
      // Clear the logged out flag since user is explicitly logging in
      localStorage.removeItem('user_logged_out');
      
      // Store the token using token factory
      this.tokenFactory.setToken(token);
      
      // Store user data
      localStorage.setItem(this.userKey, JSON.stringify(user));
      
      // Update current user
      this.currentUserSubject.next(user);
      
      console.log('Session set successfully');
    } catch (e) {
      console.error('Error setting session:', e);
      this.clearStorage();
    }
  }

  /**
   * Update the current user information in the BehaviorSubject and localStorage
   * This method is called when profile information is updated
   */
  updateCurrentUser(updatedUserInfo: Partial<User>): void {
    const currentUser = this.currentUserSubject.value;
    
    if (currentUser) {
      // Merge the current user with the updated information
      const updatedUser = {
        ...currentUser,
        ...updatedUserInfo
      };
      
      console.log('Updating current user:', updatedUser);
      
      // Update the BehaviorSubject with the new user info
      this.currentUserSubject.next(updatedUser);
      
      // Update the localStorage with the new user info
      localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
    } else {
      console.warn('Cannot update user info: No current user');
    }
  }
} 