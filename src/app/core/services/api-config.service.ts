import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map, timer, switchMap } from 'rxjs';
import { TokenFactoryService } from './token-factory.service';

@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {
  private readonly baseUrl = environment.apiUrl || 'http://localhost:5000/api';
  private serverStatus: 'unknown' | 'online' | 'offline' = 'unknown';
  
  constructor(
    private http: HttpClient,
    private tokenFactory: TokenFactoryService
  ) {
    // Check server status on init in development mode
    if (this.isDevelopmentMode()) {
      this.checkServerStatus();
    }
  }

  /**
   * Returns a fully qualified API URL by combining the base URL and the provided path
   * @param path The API endpoint path (with or without leading slash)
   * @returns The full API URL
   */
  getUrl(path: string): string {
    // Handle cases where path might already have a leading slash
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Make sure the base URL doesn't end with a slash
    const normalizedBaseUrl = this.baseUrl.endsWith('/') 
      ? this.baseUrl.slice(0, -1) 
      : this.baseUrl;
    
    return `${normalizedBaseUrl}/${normalizedPath}`;
  }
  
  /**
   * Get HTTP headers with authorization token
   * @param includeContentType Whether to include Content-Type header
   * @returns HttpHeaders object with auth token
   */
  getAuthHeaders(includeContentType: boolean = true): HttpHeaders {
    let headers = new HttpHeaders();
    
    if (includeContentType) {
      headers = headers.set('Content-Type', 'application/json');
    }
    
    // Get token directly from TokenFactoryService
    const token = this.tokenFactory.getToken();
    if (token) {
      // Ensure Bearer prefix is added if not already present
      const authToken = this.tokenFactory.formatToken(token);
      if (authToken) {
        headers = headers.set('Authorization', authToken);
        
        if (this.isDevelopmentMode()) {
          console.log('ApiConfigService: Added Authorization header with token');
        }
      }
    } else {
      console.warn('ApiConfigService: No auth token available for headers');
    }
    
    return headers;
  }
  
  /**
   * Check if we're in development mode
   */
  isDevelopmentMode(): boolean {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }
  
  /**
   * Get the current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
  
  /**
   * Get the current server status
   */
  getServerStatus(): 'unknown' | 'online' | 'offline' {
    return this.serverStatus;
  }
  
  /**
   * Ping the server to check if it's online
   */
  checkServerStatus(): Observable<boolean> {
    console.log('ApiConfigService: Checking server status...');
    
    // Use a simple ping endpoint or just try to hit the base URL
    return timer(100).pipe(
      switchMap(() => {
        const pingUrl = `${this.baseUrl}/health` || `${this.baseUrl}`;
        
        console.log('ApiConfigService: Pinging server at', pingUrl);
        
        return this.http.get(pingUrl, { 
          responseType: 'text',
          headers: this.getAuthHeaders(false)
        }).pipe(
          map(response => {
            console.log('ApiConfigService: Server is online', response);
            this.serverStatus = 'online';
            return true;
          }),
          catchError(error => {
            console.warn('ApiConfigService: Server appears to be offline or unreachable', error);
            this.serverStatus = 'offline';
            
            // Try to ping the base domain without the API path to diagnose
            const baseServerUrl = this.extractDomainUrl(this.baseUrl);
            if (baseServerUrl !== this.baseUrl) {
              console.log('ApiConfigService: Trying to ping base domain:', baseServerUrl);
              
              return this.http.get(baseServerUrl, { 
                responseType: 'text',
                headers: { 'Cache-Control': 'no-cache' }
              }).pipe(
                map(() => {
                  console.log('ApiConfigService: Base domain is reachable, but API path may be incorrect');
                  return false;
                }),
                catchError(() => {
                  console.warn('ApiConfigService: Base domain is also unreachable');
                  return of(false);
                })
              );
            }
            
            return of(false);
          })
        );
      }),
      catchError(() => {
        console.error('ApiConfigService: Error checking server status');
        this.serverStatus = 'unknown';
        return of(false);
      })
    );
  }
  
  /**
   * Extract the domain URL without the API path
   */
  private extractDomainUrl(fullUrl: string): string {
    try {
      const url = new URL(fullUrl);
      return `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}`;
    } catch (e) {
      return fullUrl;
    }
  }
  
  /**
   * Get diagnostic info about API configuration for troubleshooting
   */
  getDiagnosticInfo(): any {
    return {
      baseUrl: this.baseUrl,
      serverStatus: this.serverStatus,
      isDevelopment: this.isDevelopmentMode(),
      environment: environment.production ? 'production' : 'development',
      sampleEndpoints: {
        cart: this.getUrl('/cart'),
        updateCart: this.getUrl('/cart-update/1'),
        deleteCart: this.getUrl('/cart-delete/1'),
        updateProfile: this.getUrl('/update-profile')
      }
    };
  }
} 