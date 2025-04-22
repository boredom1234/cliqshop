import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiConfigService } from '../../core/services/api-config.service';

@Component({
  selector: 'app-fetch-tester',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="debug-container">
      <h2>Direct Fetch API Tester</h2>
      
      <div class="form-group">
        <label for="endpoint">API Endpoint</label>
        <input 
          type="text" 
          id="endpoint" 
          [(ngModel)]="endpoint" 
          class="form-control"
          placeholder="/cart"
        >
      </div>
      
      <div class="form-group">
        <label for="token">JWT Token</label>
        <textarea 
          id="token" 
          [(ngModel)]="token" 
          rows="3" 
          placeholder="Paste JWT token here or leave empty to use current token"
          class="form-control"
        ></textarea>
      </div>
      
      <div class="form-group">
        <label>Request Method</label>
        <div class="radio-group">
          <label>
            <input type="radio" [(ngModel)]="method" name="method" value="GET">
            GET
          </label>
          <label>
            <input type="radio" [(ngModel)]="method" name="method" value="POST">
            POST
          </label>
          <label>
            <input type="radio" [(ngModel)]="method" name="method" value="PATCH">
            PATCH
          </label>
          <label>
            <input type="radio" [(ngModel)]="method" name="method" value="DELETE">
            DELETE
          </label>
        </div>
      </div>
      
      <div class="form-group">
        <label>Authorization Header Format</label>
        <div class="radio-group">
          <label>
            <input type="radio" [(ngModel)]="authFormat" name="authFormat" value="bearer">
            Use "Bearer TOKEN"
          </label>
          <label>
            <input type="radio" [(ngModel)]="authFormat" name="authFormat" value="token">
            Use token directly
          </label>
          <label>
            <input type="radio" [(ngModel)]="authFormat" name="authFormat" value="none">
            No Authorization header
          </label>
        </div>
      </div>
      
      <div class="form-group">
        <label for="requestBody">Request Body (JSON)</label>
        <textarea 
          id="requestBody" 
          [(ngModel)]="requestBody" 
          rows="3" 
          placeholder='{"example": "value"}'
          class="form-control"
          [disabled]="method === 'GET' || method === 'DELETE'"
        ></textarea>
      </div>
      
      <div class="form-group">
        <label for="extraHeaders">Extra Headers (JSON)</label>
        <textarea 
          id="extraHeaders" 
          [(ngModel)]="extraHeaders" 
          rows="2" 
          placeholder='{"Content-Type": "application/json"}'
          class="form-control"
        ></textarea>
      </div>
      
      <div class="button-group">
        <button 
          (click)="sendRequest()" 
          [disabled]="loading || !endpoint" 
          class="test-button"
        >
          {{ loading ? 'Sending Request...' : 'Send Request' }}
        </button>
        
        <button 
          (click)="resetForm()" 
          [disabled]="loading" 
          class="reset-button"
        >
          Reset Form
        </button>
      </div>
      
      <div *ngIf="requestDetails" class="request-details">
        <h3>Request Details</h3>
        <pre>{{ requestDetails }}</pre>
      </div>
      
      <div *ngIf="responseStatus" class="response-status" 
           [ngClass]="{'success': responseStatus >= 200 && responseStatus < 300, 
                      'error': responseStatus >= 400}">
        <h3>Response Status: {{ responseStatus }}</h3>
      </div>
      
      <div *ngIf="responseHeaders" class="response-headers">
        <h3>Response Headers</h3>
        <pre>{{ responseHeaders }}</pre>
      </div>
      
      <div *ngIf="responseBody" class="response-body">
        <h3>Response Body</h3>
        <pre>{{ responseBody }}</pre>
      </div>
      
      <div *ngIf="error" class="error">
        <h3>Error</h3>
        <pre>{{ error }}</pre>
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
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    
    textarea.form-control {
      resize: vertical;
    }
    
    .button-group {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }
    
    .test-button, .reset-button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    
    .test-button {
      background-color: #007bff;
      color: white;
    }
    
    .reset-button {
      background-color: #6c757d;
      color: white;
    }
    
    .test-button:disabled, .reset-button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
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
      font-weight: normal;
    }
    
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: monospace;
      font-size: 14px;
      max-height: 300px;
      overflow: auto;
      background-color: #f0f0f0;
      padding: 10px;
      border-radius: 4px;
    }
    
    .response-status {
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    
    .response-status.success {
      background-color: #d4edda;
      color: #155724;
    }
    
    .response-status.error {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    .response-headers, .response-body, .request-details {
      margin-bottom: 15px;
    }
    
    .error {
      background-color: #f8d7da;
      color: #721c24;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
    }
  `]
})
export class FetchTesterComponent implements OnInit {
  // Form fields
  endpoint = '/cart';
  token = '';
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
  authFormat: 'bearer' | 'token' | 'none' = 'bearer';
  requestBody = '';
  extraHeaders = '{"Content-Type": "application/json", "Accept": "application/json"}';
  
  // Response data
  loading = false;
  requestDetails = '';
  responseStatus: number | null = null;
  responseHeaders = '';
  responseBody = '';
  error: string | null = null;
  
  constructor(private apiConfig: ApiConfigService) {}
  
  ngOnInit(): void {
    // Load token from localStorage if available
    const savedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (savedToken) {
      this.token = savedToken;
    }
  }
  
  resetForm(): void {
    this.responseStatus = null;
    this.responseHeaders = '';
    this.responseBody = '';
    this.requestDetails = '';
    this.error = null;
  }
  
  sendRequest(): void {
    this.loading = true;
    this.resetForm();
    
    // Prepare URL
    const url = this.apiConfig.getUrl(this.endpoint);
    
    // Prepare headers
    const headers: Record<string, string> = {};
    
    // Add Authorization header if needed
    if (this.authFormat !== 'none' && this.token) {
      const authToken = this.authFormat === 'bearer' && !this.token.startsWith('Bearer ')
        ? `Bearer ${this.token}`
        : this.token;
      
      headers['Authorization'] = authToken;
    }
    
    // Add extra headers
    try {
      if (this.extraHeaders) {
        const extraHeaders = JSON.parse(this.extraHeaders);
        Object.assign(headers, extraHeaders);
      }
    } catch (e) {
      this.error = `Invalid extra headers JSON: ${e instanceof Error ? e.message : String(e)}`;
      this.loading = false;
      return;
    }
    
    // Prepare request options
    const options: RequestInit = {
      method: this.method,
      headers,
      credentials: 'include', // Include cookies for cross-origin requests if needed
    };
    
    // Add request body for POST/PATCH
    if ((this.method === 'POST' || this.method === 'PATCH') && this.requestBody) {
      try {
        options.body = this.requestBody;
      } catch (e) {
        this.error = `Invalid request body: ${e instanceof Error ? e.message : String(e)}`;
        this.loading = false;
        return;
      }
    }
    
    // Build request details for display
    this.requestDetails = `${this.method} ${url}\n\nHeaders:\n`;
    Object.entries(headers).forEach(([key, value]) => {
      // Truncate Authorization header value for display
      const displayValue = key === 'Authorization' ? `${value.substring(0, 30)}...` : value;
      this.requestDetails += `${key}: ${displayValue}\n`;
    });
    
    if (options.body) {
      this.requestDetails += `\nBody:\n${options.body}`;
    }
    
    // Start time for timing the request
    const startTime = Date.now();
    
    // Send request
    fetch(url, options)
      .then(response => {
        const endTime = Date.now();
        this.responseStatus = response.status;
        
        // Format response headers
        this.responseHeaders = '';
        response.headers.forEach((value, key) => {
          this.responseHeaders += `${key}: ${value}\n`;
        });
        
        // Add timing information
        this.requestDetails += `\n\nRequest completed in ${endTime - startTime}ms`;
        
        // Handle response based on status
        if (!response.ok) {
          return response.text().then(text => {
            try {
              // Try to parse as JSON
              return JSON.parse(text);
            } catch (e) {
              // If not JSON, return as text
              return text;
            }
          }).then(data => {
            throw { status: response.status, data };
          });
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return response.json();
        } else {
          return response.text();
        }
      })
      .then(data => {
        if (typeof data === 'object') {
          this.responseBody = JSON.stringify(data, null, 2);
        } else {
          this.responseBody = data;
        }
        this.loading = false;
      })
      .catch(err => {
        this.loading = false;
        
        if (err.status && err.data) {
          // Error with response data
          this.error = `Error ${err.status}`;
          if (typeof err.data === 'object') {
            this.responseBody = JSON.stringify(err.data, null, 2);
          } else {
            this.responseBody = String(err.data);
          }
        } else {
          // Network error or other error
          this.error = `Request failed: ${err.message || String(err)}`;
        }
      });
  }
} 