import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService, AdminProfile } from '../services/admin.service';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  template: `
    <div class="admin-profile-layout">
      <!-- Sidebar navigation -->
      <aside class="profile-sidebar">
        <div class="profile-sidebar__header">My Admin Account</div>
        <nav class="profile-sidebar__nav">
          <a routerLink="/admin/profile" routerLinkActive="active">Profile</a>
          <a routerLink="/admin/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/admin/users" routerLinkActive="active">Users</a>
          <a routerLink="/admin/products" routerLinkActive="active">Products</a>
          <a routerLink="/admin/orders" routerLinkActive="active">Orders</a>
          <a routerLink="/" class="back-to-site">Back to Shop</a>
        </nav>
      </aside>
      
      <!-- Main content area -->
      <div class="profile-content">
        <!-- Loading state -->
        <div *ngIf="!adminProfile && !error" class="loading">
          <div class="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
        
        <!-- Error message -->
        <div *ngIf="error" class="error-container">
          <p>{{ error }}</p>
          <button (click)="loadProfile()">Try Again</button>
        </div>
        
        <!-- Profile content when loaded -->
        <div *ngIf="adminProfile" class="profile-dashboard">
          <!-- Success message -->
          <div *ngIf="updateSuccess" class="alert alert-success">
            Profile updated successfully!
          </div>
          
          <!-- Account Information Card -->
          <div class="profile-card">
            <div class="profile-section">
              <h2>Account Information</h2>
              <div class="profile-details">
                <div class="detail-row">
                  <span class="detail-label">Full Name</span>
                  <span class="detail-value">{{ adminProfile.name }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">{{ adminProfile.email }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phone Number</span>
                  <span class="detail-value">{{ adminProfile.phoneNumber || 'Not set' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Address</span>
                  <span class="detail-value">{{ adminProfile.address || 'Not set' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Account Type</span>
                  <span class="detail-value">{{ adminProfile.role }}</span>
                </div>
                <!-- <div class="detail-row">
                  <span class="detail-label">Last Login</span>
                  <span class="detail-value">{{ adminProfile.lastLogin ? (adminProfile.lastLogin | date:'medium') : 'N/A' }}</span>
                </div> -->
              </div>
            </div>
          </div>
          
          <!-- Activity Statistics Card -->
          <div class="profile-card">
            <div class="profile-section">
              <h2>Activity Statistics</h2>
              <div class="profile-details">
                <div class="detail-row">
                  <span class="detail-label">Managed Users</span>
                  <span class="detail-value">{{ adminProfile.managedUsersCount || 0 }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Created Products</span>
                  <span class="detail-value">{{ adminProfile.createdProductsCount || 0 }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Processed Orders</span>
                  <span class="detail-value">{{ adminProfile.processedOrdersCount || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Edit Profile Form -->
          <div class="profile-card">
            <div class="profile-section">
              <h2>Edit Profile</h2>
              <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="profile-form">
                <div class="form-group">
                  <label for="name">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    formControlName="name" 
                    class="form-control"
                    [ngClass]="{'is-invalid': profileForm.get('name')?.invalid && profileForm.get('name')?.touched}"
                  >
                  <div *ngIf="profileForm.get('name')?.invalid && profileForm.get('name')?.touched" class="error-message">
                    Name is required
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="address">Address</label>
                  <input 
                    type="text" 
                    id="address" 
                    formControlName="address" 
                    class="form-control"
                  >
                </div>
                
                <div class="form-group">
                  <label for="phoneNumber">Phone Number</label>
                  <input 
                    type="text" 
                    id="phoneNumber" 
                    formControlName="phoneNumber" 
                    class="form-control"
                    [ngClass]="{'is-invalid': profileForm.get('phoneNumber')?.invalid && profileForm.get('phoneNumber')?.touched}"
                  >
                  <div *ngIf="profileForm.get('phoneNumber')?.invalid && profileForm.get('phoneNumber')?.touched" class="error-message">
                    Please enter a valid phone number
                  </div>
                </div>
                
                <div class="form-actions">
                  <button type="submit" class="btn-primary" [disabled]="profileForm.invalid || isSubmitting">
                    {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #fff;
      z-index: 1000;
    }
    
    .admin-profile-layout {
      display: flex;
      height: 100vh;
      width: 100vw;
      position: absolute;
      top: 0;
      left: 0;
      background-color: #f9f9f9;
    }
    
    /* Sidebar styles */
    .profile-sidebar {
      background: #fff;
      color: #000;
      padding: 0;
      width: 250px;
      min-width: 250px;
      height: 100%;
      position: sticky;
      top: 0;
      overflow-y: auto;
      border-right: 1px solid #000;
      align-self: flex-start;
    }
    
    .profile-sidebar__header {
      padding: 30px;
      font-size: 18px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-bottom: 1px solid #000;
      color: #000;
      height: 72px;
      display: flex;
      align-items: center;
    }
    
    .profile-sidebar__nav {
      display: flex;
      flex-direction: column;
      padding: 30px 0;
    
      a {
        color: #000;
        text-decoration: none;
        padding: 15px 30px;
        transition: all 0.2s ease;
        border-left: 3px solid transparent;
        font-size: 14px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
    
        &:hover, &.active {
          background: rgba(0, 0, 0, 0.05);
          color: #000;
          border-left: 3px solid #000;
          font-weight: 500;
        }
    
        &.back-to-site {
          margin-top: 30px;
          color: #666;
          font-size: 12px;
        }
      }
    }
    
    /* Content area */
    .profile-content {
      flex: 1;
      padding: 30px;
      background-color: #fff;
      overflow-y: auto;
      height: 100vh;
    }
    
    /* Loading spinner */
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      height: 400px;
    }
    
    .loading-spinner {
      border: 3px solid #eee;
      border-top: 3px solid #000;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Profile dashboard */
    .profile-dashboard {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .profile-card {
      background: #fff;
      border: 1px solid #000;
      margin-bottom: 30px;
    }
    
    .profile-section {
      padding: 30px;
      
      h2 {
        font-size: 20px;
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-top: 0;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
      }
    }
    
    .profile-details {
      width: 100%;
    }
    
    .detail-row {
      display: flex;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f5f5f5;
      
      &:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }
    }
    
    .detail-label {
      flex: 0 0 30%;
      font-weight: 500;
      color: #666;
    }
    
    .detail-value {
      flex: 0 0 70%;
    }
    
    /* Form styles */
    .profile-form {
      width: 100%;
    }
    
    .form-group {
      margin-bottom: 20px;
      
      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        font-size: 14px;
      }
      
      .form-control {
        width: 100%;
        padding: 10px;
        border: 1px solid #000;
        font-size: 14px;
        
        &:focus {
          outline: none;
          border-color: #000;
        }
        
        &.is-invalid {
          border-color: #ff0000;
        }
      }
      
      .error-message {
        color: #ff0000;
        font-size: 12px;
        margin-top: 5px;
      }
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-start;
      margin-top: 20px;
    }
    
    .btn-primary {
      background-color: #000;
      color: #fff;
      border: 1px solid #000;
      padding: 10px 25px;
      text-transform: uppercase;
      font-size: 14px;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover:not(:disabled) {
        background-color: #fff;
        color: #000;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .alert {
      padding: 15px;
      margin-bottom: 20px;
      
      &.alert-success {
        background-color: rgba(0, 0, 0, 0.05);
        border: 1px solid #000;
        color: #000;
      }
    }
    
    .error-container {
      text-align: center;
      padding: 30px;
      background-color: #fff;
      border: 1px solid #000;
      
      p {
        margin-bottom: 20px;
        color: #ff0000;
      }
      
      button {
        background-color: #000;
        color: #fff;
        border: 1px solid #000;
        padding: 10px 20px;
        text-transform: uppercase;
        font-size: 14px;
        cursor: pointer;
        
        &:hover {
          background-color: #fff;
          color: #000;
        }
      }
    }
    
    /* Responsive styles */
    @media (max-width: 768px) {
      .admin-profile-layout {
        flex-direction: column;
      }
      
      .profile-sidebar {
        width: 100%;
        min-width: 100%;
        height: auto;
        position: relative;
      }
      
      .profile-content {
        padding: 20px;
        height: auto;
      }
      
      .profile-sidebar__header {
        padding: 20px;
      }
      
      .profile-sidebar__nav a {
        padding: 12px 20px;
      }
      
      .profile-section {
        padding: 20px;
      }
      
      .detail-row {
        flex-direction: column;
        
        .detail-label,
        .detail-value {
          flex: 0 0 100%;
        }
        
        .detail-label {
          margin-bottom: 5px;
        }
      }
    }
  `]
})
export class AdminProfileComponent implements OnInit {
  adminProfile: AdminProfile | null = null;
  profileForm: FormGroup;
  isSubmitting = false;
  updateSuccess = false;
  error: string | null = null;
  
  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      address: [''],
      phoneNumber: ['', [Validators.pattern(/^\+?[0-9\s-()]+$/)]]
    });
  }
  
  ngOnInit(): void {
    this.loadProfile();
  }
  
  loadProfile(): void {
    this.error = null;
    this.adminService.getCurrentAdminProfile().subscribe({
      next: (response) => {
        if (response.success) {
          this.adminProfile = response.data;
          this.profileForm.patchValue({
            name: this.adminProfile.name,
            address: this.adminProfile.address || '',
            phoneNumber: this.adminProfile.phoneNumber || ''
          });
        } else {
          this.error = response.message || 'Failed to load profile.';
        }
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.error = 'An error occurred while loading your profile. Please try again.';
      }
    });
  }
  
  onSubmit(): void {
    if (this.profileForm.invalid || !this.adminProfile) {
      return;
    }
    
    this.isSubmitting = true;
    this.updateSuccess = false;
    
    const updates = {
      name: this.profileForm.value.name,
      address: this.profileForm.value.address,
      phoneNumber: this.profileForm.value.phoneNumber
    };
    
    this.adminService.updateAdminProfile(this.adminProfile.id, updates).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.adminProfile = response.data;
          this.updateSuccess = true;
          
          // Reset the form to the updated values
          this.profileForm.patchValue({
            name: this.adminProfile.name,
            address: this.adminProfile.address || '',
            phoneNumber: this.adminProfile.phoneNumber || ''
          });
          
          // Clear success message after a delay
          setTimeout(() => {
            this.updateSuccess = false;
          }, 3000);
        } else {
          this.error = response.message || 'Failed to update profile.';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error updating profile:', err);
        this.error = err.error?.message || 'An error occurred while updating your profile. Please try again.';
      }
    });
  }
} 