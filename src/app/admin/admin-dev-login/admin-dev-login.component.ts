import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dev-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dev-login-container">
      <h1>Admin Development Login</h1>
      <p>This component is for development purposes only.</p>
      
      <div class="form-group">
        <label for="token">JWT Token (from API):</label>
        <input type="text" id="token" [(ngModel)]="token" placeholder="Paste the JWT token here">
      </div>
      
      <button (click)="setToken()" [disabled]="!token">Set Token</button>
      
      <div class="message" *ngIf="message">
        {{message}}
      </div>

      <div class="token-info" *ngIf="decodedToken">
        <h3>Token Information:</h3>
        <pre>{{decodedToken | json}}</pre>
      </div>

      <div class="token-help">
        <h3>How to get a token:</h3>
        <p>To get a token, use the following steps:</p>
        <ol>
          <li>Use a terminal or Postman to make a POST request to: <br/><code>http://localhost:5000/api/admin/auth/login</code></li>
          <li>Set Content-Type header to: <code>application/json</code></li>
          <li>Use admin credentials in the request body</li>
          <li>Copy the token from the response and paste it above</li>
        </ol>
      </div>
    </div>
  `,
  styles: [`
    .dev-login-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      border: 1px solid #ccc;
      border-radius: 5px;
      background-color: #f9f9f9;
    }
    
    h1 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }
    
    input {
      width: 100%;
      padding: 0.5rem;
      font-family: monospace;
    }
    
    button {
      background: #000;
      color: #fff;
      border: none;
      padding: 0.5rem 1rem;
      cursor: pointer;
      font-size: 1rem;
    }
    
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .message {
      margin-top: 1rem;
      padding: 0.5rem;
      background: #e6f7e6;
      border: 1px solid #c3e6c3;
      border-radius: 3px;
    }
    
    code {
      background: #f1f1f1;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: monospace;
    }
    
    pre {
      background: #f1f1f1;
      padding: 1rem;
      border-radius: 3px;
      overflow-x: auto;
      font-size: 0.8rem;
    }
    
    .token-help {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #ccc;
    }

    .token-info {
      margin-top: 1rem;
    }
    
    ol {
      margin-left: 1.5rem;
    }
    
    li {
      margin-bottom: 0.5rem;
    }
  `]
})
export class AdminDevLoginComponent {
  token: string = '';
  message: string = '';
  decodedToken: any = null;
  
  constructor(private router: Router) {}
  
  setToken(): void {
    if (!this.token) {
      this.message = 'Please enter a token';
      return;
    }
    
    try {
      // Save the token to localStorage (both possible keys)
      localStorage.setItem('auth_token', this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`);
      localStorage.setItem('token', this.token.startsWith('Bearer ') ? this.token.substring(7) : this.token);
      
      // Decode token to show details
      this.decodeToken();
      
      // Set flag to show we're logged in
      localStorage.removeItem('user_logged_out');
      
      this.message = 'Token set successfully. You can now navigate to admin pages.';
      
      // Redirect to admin dashboard after a short delay
      setTimeout(() => {
        this.router.navigate(['/admin/dashboard']);
      }, 1500);
    } catch (error) {
      console.error('Error setting token:', error);
      this.message = 'Failed to set token: ' + (error instanceof Error ? error.message : String(error));
    }
  }
  
  private decodeToken(): void {
    try {
      const token = this.token.startsWith('Bearer ') ? this.token.substring(7) : this.token;
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      // Decode the payload (second part)
      const payload = JSON.parse(atob(parts[1]));
      this.decodedToken = payload;
      
      // Check if token is expired
      if (payload.exp) {
        const expiryDate = new Date(payload.exp * 1000);
        const now = new Date();
        if (now > expiryDate) {
          this.message += ' Warning: This token is expired!';
        }
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      this.decodedToken = { error: 'Failed to decode token' };
    }
  }
} 