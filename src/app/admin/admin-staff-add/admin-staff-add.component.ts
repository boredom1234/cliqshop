import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { AdminService, StaffPermission } from '../services/admin.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-admin-staff-add',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  template: `
    <div class="staff-add-container">
      <div class="staff-add-header">
        <h1>Add Staff Member</h1>
        <p>Create a new staff account with specific permissions</p>
      </div>
      
      <div class="staff-add-content">
        <div class="form-container">
          <form [formGroup]="staffForm" (ngSubmit)="onSubmit()">
            <div class="form-section">
              <h2>Account Information</h2>
              
              <div class="form-group">
                <label for="email">Email Address <span class="required">*</span></label>
                <input type="email" id="email" formControlName="email">
                <div class="error-message" *ngIf="staffForm.get('email')?.invalid && staffForm.get('email')?.touched">
                  <span *ngIf="staffForm.get('email')?.errors?.['required']">Email is required</span>
                  <span *ngIf="staffForm.get('email')?.errors?.['email']">Please enter a valid email address</span>
                </div>
              </div>
              
              <div class="form-group">
                <label for="password">Password <span class="required">*</span></label>
                <input type="password" id="password" formControlName="password">
                <div class="error-message" *ngIf="staffForm.get('password')?.invalid && staffForm.get('password')?.touched">
                  <span *ngIf="staffForm.get('password')?.errors?.['required']">Password is required</span>
                  <span *ngIf="staffForm.get('password')?.errors?.['minlength']">Password must be at least 8 characters</span>
                </div>
              </div>
              
              <div class="form-group">
                <label for="name">Full Name <span class="required">*</span></label>
                <input type="text" id="name" formControlName="name">
                <div class="error-message" *ngIf="staffForm.get('name')?.invalid && staffForm.get('name')?.touched">
                  Name is required
                </div>
              </div>
              
              <div class="form-group">
                <label for="address">Address</label>
                <input type="text" id="address" formControlName="address">
              </div>
              
              <div class="form-group">
                <label for="phoneNumber">Phone Number</label>
                <input type="text" id="phoneNumber" formControlName="phoneNumber">
                <div class="error-message" *ngIf="staffForm.get('phoneNumber')?.invalid && staffForm.get('phoneNumber')?.touched">
                  Please enter a valid phone number
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <h2>Staff Permissions</h2>
              <p class="section-info">Select the permissions this staff member should have:</p>
              
              <div class="permissions-grid" formArrayName="permissions">
                <div class="permission-card" *ngFor="let permission of availablePermissions; let i = index">
                  <label class="permission-label">
                    <div class="checkbox-container">
                      <input type="checkbox" [formControlName]="i">
                    </div>
                    <div class="permission-content">
                      <span class="permission-name">{{ formatPermission(permission) }}</span>
                      <span class="permission-description">{{ getPermissionDescription(permission) }}</span>
                    </div>
                  </label>
                </div>
              </div>
              
              <div class="error-message" *ngIf="!hasSelectedPermissions && staffForm.touched">
                Please select at least one permission
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="cancel-btn" routerLink="/admin/staff">Cancel</button>
              <button type="submit" [disabled]="staffForm.invalid || !hasSelectedPermissions || isSubmitting">
                {{ isSubmitting ? 'Adding Staff...' : 'Add Staff Member' }}
              </button>
            </div>
            
            <div class="error-container" *ngIf="error">
              <p>{{ error }}</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;
    
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      box-sizing: border-box;
    }
    
    .staff-add-container {
      max-width: 100%;
      width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
      overflow-x: hidden;
    }
    
    .staff-add-header {
      margin-bottom: $spacing-xl;
      width: 100%;
      box-sizing: border-box;
      
      h1 {
        font-family: $font-primary;
        font-size: $font-size-3xl;
        font-weight: 400;
        margin-bottom: $spacing-xs;
      }
      
      p {
        color: $color-gray-600;
      }
    }
    
    .staff-add-content {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
    
    .form-container {
      background: $color-white;
      border: 1px solid $color-gray-200;
      padding: $spacing-lg;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
    
    .form-section {
      margin-bottom: $spacing-xl;
      width: 100%;
      box-sizing: border-box;
      
      h2 {
        font-size: $font-size-lg;
        margin-bottom: $spacing-md;
        padding-bottom: $spacing-sm;
        border-bottom: 1px solid $color-gray-200;
        font-weight: 500;
      }
      
      .section-info {
        color: $color-gray-600;
        font-size: $font-size-sm;
        margin-bottom: $spacing-md;
      }
    }
    
    .form-group {
      margin-bottom: $spacing-md;
      width: 100%;
      box-sizing: border-box;
      
      label {
        display: block;
        margin-bottom: $spacing-xs;
        font-weight: 500;
        color: $color-gray-700;
        
        .required {
          color: $danger-color;
        }
      }
      
      input {
        width: 100%;
        padding: $spacing-sm;
        border: 1px solid $color-gray-300;
        transition: border-color 0.2s;
        box-sizing: border-box;
        
        &:focus {
          outline: none;
          border-color: $color-black;
        }
      }
    }
    
    .permissions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: $spacing-md;
      width: 100%;
      box-sizing: border-box;
    }
    
    .permission-card {
      height: 100%;
      box-sizing: border-box;
      
      .permission-label {
        display: flex;
        cursor: pointer;
        padding: $spacing-md;
        border: 1px solid $color-gray-200;
        border-radius: 4px;
        transition: all 0.2s;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        
        &:hover {
          background: $color-gray-100;
          border-color: $color-gray-300;
        }
      }
      
      .checkbox-container {
        margin-right: $spacing-sm;
        
        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin: 0;
          cursor: pointer;
        }
      }
      
      .permission-content {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      
      .permission-name {
        font-weight: 500;
        margin-bottom: $spacing-xs;
      }
      
      .permission-description {
        font-size: $font-size-sm;
        color: $color-gray-600;
      }
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: $spacing-md;
      width: 100%;
      box-sizing: border-box;
      
      @media (max-width: 768px) {
        flex-direction: column;
        
        button {
          width: 100%;
          margin-bottom: 10px;
        }
      }
      
      button {
        padding: $spacing-sm $spacing-md;
        cursor: pointer;
        transition: all 0.2s;
        font-family: $font-primary;
      }
      
      .cancel-btn {
        background: $color-white;
        color: $color-gray-700;
        border: 1px solid $color-gray-300;
        
        &:hover {
          background: $color-gray-100;
        }
      }
      
      button[type="submit"] {
        background: $color-black;
        color: $color-white;
        border: 1px solid $color-black;
        
        &:hover:not(:disabled) {
          background: transparent;
          color: $color-black;
        }
        
        &:disabled {
          background: $color-gray-300;
          border-color: $color-gray-300;
          color: $color-gray-600;
          cursor: not-allowed;
        }
      }
    }
    
    .error-message {
      color: $danger-color;
      font-size: $font-size-sm;
      margin-top: $spacing-xs;
    }
    
    .error-container {
      margin-top: $spacing-lg;
      padding: $spacing-md;
      border: 1px solid $danger-color;
      color: $danger-color;
      background-color: rgba($danger-color, 0.05);
      width: 100%;
      box-sizing: border-box;
    }
  `]
})
export class AdminStaffAddComponent {
  staffForm: FormGroup;
  isSubmitting = false;
  error: string | null = null;
  
  readonly availablePermissions: StaffPermission[] = [
    'VIEW_ORDERS',
    'UPDATE_ORDER_STATUS',
    'VIEW_PRODUCTS',
    'UPDATE_PRODUCTS',
    'ADD_PRODUCTS',
    'VIEW_CUSTOMERS',
    'MANAGE_STOCK',
    'VIEW_STOCK_REPORTS'
  ];
  
  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private router: Router
  ) {
    this.staffForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      name: ['', Validators.required],
      address: [''],
      phoneNumber: ['', [Validators.pattern(/^\+?[0-9\s-()]+$/)]],
      permissions: this.buildPermissionsArray()
    });
  }
  
  private buildPermissionsArray(): FormArray {
    return this.fb.array(
      this.availablePermissions.map(() => new FormControl(false))
    );
  }
  
  get permissionsFormArray(): FormArray {
    return this.staffForm.get('permissions') as FormArray;
  }
  
  get hasSelectedPermissions(): boolean {
    return this.permissionsFormArray.controls.some(control => control.value === true);
  }
  
  formatPermission(permission: StaffPermission): string {
    return permission
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  
  getPermissionDescription(permission: StaffPermission): string {
    const descriptions: Record<StaffPermission, string> = {
      'VIEW_ORDERS': 'Can view order details and listings',
      'UPDATE_ORDER_STATUS': 'Can change order status (e.g., pending to shipped)',
      'VIEW_PRODUCTS': 'Can view detailed product information',
      'UPDATE_PRODUCTS': 'Can edit existing product details',
      'ADD_PRODUCTS': 'Can add new products',
      'VIEW_CUSTOMERS': 'Can view customer information',
      'MANAGE_STOCK': 'Can update product stock levels',
      'VIEW_STOCK_REPORTS': 'Can view stock level reports and low stock alerts'
    };
    
    return descriptions[permission];
  }
  
  onSubmit(): void {
    if (this.staffForm.invalid || !this.hasSelectedPermissions || this.isSubmitting) {
      return;
    }
    
    this.isSubmitting = true;
    this.error = null;
    
    // Extract selected permissions
    const selectedPermissions = this.availablePermissions.filter((_, i) => 
      this.permissionsFormArray.at(i).value
    );
    
    const staffData = {
      email: this.staffForm.value.email,
      password: this.staffForm.value.password,
      name: this.staffForm.value.name,
      address: this.staffForm.value.address,
      phoneNumber: this.staffForm.value.phoneNumber,
      permissions: selectedPermissions
    };
    
    this.adminService.registerStaff(staffData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          // Navigate to staff list page
          this.router.navigate(['/admin/staff']);
        } else {
          this.error = response.message || 'Failed to register staff member.';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error registering staff:', err);
        this.error = err.error?.message || 'An error occurred while registering the staff member. Please try again.';
      }
    });
  }
} 