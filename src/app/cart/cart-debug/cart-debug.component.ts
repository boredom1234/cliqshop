import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../services/cart.service';
import { AuthService, TokenFormat } from '../../auth/services/auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ApiConfigService } from '../../core/services/api-config.service';
import { Cart, CartItem } from '../services/cart.service';
import { Product, ProductDetail } from '../../products/services/product.service';

@Component({
  selector: 'app-cart-debug',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="debug-container">
      <h2>Cart API Debug</h2>
      
      <div class="info-box">
        <h3>Token Status</h3>
        <div *ngIf="tokenInfo">
          <p><strong>Status:</strong> {{ tokenInfo.exists ? 'Found' : 'Not Found' }}</p>
          <p *ngIf="tokenInfo.exists">
            <strong>Source:</strong> {{ tokenInfo.source }}<br>
            <strong>Format:</strong> {{ tokenInfo.format }}<br>
            <strong>Valid:</strong> {{ tokenInfo.valid ? 'Yes' : 'No' }}<br>
            <strong>JWT Format:</strong> {{ tokenInfo.isJwt ? 'Yes' : 'No' }}<br>
            <strong>Expires:</strong> {{ tokenInfo.expiry || 'Unknown' }}<br>
            <strong>Preview:</strong> {{ tokenInfo.preview }}
          </p>
        </div>
        <button (click)="refreshTokenInfo()" class="small-button">Refresh Token Info</button>
      </div>
      
      <div class="form-group">
        <label for="token">Test with JWT Token</label>
        <textarea 
          id="token" 
          [(ngModel)]="token" 
          rows="3" 
          placeholder="Paste JWT token here"
          class="form-control"
        ></textarea>
      </div>
      
      <div class="form-group">
        <label>Token storage format:</label>
        <div class="radio-group">
          <label>
            <input type="radio" [(ngModel)]="tokenFormat" name="tokenFormat" value="auto">
            Auto (let interceptor handle format)
          </label>
          <label>
            <input type="radio" [(ngModel)]="tokenFormat" name="tokenFormat" value="with-bearer">
            Store with "Bearer " prefix
          </label>
          <label>
            <input type="radio" [(ngModel)]="tokenFormat" name="tokenFormat" value="without-bearer">
            Store without "Bearer " prefix
          </label>
          <label>
            <input type="radio" [(ngModel)]="tokenFormat" name="tokenFormat" value="exact">
            Store exactly as pasted
          </label>
        </div>
        <button (click)="saveTokenFormatPreference()" class="small-button">Save Format Preference</button>
      </div>
      
      <div class="form-group">
        <label>Authorization format for direct test:</label>
        <div class="radio-group">
          <label>
            <input type="radio" [(ngModel)]="authFormat" name="authFormat" value="bearer">
            Add "Bearer " prefix
          </label>
          <label>
            <input type="radio" [(ngModel)]="authFormat" name="authFormat" value="token">
            Token only (no prefix)
          </label>
          <label>
            <input type="radio" [(ngModel)]="authFormat" name="authFormat" value="as-is">
            Use exactly as pasted
          </label>
        </div>
      </div>
      
      <div class="button-group">
        <button 
          (click)="testApiWithToken()" 
          [disabled]="loading" 
          class="test-button"
        >
          {{ loading ? 'Testing...' : 'Test API Call' }}
        </button>
        
        <button 
          (click)="saveToken()" 
          [disabled]="!token" 
          class="save-button"
        >
          Save Token to localStorage
        </button>
        
        <button 
          (click)="testWithCurrentToken()" 
          class="test-button"
        >
          Test with Current Token
        </button>
        
        <button
          (click)="testDirectFetch()"
          class="test-button"
        >
          Test with Fetch API
        </button>
      </div>
      
      <div class="check-section">
        <h3>API Endpoint Tests</h3>
        <div class="button-group">
          <button (click)="testEndpoint('get')" class="small-button">GET /cart</button>
          <button (click)="testEndpoint('add')" class="small-button">POST /cart-add/1</button>
          <button (click)="testEndpoint('update')" class="small-button">PATCH /cart-update/1</button>
          <button (click)="testEndpoint('delete')" class="small-button">DELETE /cart-delete/1</button>
        </div>
      </div>
      
      <div *ngIf="result" class="result">
        <h3>API Result:</h3>
        <pre>{{ result | json }}</pre>
      </div>
      
      <div *ngIf="error" class="error">
        <h3>API Error:</h3>
        <pre>{{ error }}</pre>
      </div>
      
      <div *ngIf="requestDetails" class="request-details">
        <h3>Last Request Details:</h3>
        <pre>{{ requestDetails }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .debug-container {
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin: 20px;
      background-color: #f9f9f9;
      max-width: 800px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .form-control {
      width: 100%;
      padding: 8px;
      font-family: monospace;
    }
    
    .button-group {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }
    
    .test-button, .save-button, .small-button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .test-button {
      background-color: #007bff;
      color: white;
    }
    
    .save-button {
      background-color: #28a745;
      color: white;
    }
    
    .small-button {
      background-color: #6c757d;
      color: white;
      padding: 4px 8px;
      font-size: 0.9em;
    }
    
    .test-button:disabled, .save-button:disabled, .small-button:disabled {
      background-color: #cccccc;
    }
    
    .info-box {
      margin-bottom: 20px;
      padding: 10px;
      background-color: #e9ecef;
      border-radius: 4px;
    }
    
    .check-section {
      margin-top: 20px;
      padding: 10px;
      background-color: #f0f0f0;
      border-radius: 4px;
    }
    
    .result, .error {
      margin-top: 20px;
      padding: 10px;
      border-radius: 4px;
    }
    
    .result {
      background-color: #d4edda;
      color: #155724;
    }
    
    .error {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: monospace;
      font-size: 14px;
      max-height: 300px;
      overflow: auto;
    }
    
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-bottom: 10px;
    }
    
    .radio-group label {
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
    }
    
    .request-details {
      margin-top: 20px;
      padding: 10px;
      border-radius: 4px;
      background-color: #f0f0f0;
      color: #333;
    }
  `]
})
export class CartDebugComponent implements OnInit {
  token = '';
  result: any = null;
  error: string | null = null;
  loading = false;
  requestDetails: string | null = null;
  
  authFormat: 'bearer' | 'token' | 'as-is' = 'bearer';
  tokenFormat: TokenFormat = 'auto';
  tokenInfo: any = null;
  
  constructor(
    private cartService: CartService, 
    private authService: AuthService, 
    private http: HttpClient,
    private apiConfigService: ApiConfigService
  ) {}
  
  ngOnInit(): void {
    // Load saved token format preference
    this.tokenFormat = this.authService.getTokenFormat();
    
    // Get token debug info
    this.refreshTokenInfo();
  }
  
  refreshTokenInfo(): void {
    this.tokenInfo = this.authService.getTokenDebugInfo();
  }
  
  saveTokenFormatPreference(): void {
    this.authService.setTokenFormat(this.tokenFormat);
    this.result = { message: `Token format preference saved: ${this.tokenFormat}` };
  }
  
  testApiWithToken(): void {
    if (!this.token) {
      this.error = 'Please enter a token';
      return;
    }
    
    this.loading = true;
    this.result = null;
    this.error = null;
    this.requestDetails = null;
    
    // Process token based on selected format
    let processedToken = this.token;
    if (this.authFormat === 'bearer' && !processedToken.startsWith('Bearer ')) {
      processedToken = `Bearer ${processedToken}`;
    } else if (this.authFormat === 'token' && processedToken.startsWith('Bearer ')) {
      processedToken = processedToken.substring(7);
    }
    
    console.log('Using token format:', this.authFormat);
    console.log('Processed token:', processedToken.substring(0, 20) + '...');
    
    this.http.get(
      this.apiConfigService.getUrl('/cart'),
      {
        headers: {
          'Authorization': processedToken
        },
        observe: 'response'
      }
    ).subscribe({
      next: (response) => {
        this.result = response.body;
        this.loading = false;
        
        // Build request details
        let headers = '';
        response.headers.keys().forEach(key => {
          headers += `${key}: ${response.headers.get(key)}\n`;
        });
        
        this.requestDetails = `Request URL: ${this.apiConfigService.getUrl('/cart')}\n` +
                              `Request Method: GET\n` +
                              `Authorization: ${processedToken.substring(0, 20)}...\n` +
                              `Status: ${response.status}\n` +
                              `Response Headers:\n${headers}`;
        
        // If successful, try to store the working token
        try {
          // Store token according to format preference
          const success = this.authService.setManualToken(this.token);
          if (success) {
            this.refreshTokenInfo();
          }
        } catch (e) {
          console.error('Failed to save token:', e);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.error = `Error ${err.status}: ${err.statusText}\n${err.message}`;
        if (err.error && typeof err.error === 'object') {
          this.error += '\n\n' + JSON.stringify(err.error, null, 2);
        }
        
        // Show request details even for errors
        this.requestDetails = `Request URL: ${err.url}\n` +
                              `Request Method: GET\n` +
                              `Authorization: ${processedToken.substring(0, 20)}...\n` +
                              `Status: ${err.status} ${err.statusText}\n` +
                              `Error: ${err.message}`;
        
        this.loading = false;
      }
    });
  }
  
  testDirectFetch(): void {
    this.loading = true;
    this.result = null;
    this.error = null;
    this.requestDetails = null;
    
    // Get the token based on saved preference
    const currentToken = this.authService.getToken() || '';
    
    // Prepare token according to auth format for this specific request
    let authHeader = currentToken;
    if (this.authFormat === 'bearer' && !currentToken.startsWith('Bearer ')) {
      authHeader = `Bearer ${currentToken}`;
    } else if (this.authFormat === 'token' && currentToken.startsWith('Bearer ')) {
      authHeader = currentToken.substring(7);
    }
    
    console.log('Using fetch API with auth header:', authHeader.substring(0, 20) + '...');
    
    // Record start time for timing
    const startTime = Date.now();
    
    // Use the Fetch API directly
    fetch(this.apiConfigService.getUrl('/cart'), {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    .then(response => {
      const endTime = Date.now();
      
      // Build detailed request information
      this.requestDetails = `Direct Fetch request:\n` +
                            `URL: ${response.url}\n` +
                            `Method: GET\n` +
                            `Status: ${response.status} ${response.statusText}\n` +
                            `Time: ${endTime - startTime}ms\n\n` +
                            `Request Headers Sent:\n` +
                            `Authorization: ${authHeader.substring(0, 20)}...\n` +
                            `Content-Type: application/json\n` +
                            `Accept: application/json\n\n` +
                            `Response Headers Received:\n`;
      
      // Add all response headers to details
      response.headers.forEach((value, key) => {
        this.requestDetails += `${key}: ${value}\n`;
      });
      
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(`Status: ${response.status} - ${JSON.stringify(errorData)}`);
        });
      }
      return response.json();
    })
    .then(data => {
      this.result = data;
      this.loading = false;
    })
    .catch(error => {
      this.error = `Fetch error: ${error.message}`;
      this.loading = false;
    });
  }
  
  saveToken(): void {
    if (!this.token) return;
    
    try {
      // Use the auth service to set the token properly
      const success = this.authService.setManualToken(this.token);
      
      if (success) {
        this.refreshTokenInfo();
        this.result = { message: 'Token saved successfully' };
      } else {
        this.error = 'Failed to save token - it might be invalid or expired';
      }
    } catch (e) {
      this.error = 'Failed to save token: ' + (e instanceof Error ? e.message : String(e));
    }
  }
  
  testWithCurrentToken(): void {
    this.loading = true;
    this.result = null;
    this.error = null;
    this.requestDetails = null;
    
    // This will use the token from storage via the interceptor
    this.cartService.fetchCart().subscribe({
      next: (response: Cart) => {
        this.result = response;
        this.loading = false;
        this.requestDetails = `Using Angular HttpClient with interceptor\n` +
                              `URL: ${this.apiConfigService.getUrl('/cart')}\n` +
                              `Method: GET\n` +
                              `Token format: ${this.tokenFormat}`;
      },
      error: (err: HttpErrorResponse) => {
        this.error = `Error ${err.status}: ${err.statusText}\n${err.message}`;
        if (err.error && typeof err.error === 'object') {
          this.error += '\n\n' + JSON.stringify(err.error, null, 2);
        }
        this.loading = false;
      }
    });
  }
  
  testEndpoint(type: 'get' | 'add' | 'update' | 'delete'): void {
    this.loading = true;
    this.result = null;
    this.error = null;
    this.requestDetails = null;
    
    let observable;
    
    // Create a mock product detail for testing
    const mockProduct: ProductDetail = {
      id: 1,
      name: 'Test Product',
      price: 99.99,
      description: 'Test product for API debugging',
      imageUrl: 'test.jpg',
      category: 'test',
      averageRating: 0,
      reviews: []
    };
    
    switch (type) {
      case 'get':
        observable = this.cartService.fetchCart();
        this.requestDetails = `Testing GET /cart endpoint`;
        break;
      case 'add':
        observable = this.cartService.addToCart(mockProduct, 1);
        this.requestDetails = `Testing POST /cart-add/1 endpoint with quantity 1`;
        break;
      case 'update':
        observable = this.cartService.updateQuantity(1, 2);
        this.requestDetails = `Testing PATCH /cart-update/1 endpoint with quantity 2`;
        break;
      case 'delete':
        observable = this.cartService.removeItem(1);
        this.requestDetails = `Testing DELETE /cart-delete/1 endpoint`;
        break;
    }
    
    observable.subscribe({
      next: (response: Cart) => {
        this.result = response;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = `Error ${err.status}: ${err.statusText}\n${err.message}`;
        if (err.error && typeof err.error === 'object') {
          this.error += '\n\n' + JSON.stringify(err.error, null, 2);
        }
        this.loading = false;
      }
    });
  }
} 