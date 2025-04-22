import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, StaffMember } from '../services/admin.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-admin-staff-list',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  template: `
    <div class="staff-list-container">
      <div class="staff-list-header">
        <div>
          <h1>Staff Management</h1>
          <p>View and manage staff accounts</p>
        </div>
        <a routerLink="/admin/staff/add" class="add-staff-btn">Add New Staff</a>
      </div>
      
      <div class="staff-list-content" *ngIf="staffMembers.length > 0">
        <div class="staff-table-container">
          <table class="staff-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let staff of staffMembers">
                <td>{{ staff.id }}</td>
                <td>{{ staff.name }}</td>
                <td>{{ staff.email }}</td>
                <td>
                  <div class="permissions-list">
                    <span class="permission-tag" *ngFor="let permission of staff.permissions.slice(0, 2)">
                      {{ formatPermission(permission) }}
                    </span>
                    <span class="more-permissions" *ngIf="staff.permissions.length > 2">
                      +{{ staff.permissions.length - 2 }} more
                    </span>
                  </div>
                </td>
                <td>
                  <div class="action-buttons">
                    <a [routerLink]="['/admin/staff', staff.id]" class="action-btn view-btn">View</a>
                    <button class="action-btn delete-btn" (click)="confirmDelete(staff)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="empty-state" *ngIf="!isLoading && staffMembers.length === 0">
        <p>No staff members found.</p>
        <a routerLink="/admin/staff/add" class="add-staff-btn">Add Staff Member</a>
      </div>
      
      <div class="loading" *ngIf="isLoading">
        Loading staff members...
      </div>
      
      <div class="error-container" *ngIf="error">
        <p>{{ error }}</p>
        <button (click)="loadStaffMembers()">Try Again</button>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showDeleteModal" (click)="cancelDelete()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete the staff member <strong>{{ staffToDelete?.name }}</strong>?</p>
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
    
    .staff-list-container {
      max-width: 100%;
      width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
      overflow-x: hidden;
    }
    
    .staff-list-header {
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
      }
      
      p {
        color: $color-gray-600;
      }
      
      @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
        
        a {
          width: 100%;
          box-sizing: border-box;
          text-align: center;
        }
      }
    }
    
    .add-staff-btn {
      display: inline-block;
      background: $color-black;
      color: $color-white;
      border: 1px solid $color-black;
      padding: $spacing-sm $spacing-md;
      text-decoration: none;
      transition: all 0.2s;
      font-family: $font-primary;
      
      &:hover {
        background: transparent;
        color: $color-black;
      }
    }
    
    .staff-list-content {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
    
    .staff-table-container {
      overflow-x: auto;
      background: $color-white;
      border: 1px solid $color-gray-200;
      width: 100%;
      max-width: 100%;
      margin-bottom: 30px;
      box-sizing: border-box;
    }
    
    .staff-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 650px;
      table-layout: fixed;
      
      th, td {
        padding: $spacing-md;
        text-align: left;
        border-bottom: 1px solid $color-gray-200;
        white-space: normal;
        overflow-wrap: break-word;
        word-wrap: break-word;
        word-break: break-word;
      }
      
      th {
        background: $color-gray-100;
        font-weight: 500;
        color: $color-gray-700;
        position: sticky;
        top: 0;
      }
      
      tr:last-child td {
        border-bottom: none;
      }
      
      tr:hover td {
        background: $color-gray-100;
      }
    }
    
    .permissions-list {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-xs;
      max-width: 100%;
    }
    
    .permission-tag {
      font-size: $font-size-xs;
      background: $color-gray-200;
      color: $color-gray-800;
      padding: 2px 6px;
      border-radius: 3px;
      margin-bottom: 4px;
      display: inline-block;
    }
    
    .more-permissions {
      font-size: $font-size-xs;
      color: $color-gray-600;
      margin-top: 4px;
    }
    
    .action-buttons {
      display: flex;
      gap: $spacing-sm;
      flex-wrap: wrap;
    }
    
    .action-btn {
      font-size: $font-size-sm;
      padding: 4px 8px;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      border: none;
      background: none;
      white-space: nowrap;
      margin-bottom: 5px;
      
      &.view-btn {
        color: $color-black;
        border: 1px solid $color-black;
        
        &:hover {
          background: $color-black;
          color: $color-white;
        }
      }
      
      &.delete-btn {
        color: $danger-color;
        border: 1px solid $danger-color;
        
        &:hover {
          background: color.adjust($danger-color, $lightness: -10%);
        }
      }
    }
    
    .empty-state, .loading, .error-container {
      text-align: center;
      padding: $spacing-xl;
      background: $color-white;
      border: 1px solid $color-gray-200;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      margin-bottom: 20px;
    }
    
    .empty-state {
      p {
        margin-bottom: $spacing-md;
      }
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
      width: calc(100% - 280px);
      margin-left: 280px;
      
      @media (max-width: $breakpoint-md) {
        width: 100%;
        margin-left: 0;
      }
    }
    
    .modal-container {
      background: $color-white;
      padding: $spacing-lg;
      max-width: 400px;
      width: 100%;
      border: 1px solid $color-gray-300;
      
      h2 {
        font-family: $font-primary;
        font-size: $font-size-xl;
        margin-bottom: $spacing-md;
        font-weight: 400;
      }
      
      p {
        margin-bottom: $spacing-md;
        
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
export class AdminStaffListComponent implements OnInit {
  staffMembers: StaffMember[] = [];
  isLoading = true;
  error: string | null = null;
  
  // For delete confirmation
  showDeleteModal = false;
  staffToDelete: StaffMember | null = null;
  isDeleting = false;
  
  constructor(private adminService: AdminService) {}
  
  ngOnInit(): void {
    this.loadStaffMembers();
  }
  
  loadStaffMembers(): void {
    this.isLoading = true;
    this.error = null;
    
    this.adminService.getAllStaff().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.staffMembers = response.data;
        } else {
          this.error = response.message || 'Failed to load staff members.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading staff members:', err);
        this.error = 'An error occurred while loading staff members. Please try again.';
      }
    });
  }
  
  formatPermission(permission: string): string {
    return permission
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  
  confirmDelete(staff: StaffMember): void {
    this.staffToDelete = staff;
    this.showDeleteModal = true;
  }
  
  cancelDelete(): void {
    this.staffToDelete = null;
    this.showDeleteModal = false;
  }
  
  deleteStaff(): void {
    if (!this.staffToDelete || this.isDeleting) {
      return;
    }
    
    this.isDeleting = true;
    
    this.adminService.deleteStaff(this.staffToDelete.id).subscribe({
      next: (response) => {
        this.isDeleting = false;
        this.showDeleteModal = false;
        
        if (response.success) {
          // Remove the deleted staff member from the list
          this.staffMembers = this.staffMembers.filter(staff => staff.id !== this.staffToDelete?.id);
          this.staffToDelete = null;
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