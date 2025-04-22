import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminService, User, UserProfile } from '../services/admin.service';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth/services/auth.service';

// Define role enum to match backend
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

@Component({
  selector: 'app-admin-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './admin-user-list.component.html',
  styleUrl: './admin-user-list.component.scss'
})
export class AdminUserListComponent implements OnInit {
  users: UserProfile[] = [];
  originalUsers: UserProfile[] = []; // Store original list for filtering
  loading = true;
  error = '';
  processingUserId: number | null = null;
  isStaffUser = false;
  
  // Selected user for modal
  selectedUser: UserProfile | null = null;
  modalVisible = false;
  
  // Form data for profile update
  profileUpdateData = {
    name: '',
    address: '',
    phoneNumber: ''
  };
  
  // Reset password data
  newPassword = '';
  
  // Sorting and filtering
  roleFilter: string | null = null;
  UserRole = UserRole; // Expose enum to template
  
  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private http: HttpClient
  ) {}
  
  ngOnInit(): void {
    // Check if current user is staff
    const currentUser = this.authService.currentUser;
    this.isStaffUser = currentUser?.role === 'STAFF';
    
    this.loadUsers();
  }
  
  loadUsers(): void {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.content) {
          this.originalUsers = response.data.content as UserProfile[];
          
          // If staff user, automatically filter to show only regular users
          if (this.isStaffUser) {
            this.users = this.originalUsers.filter(user => user.role === 'USER');
            this.roleFilter = 'USER';
          } else {
            this.users = [...this.originalUsers];
          }
        } else {
          this.error = response.message || 'Failed to load users';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load users';
        this.loading = false;
      }
    });
  }
  
  updateUserRole(userId: number, newRole: 'USER' | 'ADMIN' | 'STAFF'): void {
    // Only allow USER or ADMIN roles to be set
    if (newRole !== 'USER' && newRole !== 'ADMIN' && newRole !== 'STAFF') {
      return;
    }
    
    this.processingUserId = userId;
    
    this.adminService.updateUserRole(userId, newRole).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Update user in the local arrays
          const userIndex = this.users.findIndex(u => u.id === userId);
          const originalIndex = this.originalUsers.findIndex(u => u.id === userId);
          
          if (userIndex !== -1) {
            this.users[userIndex] = {
              ...this.users[userIndex],
              ...response.data
            };
          }
          
          if (originalIndex !== -1) {
            this.originalUsers[originalIndex] = {
              ...this.originalUsers[originalIndex],
              ...response.data
            };
          }
          
          // Reapply filter if active
          if (this.roleFilter) {
            this.filterByRole(this.roleFilter);
          }
        } else {
          this.error = response.message || 'Failed to update user role';
        }
        this.processingUserId = null;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update user role';
        this.processingUserId = null;
      }
    });
  }
  
  // Filter users by role
  filterByRole(role: string | null): void {
    // If staff user, only allow filtering to USER role or reset to USER role
    if (this.isStaffUser) {
      if (!role || role !== 'USER') {
        this.roleFilter = 'USER';
        this.users = this.originalUsers.filter(user => user.role === 'USER');
        return;
      }
    }
    
    this.roleFilter = role;
    
    if (!role) {
      // Reset to original list (but respect staff restrictions)
      if (this.isStaffUser) {
        this.users = this.originalUsers.filter(user => user.role === 'USER');
      } else {
        this.users = [...this.originalUsers];
      }
    } else {
      // Filter by selected role
      this.users = this.originalUsers.filter(user => 
        user.role.toUpperCase() === role.toUpperCase()
      );
    }
  }
  
  // Sort users by role
  sortByRole(): void {
    this.users = [...this.users].sort((a, b) => {
      return this.getRolePriority(a.role) - this.getRolePriority(b.role);
    });
  }
  
  // Get role priority for sorting (ADMIN -> STAFF -> USER)
  getRolePriority(role: string): number {
    switch (role.toUpperCase()) {
      case UserRole.ADMIN:
        return 1;
      case UserRole.STAFF:
        return 2;
      case UserRole.USER:
        return 3;
      default:
        return 99; // Unknown role
    }
  }
  
  // Sort users by account status
  sortByStatus(): void {
    this.users = [...this.users].sort((a, b) => {
      if (a.accountLocked === b.accountLocked) {
        // If lock status is the same, sort by account status
        return a.accountStatus.localeCompare(b.accountStatus);
      }
      // Locked accounts come last
      return a.accountLocked ? 1 : -1;
    });
  }
  
  // Reset all filters and sorting
  resetFilters(): void {
    if (this.isStaffUser) {
      // Staff can only see users with role USER
      this.roleFilter = 'USER';
      this.users = this.originalUsers.filter(user => user.role === 'USER');
    } else {
      this.roleFilter = null;
      this.users = [...this.originalUsers];
    }
  }
  
  getAlternateRole(currentRole: 'USER' | 'ADMIN' | 'STAFF'): 'USER' | 'ADMIN' | 'STAFF' {
    // If the role is STAFF, return ADMIN as alternate
    if (currentRole === 'STAFF') {
      return 'ADMIN';
    }
    // Otherwise toggle between USER and ADMIN
    return currentRole === 'USER' ? 'ADMIN' : 'USER';
  }
  
  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }
  
  // Open user details modal
  openUserModal(user: UserProfile): void {
    this.selectedUser = user;
    // Set initial values for the form
    this.profileUpdateData = {
      name: user.name,
      address: user.address || '',
      phoneNumber: user.phoneNumber || '',
    };
    this.modalVisible = true;
  }
  
  // Close the modal
  closeModal(): void {
    this.modalVisible = false;
    this.selectedUser = null;
    this.newPassword = '';
  }
  
  // Update user profile
  updateUserProfile(): void {
    if (!this.selectedUser) return;
    
    this.processingUserId = this.selectedUser.id;
    
    this.adminService.updateUserProfile(this.selectedUser.id, this.profileUpdateData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Update user in both arrays
          const userIndex = this.users.findIndex(u => u.id === this.selectedUser!.id);
          const originalIndex = this.originalUsers.findIndex(u => u.id === this.selectedUser!.id);
          
          if (userIndex !== -1) {
            this.users[userIndex] = {
              ...this.users[userIndex],
              ...response.data
            };
          }
          
          if (originalIndex !== -1) {
            this.originalUsers[originalIndex] = {
              ...this.originalUsers[originalIndex],
              ...response.data
            };
          }
          
          this.selectedUser = response.data;
        } else {
          this.error = response.message || 'Failed to update user profile';
        }
        this.processingUserId = null;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update user profile';
        this.processingUserId = null;
      }
    });
  }
  
  // Toggle user account lock
  toggleAccountLock(): void {
    if (!this.selectedUser) return;
    
    this.processingUserId = this.selectedUser.id;
    
    this.adminService.toggleUserAccountLock(this.selectedUser.id).subscribe({
      next: (response) => {
        if (response.success) {
          // Update the locked status in the local user object
          if (this.selectedUser) {
            this.selectedUser.accountLocked = !this.selectedUser.accountLocked;
            
            // Update user in both arrays
            const userIndex = this.users.findIndex(u => u.id === this.selectedUser!.id);
            const originalIndex = this.originalUsers.findIndex(u => u.id === this.selectedUser!.id);
            
            if (userIndex !== -1) {
              this.users[userIndex] = {
                ...this.users[userIndex],
                accountLocked: this.selectedUser.accountLocked
              };
            }
            
            if (originalIndex !== -1) {
              this.originalUsers[originalIndex] = {
                ...this.originalUsers[originalIndex],
                accountLocked: this.selectedUser.accountLocked
              };
            }
          }
        } else {
          this.error = response.message || 'Failed to toggle account lock status';
        }
        this.processingUserId = null;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to toggle account lock status';
        this.processingUserId = null;
      }
    });
  }
  
  // Reset user password
  resetPassword(): void {
    if (!this.selectedUser || !this.newPassword) return;
    
    this.processingUserId = this.selectedUser.id;
    
    this.adminService.resetUserPassword(this.selectedUser.id, this.newPassword).subscribe({
      next: (response) => {
        if (response.success) {
          // Show success message
          alert('Password reset successfully');
          this.newPassword = '';
        } else {
          this.error = response.message || 'Failed to reset password';
        }
        this.processingUserId = null;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to reset password';
        this.processingUserId = null;
      }
    });
  }
}
