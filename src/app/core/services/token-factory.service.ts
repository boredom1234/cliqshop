import { Injectable } from '@angular/core';

/**
 * Service to handle token storage and retrieval without dependencies
 * This service breaks the circular dependency between ApiConfigService and AuthService
 */
@Injectable({
  providedIn: 'root'
})
export class TokenFactoryService {
  private readonly tokenKey = 'auth_token';
  
  constructor() { 
    console.log('TokenFactoryService initialized');
  }
  
  /**
   * Get the authentication token from storage
   * @returns The token string or null if not found
   */
  getToken(): string | null {
    // Try localStorage first, then sessionStorage
    const token = localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
    return token;
  }
  
  /**
   * Set the authentication token in storage
   * @param token The token to store
   * @param useSession Whether to use sessionStorage instead of localStorage
   */
  setToken(token: string, useSession: boolean = false): void {
    if (useSession) {
      sessionStorage.setItem(this.tokenKey, token);
    } else {
      localStorage.setItem(this.tokenKey, token);
    }
  }
  
  /**
   * Clear the authentication token from storage
   */
  clearToken(isLogout: boolean = false): void {
    // Remove auth token
    localStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.tokenKey);
    
    // Also remove other known items for complete logout
    localStorage.removeItem('cart');
    localStorage.removeItem('current_user');
    localStorage.removeItem('user');
    
    // If this is part of an explicit logout, set the flag directly
    if (isLogout) {
      localStorage.setItem('user_logged_out', 'true');
    }
    
    // Note: The complete localStorage.clear() is done in AuthService
  }
  
  /**
   * Get a formatted token with Bearer prefix if needed
   * @param token The token to format
   * @returns The formatted token
   */
  formatToken(token: string | null): string | null {
    if (!token) return null;
    
    // Add Bearer prefix if not already present
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
} 