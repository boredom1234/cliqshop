import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, AdminProfile } from '../services/admin.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-admin-profile-list',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  template: `
    <div class="admin-profiles-container">
      <div class="admin-profiles-header">
        <h1>Admin Profiles</h1>
        <p>View and manage all administrator accounts</p>
      </div>
      
      <div class="admin-profiles-content" *ngIf="adminProfiles.length > 0">
        <div class="profiles-table-container">
          <table class="profiles-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Last Login</th>
                <th>Created At</th>
                <th>Managed Users</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let profile of adminProfiles">
                <td>{{ profile.id }}</td>
                <td>{{ profile.name }}</td>
                <td>{{ profile.email }}</td>
                <td>{{ profile.lastLogin ? (profile.lastLogin | date:'short') : 'Never' }}</td>
                <td>{{ profile.createdAt | date:'mediumDate' }}</td>
                <td>{{ profile.managedUsersCount || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="empty-state" *ngIf="!isLoading && adminProfiles.length === 0">
        <p>No admin profiles found.</p>
      </div>
      
      <div class="loading" *ngIf="isLoading">
        Loading admin profiles...
      </div>
      
      <div class="error-container" *ngIf="error">
        <p>{{ error }}</p>
        <button (click)="loadAdminProfiles()">Try Again</button>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;
    
    .admin-profiles-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .admin-profiles-header {
      margin-bottom: $spacing-xl;
      
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
    
    .profiles-table-container {
      overflow-x: auto;
      background: $color-white;
      border: 1px solid $color-gray-200;
    }
    
    .profiles-table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: $spacing-md;
        text-align: left;
        border-bottom: 1px solid $color-gray-200;
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
    
    .empty-state, .loading, .error-container {
      text-align: center;
      padding: $spacing-xl;
      background: $color-white;
      border: 1px solid $color-gray-200;
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
  `]
})
export class AdminProfileListComponent implements OnInit {
  adminProfiles: AdminProfile[] = [];
  isLoading = true;
  error: string | null = null;
  
  constructor(private adminService: AdminService) {}
  
  ngOnInit(): void {
    this.loadAdminProfiles();
  }
  
  loadAdminProfiles(): void {
    this.isLoading = true;
    this.error = null;
    
    this.adminService.getAllAdminProfiles().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.adminProfiles = response.data;
        } else {
          this.error = response.message || 'Failed to load admin profiles.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading admin profiles:', err);
        this.error = err.error?.message || 'An error occurred while loading admin profiles. Please try again.';
      }
    });
  }
} 