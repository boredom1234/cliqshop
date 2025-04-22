import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { AdminService, StaffMember, StaffPermission } from '../services/admin.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-admin-staff-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  template: `
    <div class="staff-details-container" *ngIf="staffMember">
      <div class="staff-details-header">
        <div>
          <h1>Staff Details: {{ staffMember.name }}</h1>
          <p>View and manage staff permissions</p>
        </div>
        <div class="header-actions">
          <button class="delete-btn" (click)="confirmDelete()">Delete Staff</button>
          <button class="back-btn" routerLink="/admin/staff">Back to List</button>
        </div>
      </div>
      
      <div class="staff-details-content">
        <div class="staff-info">
          <div class="info-section">
            <h2>Account Information</h2>
            <div class="info-row">
              <div class="info-label">ID</div>
              <div class="info-value">{{ staffMember.id }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">User ID</div>
              <div class="info-value">{{ staffMember.userId }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Email</div>
              <div class="info-value">{{ staffMember.email }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Name</div>
              <div class="info-value">{{ staffMember.name }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Created By</div>
              <div class="info-value">Admin #{{ staffMember.createdBy }}</div>
            </div>
          </div>
          
          <div class="permissions-section">
            <h2>Permissions Management</h2>
            <p>Update the staff member's permissions:</p>
            
            <form [formGroup]="permissionsForm" (ngSubmit)="updatePermissions()">
              <div class="permissions-grid" formArrayName="permissions">
                <div class="permission-option" *ngFor="let permission of availablePermissions; let i = index">
                  <label>
                    <input type="checkbox" [formControlName]="i">
                    <span class="permission-name">{{ formatPermission(permission) }}</span>
                    <span class="permission-description">{{ getPermissionDescription(permission) }}</span>
                  </label>
                </div>
              </div>
              
              <div class="form-actions">
                <button type="submit" [disabled]="!hasPermissionsChanged || isUpdating">
                  {{ isUpdating ? 'Updating...' : 'Update Permissions' }}
                </button>
              </div>
              
              <div class="success-message" *ngIf="updateSuccess">
                Permissions updated successfully!
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    <div class="loading" *ngIf="!staffMember && !error">
      Loading staff details...
    </div>
    
    <div class="error-container" *ngIf="error">
      <p>{{ error }}</p>
      <button (click)="loadStaffDetails()">Try Again</button>
      <button routerLink="/admin/staff">Back to Staff List</button>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showDeleteModal" (click)="cancelDelete()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete the staff member <strong>{{ staffMember?.name }}</strong>?</p>
        <p class="warning">This action cannot be undone.</p>
        <div class="modal-actions">
          <button class="cancel-btn" (click)="cancelDelete()">Cancel</button>
          <button class="delete-btn" (click)="deleteStaff()">Delete</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;
    @use 'sass:color';
    
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      box-sizing: border-box;
    }
    
    .staff-details-container {
      max-width: 100%;
      width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
      overflow-x: hidden;
    }
    
    .staff-details-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: $spacing-xl;
      width: 100%;
      box-sizing: border-box;
      
      h1 {
        font-family: $font-primary;
        font-size: $font-size-3xl;
        font-weight: 400;
        margin-bottom: $spacing-xs;
        word-break: break-word;
      }
      
      p {
        color: $color-gray-600;
      }
      
      .header-actions {
        display: flex;
        gap: $spacing-sm;
        flex-wrap: wrap;
      }
      
      button {
        padding: $spacing-sm $spacing-md;
        cursor: pointer;
        transition: all 0.2s;
        font-family: $font-primary;
        white-space: nowrap;
        
        &.delete-btn {
          background: $color-white;
          color: $danger-color;
          border: 1px solid $danger-color;
          
          &:hover {
            background: color.adjust($danger-color, $lightness: -10%);
          }
        }
        
        &.back-btn {
          background: $color-black;
          color: $color-white;
          border: 1px solid $color-black;
          
          &:hover {
            background: transparent;
            color: $color-black;
          }
        }
      }
      
      @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
        
        .header-actions {
          width: 100%;
          
          button {
            flex: 1;
            text-align: center;
          }
        }
      }
    }
    
    .staff-details-content {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
    
    .staff-info {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
    
    .info-section {
      background: $color-white;
      padding: $spacing-lg;
      margin-bottom: $spacing-lg;
      border: 1px solid $color-gray-200;
      width: 100%;
      box-sizing: border-box;
      
      h2 {
        font-size: $font-size-lg;
        margin-bottom: $spacing-md;
        padding-bottom: $spacing-sm;
        border-bottom: 1px solid $color-gray-200;
        font-weight: 500;
      }
    }
    
    .info-row {
      display: flex;
      padding: $spacing-sm 0;
      border-bottom: 1px solid $color-gray-100;
      width: 100%;
      box-sizing: border-box;
      
      &:last-child {
        border-bottom: none;
      }
      
      @media (max-width: 576px) {
        flex-direction: column;
        
        .info-label, .info-value {
          flex: 0 0 100%;
          padding: 5px 0;
        }
      }
    }
    
    .info-label {
      flex: 0 0 40%;
      font-weight: 500;
      color: $color-gray-700;
    }
    
    .info-value {
      flex: 0 0 60%;
      word-break: break-word;
    }
    
    .permissions-section {
      background: $color-white;
      padding: $spacing-lg;
      border: 1px solid $color-gray-200;
      width: 100%;
      box-sizing: border-box;
      
      h2 {
        font-size: $font-size-lg;
        margin-bottom: $spacing-md;
        padding-bottom: $spacing-sm;
        border-bottom: 1px solid $color-gray-200;
        font-weight: 500;
      }
      
      p {
        color: $color-gray-600;
        margin-bottom: $spacing-md;
      }
    }
    
    .permissions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: $spacing-md;
      margin-bottom: $spacing-lg;
      width: 100%;
      box-sizing: border-box;
    }
    
    .permission-option {
      label {
        display: flex;
        flex-direction: column;
        cursor: pointer;
        padding: $spacing-md;
        border: 1px solid $color-gray-200;
        transition: all 0.2s;
        width: 100%;
        box-sizing: border-box;
        
        &:hover {
          background: $color-gray-100;
        }
        
        input[type="checkbox"] {
          width: auto;
          margin-bottom: $spacing-xs;
        }
        
        .permission-name {
          font-weight: 500;
          margin-bottom: $spacing-xs;
        }
        
        .permission-description {
          font-size: $font-size-sm;
          color: $color-gray-600;
          word-wrap: break-word;
        }
      }
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      width: 100%;
      box-sizing: border-box;
      
      button {
        background: $color-black;
        color: $color-white;
        border: 1px solid $color-black;
        padding: $spacing-sm $spacing-md;
        cursor: pointer;
        transition: all 0.2s;
        font-family: $font-primary;
        
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
    
    .success-message {
      color: $success-color;
      margin-top: $spacing-md;
      text-align: center;
    }
    
    .loading, .error-container {
      text-align: center;
      padding: $spacing-xl;
      background: $color-white;
      border: 1px solid $color-gray-200;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
    
    .error-container {
      p {
        color: $danger-color;
        margin-bottom: $spacing-md;
      }
      
      button {
        background: $color-black;
        color: $color-white;
        border: 1px solid $color-black;
        padding: $spacing-sm $spacing-md;
        cursor: pointer;
        transition: all 0.2s;
        font-family: $font-primary;
        margin: 0 $spacing-xs;
        
        &:hover {
          background: transparent;
          color: $color-black;
        }
      }
    }
    
    // Modal styles
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: $z-index-modal;
    }
    
    .modal-container {
      background: $color-white;
      padding: $spacing-lg;
      max-width: 400px;
      width: 100%;
      border: 1px solid $color-gray-300;
      margin: 0 15px;
      box-sizing: border-box;
      
      h2 {
        font-family: $font-primary;
        font-size: $font-size-xl;
        margin-bottom: $spacing-md;
        font-weight: 400;
      }
      
      p {
        margin-bottom: $spacing-md;
        word-wrap: break-word;
        
        &.warning {
          color: $danger-color;
          font-size: $font-size-sm;
        }
      }
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: $spacing-md;
      
      @media (max-width: 480px) {
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
        
        &.cancel-btn {
          background: $color-white;
          color: $color-gray-700;
          border: 1px solid $color-gray-300;
          
          &:hover {
            background: $color-gray-100;
          }
        }
        
        &.delete-btn {
          background: $danger-color;
          color: $color-white;
          border: 1px solid $danger-color;
          
          &:hover {
            background: color.adjust($danger-color, $lightness: -10%);
          }
        }
      }
    }
  `]
})
export class AdminStaffDetailsComponent implements OnInit {
  staffId: number | null = null;
  staffMember: StaffMember | null = null;
  error: string | null = null;
  
  // For permissions form
  permissionsForm: FormGroup;
  isUpdating = false;
  updateSuccess = false;
  
  // For delete confirmation
  showDeleteModal = false;
  isDeleting = false;
  
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
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.permissionsForm = this.fb.group({
      permissions: this.buildPermissionsArray()
    });
  }
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.staffId = +id;
        this.loadStaffDetails();
      } else {
        this.error = 'Staff ID is missing.';
      }
    });
  }
  
  private buildPermissionsArray(): FormArray {
    return this.fb.array(
      this.availablePermissions.map(() => new FormControl(false))
    );
  }
  
  get permissionsFormArray(): FormArray {
    return this.permissionsForm.get('permissions') as FormArray;
  }
  
  get originalPermissions(): boolean[] {
    return this.availablePermissions.map(permission => 
      this.staffMember?.permissions.includes(permission) || false
    );
  }
  
  get hasPermissionsChanged(): boolean {
    if (!this.staffMember) return false;
    
    return this.permissionsFormArray.controls.some((control, i) => 
      control.value !== this.originalPermissions[i]
    );
  }
  
  loadStaffDetails(): void {
    if (!this.staffId) return;
    
    this.error = null;
    this.adminService.getStaffDetails(this.staffId).subscribe({
      next: (response) => {
        if (response.success) {
          this.staffMember = response.data;
          
          // Set permissions form values based on staff permissions
          this.availablePermissions.forEach((permission, i) => {
            this.permissionsFormArray.at(i).setValue(
              this.staffMember?.permissions.includes(permission) || false
            );
          });
        } else {
          this.error = response.message || 'Failed to load staff details.';
        }
      },
      error: (err) => {
        console.error('Error loading staff details:', err);
        this.error = 'An error occurred while loading staff details. Please try again.';
      }
    });
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
  
  updatePermissions(): void {
    if (!this.staffId || !this.staffMember || !this.hasPermissionsChanged || this.isUpdating) {
      return;
    }
    
    this.isUpdating = true;
    this.updateSuccess = false;
    
    // Extract selected permissions
    const selectedPermissions = this.availablePermissions.filter((_, i) => 
      this.permissionsFormArray.at(i).value
    );
    
    this.adminService.updateStaffPermissions(this.staffId, selectedPermissions).subscribe({
      next: (response) => {
        this.isUpdating = false;
        if (response.success) {
          this.staffMember = response.data;
          this.updateSuccess = true;
          
          // Clear success message after a delay
          setTimeout(() => {
            this.updateSuccess = false;
          }, 3000);
        } else {
          this.error = response.message || 'Failed to update permissions.';
        }
      },
      error: (err) => {
        this.isUpdating = false;
        console.error('Error updating permissions:', err);
        this.error = 'An error occurred while updating permissions. Please try again.';
      }
    });
  }
  
  confirmDelete(): void {
    this.showDeleteModal = true;
  }
  
  cancelDelete(): void {
    this.showDeleteModal = false;
  }
  
  deleteStaff(): void {
    if (!this.staffId || this.isDeleting) {
      return;
    }
    
    this.isDeleting = true;
    
    this.adminService.deleteStaff(this.staffId).subscribe({
      next: (response) => {
        this.isDeleting = false;
        this.showDeleteModal = false;
        
        if (response.success) {
          // Navigate back to staff list
          this.router.navigate(['/admin/staff']);
        } else {
          this.error = response.message || 'Failed to delete staff member.';
        }
      },
      error: (err) => {
        this.isDeleting = false;
        this.showDeleteModal = false;
        console.error('Error deleting staff member:', err);
        this.error = 'An error occurred while deleting the staff member. Please try again.';
      }
    });
  }
} 