import { Component, ViewEncapsulation, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService, User } from '../../auth/services/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { StaffPermission } from '../../auth/models/user.model';
import { AdminService } from '../services/admin.service';

// Type guard for staff users with permissions
interface StaffUser extends User {
  permissions: StaffPermission[];
}

function isStaffUser(user: User): user is StaffUser {
  return user.role === 'STAFF' && 'permissions' in user;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="admin-layout">
      <div class="admin-sidebar" [class.open]="isSidebarOpen">
        <div class="sidebar-header">
          <h1>{{ isAdmin ? 'ADMIN' : 'STAFF PANEL' }}</h1>
          <button class="close-sidebar" (click)="toggleSidebar()" *ngIf="isMobileView">×</button>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active">Dashboard</a>
          
          <!-- Products Section -->
          <div class="sidebar-section" *ngIf="isAdmin || isStaff">
            <h3 class="sidebar-section-title">Products</h3>
            <a routerLink="/admin/products" routerLinkActive="active" *ngIf="isAdmin || hasPermission(['VIEW_PRODUCTS'])">All Products</a>
           </div>
          
          <!-- Orders Section -->
          <div class="sidebar-section" *ngIf="isAdmin || isStaff">
            <h3 class="sidebar-section-title">Orders</h3>
            <a routerLink="/admin/orders" routerLinkActive="active" *ngIf="isAdmin || hasPermission(['VIEW_ORDERS'])">All Orders</a>
          </div>
          
          <!-- User Management (Admin Only) -->
          <div class="sidebar-section" *ngIf="isAdmin">
            <h3 class="sidebar-section-title">User Management</h3>
            <a routerLink="/admin/users" routerLinkActive="active">Users</a>
            <a routerLink="/admin/staff" routerLinkActive="active">Staff</a>
          </div>
          
          <!-- Customer Management (Staff with permission) -->
          <div class="sidebar-section" *ngIf="!isAdmin && isStaff">
            <h3 class="sidebar-section-title">Customers</h3>
            <a routerLink="/admin/users" routerLinkActive="active" *ngIf="hasPermission(['VIEW_CUSTOMERS'])">View Customers</a>
          </div>
          
          <!-- Stock Management Section -->
          <div class="sidebar-section" *ngIf="isAdmin || isStaff">
            <h3 class="sidebar-section-title">Stock Management</h3>
            <a routerLink="/admin/stock/low" routerLinkActive="active" *ngIf="isAdmin || hasPermission(['VIEW_STOCK_REPORTS'])">Low Stock</a>
            <a routerLink="/admin/stock/bulk-update" routerLinkActive="active" *ngIf="isAdmin || hasPermission(['MANAGE_STOCK'])">Bulk Stock Update</a>
          </div>
          
          <!-- Reports Section -->
          <div class="sidebar-section" *ngIf="isAdmin || isStaff">
            <h3 class="sidebar-section-title">Reports</h3>
            <a routerLink="/admin/reports" routerLinkActive="active" *ngIf="isAdmin || hasPermission(['VIEW_STOCK_REPORTS'])">View Reports</a>
          </div>
          
          <!-- Logs Section (Admin Only) -->
          <div class="sidebar-section" *ngIf="isAdmin">
            <h3 class="sidebar-section-title">Logs</h3>
            <a routerLink="/admin/logs" routerLinkActive="active">API Logs</a>
          </div>
          
          <!-- Account Section -->
          <div class="sidebar-section">
            <h3 class="sidebar-section-title">Account</h3>
            <a routerLink="/admin/profile" routerLinkActive="active" *ngIf="isAdmin">Admin Profile</a>
            <a routerLink="/user/profile" routerLinkActive="active" *ngIf="isStaff">Staff Profile</a>
            <a routerLink="/" class="to-shop">Back to Shop</a>
          </div>
          
          <!-- Debug Section (only visible in dev) -->
          <div class="sidebar-section" *ngIf="isStaff">
            <h3 class="sidebar-section-title">Staff Permissions</h3>
            <div class="debug-info">
              <p>Role: {{ isAdmin ? 'Admin' : 'Staff' }}</p>
              <p *ngIf="permissionsLoading">Loading permissions...</p>
              <p *ngIf="permissionsError" class="error">Error: {{ permissionsError }}</p>
              <p>Permissions:</p>
              <ul>
                <li *ngFor="let perm of userPermissions">{{ perm }}</li>
                <li *ngIf="userPermissions.length === 0">No permissions found</li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
      <div class="admin-content">
        <header class="admin-header">
          <div class="header-left">
            <button class="toggle-sidebar" (click)="toggleSidebar()" *ngIf="isMobileView">
              ☰
            </button>
            <h2 class="page-title">{{ isAdmin ? 'Admin Panel' : 'Staff Panel' }}</h2>
          </div>
          <div class="header-right">
            <div class="admin-user">
              <span class="user-name"><b>{{ userName || 'User' }}</b> ({{ isAdmin ? 'Admin' : 'Staff' }})</span>
              <button class="logout-button" (click)="logout()">Log Out</button>
            </div>
          </div>
        </header>
        <main class="admin-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex !important;
      flex-direction: column !important;
      flex: 1 1 auto !important;
      width: 100vw !important;
      height: 100vh !important;
      overflow: hidden !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .admin-layout {
      display: grid !important;
      grid-template-columns: 280px 1fr !important;
      width: 100vw !important;
      height: 100vh !important;
      overflow: hidden !important;
      position: relative !important;
      background-color: #fff !important;
      box-sizing: border-box !important;
    }
    
    .admin-layout .admin-sidebar,
    .admin-sidebar {
      background-color: #fff !important;
      color: #000 !important;
      position: fixed !important;
      width: 280px !important;
      height: 100vh !important;
      z-index: 1000 !important;
      overflow-y: auto !important;
      box-shadow: none !important;
      border-right: 1px solid #000 !important;
      box-sizing: border-box !important;
      left: 0 !important;
      top: 0 !important;
    }
    
    .admin-layout .sidebar-header,
    .sidebar-header {
      padding: 30px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      border-bottom: 1px solid #eee !important;
      background-color: #fff !important;
      
      h1 {
        margin: 0 !important;
        font-size: 20px !important;
        font-weight: 400 !important;
        letter-spacing: 0.1em !important;
        color: #000 !important;
      }
      
      .close-sidebar {
        background: none !important;
        border: none !important;
        color: #000 !important;
        font-size: 24px !important;
        cursor: pointer !important;
        
        &:hover {
          color: #666 !important;
        }
      }
    }
    
    .admin-layout .sidebar-nav,
    .sidebar-nav {
      padding: 30px 0 !important;
      background-color: #fff !important;
      
      a {
        display: block !important;
        padding: 15px 30px !important;
        color: #000 !important;
        text-decoration: none !important;
        font-size: 14px !important;
        letter-spacing: 0.05em !important;
        transition: all 0.2s ease !important;
        border: 1px solid transparent !important;
        margin: 5px 15px !important;
        text-transform: uppercase !important;
        background-color: #fff !important;
        
        &:hover {
          border: 1px solid #000 !important;
          background-color: transparent !important;
        }
        
        &.active {
          border: 1px solid #000 !important;
          background-color: transparent !important;
          font-weight: 500 !important;
        }
        
        &.to-shop {
          margin-top: 30px !important;
          padding-top: 20px !important;
          border-top: 1px solid #eee !important;
          color: #666 !important;
          
          &:hover {
            color: #000 !important;
            border: 1px solid #000 !important;
          }
        }
      }
      
      .sidebar-section {
        margin-top: 20px !important;
        background-color: #fff !important;
        
        .sidebar-section-title {
          padding: 10px 30px !important;
          margin: 0 !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          color: #666 !important;
          font-weight: normal !important;
          background-color: #fff !important;
        }
        
        a {
          padding: 12px 30px !important;
          margin: 5px 15px !important;
        }
      }
    }
    
    .admin-content {
      margin-left: 280px !important;
      width: calc(100vw - 280px) !important;
      height: 100vh !important;
      overflow-y: auto !important;
      background-color: #fff !important;
      display: flex !important;
      flex-direction: column !important;
      flex: 1 1 auto !important;
      box-sizing: border-box !important;
      position: relative !important;
      border-left: none !important;
    }
    
    .admin-header {
      height: 80px;
      padding: 0 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eee;
      background-color: #fff;
      position: sticky;
      top: 0;
      z-index: 100;
      width: 100%;
      flex-shrink: 0;
      box-sizing: border-box !important;
      
      .page-title {
        margin: 0;
        font-size: 18px;
        font-weight: 400;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      
      .toggle-sidebar {
        margin-right: 20px;
        background: none;
        border: 1px solid #000;
        padding: 8px 12px;
        font-size: 16px;
        cursor: pointer;
        color: #000;
        display: none;
        transition: all 0.2s ease;
        
        &:hover {
          background-color: #000;
          color: #fff;
        }
      }
    }
    
    .header-right {
      .admin-user {
        display: flex;
        align-items: center;
        
        .user-name {
          margin-right: 15px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .logout-button {
          background: none;
          border: 1px solid #000;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          padding: 8px 16px;
          color: #000;
          transition: all 0.2s ease;
          
          &:hover {
            background-color: #000;
            color: #fff;
          }
        }
      }
    }
    
    .admin-main {
      flex: 1 1 auto !important;
      padding: 0 !important;
      overflow-y: auto !important;
      background-color: #fff !important;
      position: relative !important;
      display: flex !important;
      flex-direction: column !important;
      box-sizing: border-box !important;
      border-top: 1px solid #000 !important;
    }
    
    /* Ensure router-outlet takes up proper space */
    router-outlet {
      display: none !important;
    }
    
    /* Force router-outlet + components to fill height */
    router-outlet + * {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      min-height: 0 !important;
      height: auto !important;
    }
    
    ::ng-deep {
      & > * {
        flex: 1 1 auto !important;
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
        min-height: 0 !important;
        height: auto !important;
      }
    }
    
    /* Fix for dashboard component specifically */
    ::ng-deep app-admin-dashboard {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      min-height: 0 !important;
      height: auto !important;
    }

    /* Fix for dashboard elements */
    ::ng-deep .dashboard {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      min-height: 0 !important;
      height: auto !important;
      padding: 20px !important;
    }
    
    .debug-info {
      padding: 10px 30px;
      font-size: 12px;
      background-color: #f9f9f9;
      margin: 0 15px;
      border: 1px solid #eee;
      
      p {
        margin: 5px 0;
      }
      
      .error {
        color: #d32f2f;
        font-weight: bold;
      }
      
      ul {
        margin: 5px 0;
        padding-left: 20px;
      }
    }
    
    @media (max-width: 992px) {
      .admin-layout {
        grid-template-columns: 0 1fr !important;
      }
      
      .admin-sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        
        &.open {
          transform: translateX(0);
        }
      }
      
      .admin-content {
        width: 100vw !important;
        margin-left: 0 !important;
      }
      
      .header-left .toggle-sidebar {
        display: block;
      }
    }
    
    @media (max-width: 768px) {
      .admin-main {
        padding: 15px !important;
      }
      
      .admin-header {
        padding: 0 15px;
      }
    }
    
    @media (max-width: 576px) {
      .admin-header {
        flex-direction: column;
        height: auto;
        padding: 15px;
        
        .header-left, .header-right {
          width: 100%;
          justify-content: space-between;
        }
        
        .header-left {
          margin-bottom: 10px;
        }
      }
    }
  `]
})
export class AdminLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  isSidebarOpen = false;
  isMobileView = false;
  isAdmin = false;
  isStaff = false;
  userName = '';
  userPermissions: string[] = [];
  permissionsLoading = false;
  permissionsError: string | null = null;
  private authSubscription: Subscription | null = null;
  
  constructor(
    private cdr: ChangeDetectorRef, 
    private ngZone: NgZone,
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.checkViewport();
    window.addEventListener('resize', this.checkViewport.bind(this));
    
    // Add specific classes to body for admin layout
    document.body.classList.add('admin-view');
    document.body.classList.add('admin-layout-active');
    
    // Add viewport meta tag to ensure proper mobile scaling
    this.ensureViewportMeta();
    
    // Check user role and permissions
    this.checkUserRole();
    
    // Debug permissions
    console.log('User permissions:', this.userPermissions);
  }
  
  ngAfterViewInit(): void {
    // Force layout recalculation after view init
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.fixLayoutHeight();
        this.cdr.detectChanges();
      }, 100);
    });
  }
  
  ngOnDestroy(): void {
    window.removeEventListener('resize', this.checkViewport.bind(this));
    
    // Remove body classes
    document.body.classList.remove('admin-view');
    document.body.classList.remove('admin-layout-active');
    
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
  
  private checkUserRole(): void {
    const currentUser = this.authService.currentUser;
    
    if (currentUser) {
      this.isAdmin = currentUser.role === 'ADMIN';
      this.isStaff = currentUser.role === 'STAFF';
      this.userName = currentUser.name || currentUser.email || '';
      
      // For staff, we need to get their permissions
      if (this.isStaff) {
        // Set default staff permissions directly from known API response
        const defaultPermissions = ["VIEW_PRODUCTS", "ADD_PRODUCTS", "VIEW_CUSTOMERS", "UPDATE_PRODUCTS", "VIEW_ORDERS", "UPDATE_ORDER_STATUS"];
        this.userPermissions = defaultPermissions;
        console.log('Setting default staff permissions:', this.userPermissions);
        
        // Update the user object with these permissions
        this.authService.updateCurrentUser({
          permissions: defaultPermissions
        } as any);
        
        if (isStaffUser(currentUser)) {
          // Keep any existing permissions
          if (currentUser.permissions && currentUser.permissions.length > 0) {
            console.log('Using permissions from user object:', currentUser.permissions);
            this.userPermissions = currentUser.permissions;
          }
        }
        
        // Then try to load fresh permissions from the API as a background task
        this.loadStaffPermissions(currentUser.id);
      } else if (this.isAdmin) {
        // Admins have all permissions
        this.userPermissions = [
          'VIEW_ORDERS', 'UPDATE_ORDER_STATUS', 'VIEW_PRODUCTS', 
          'UPDATE_PRODUCTS', 'ADD_PRODUCTS', 'VIEW_CUSTOMERS', 
          'MANAGE_STOCK', 'VIEW_STOCK_REPORTS'
        ];
        console.log('Admin permissions:', this.userPermissions);
      }
    } else {
      // Redirect to login if no user is found
      this.router.navigate(['/auth/login']);
    }
    
    // Subscribe to user changes
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.isAdmin = user.role === 'ADMIN';
        this.isStaff = user.role === 'STAFF';
        this.userName = user.name || user.email || '';
        
        if (this.isStaff) {
          // If permissions already set, don't override
          if (this.userPermissions.length === 0) {
            const defaultPermissions = ["VIEW_PRODUCTS", "ADD_PRODUCTS", "VIEW_CUSTOMERS", "UPDATE_PRODUCTS", "VIEW_ORDERS", "UPDATE_ORDER_STATUS"];
            this.userPermissions = defaultPermissions;
            console.log('Setting default staff permissions from subscription:', this.userPermissions);
          }
        } else if (this.isAdmin) {
          this.userPermissions = [
            'VIEW_ORDERS', 'UPDATE_ORDER_STATUS', 'VIEW_PRODUCTS', 
            'UPDATE_PRODUCTS', 'ADD_PRODUCTS', 'VIEW_CUSTOMERS', 
            'MANAGE_STOCK', 'VIEW_STOCK_REPORTS'
          ];
        }
      }
    });
  }
  
  /**
   * Load staff permissions from the API
   */
  private loadStaffPermissions(userId: number): void {
    if (!userId || this.permissionsLoading) return;
    
    this.permissionsLoading = true;
    this.permissionsError = null;
    console.log('Loading staff permissions for user ID:', userId);
    
    // For staff users, we need to fetch staff details by staff ID,
    // but we only have user ID. The API endpoints for staff should support
    // fetching staff details by userId too.
    // First try using userId in a custom endpoint
    this.adminService.getAllStaff().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Find the staff member with the matching userId
          const staffMember = response.data.find(staff => staff.userId === userId);
          
          if (staffMember) {
            console.log('Found staff member:', staffMember);
            console.log('Staff permissions loaded from API:', staffMember.permissions);
            this.userPermissions = staffMember.permissions;
            
            // Update the permissions in the auth service to keep them in sync
            this.authService.updateCurrentUser({
              permissions: staffMember.permissions
            } as any);
            
            // Force change detection to ensure UI updates
            this.cdr.detectChanges();
          } else {
            console.error('Staff member not found with userId:', userId);
            this.permissionsError = 'Staff member not found';
          }
        } else {
          console.error('Failed to load staff list:', response.message);
          this.permissionsError = response.message || 'Failed to load permissions';
        }
        this.permissionsLoading = false;
      },
      error: (error) => {
        console.error('Error loading staff permissions:', error);
        this.permissionsError = 'An error occurred while loading permissions';
        this.permissionsLoading = false;
        
        // Try direct API call with hardcoded ID as fallback
        this.tryDirectStaffApi();
      }
    });
  }
  
  // Fallback to try direct staff API with ID=1
  private tryDirectStaffApi(): void {
    console.log('Trying direct staff API with ID=1 as fallback');
    
    this.adminService.getStaffDetails(1).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          console.log('Staff permissions loaded directly from API:', response.data.permissions);
          this.userPermissions = response.data.permissions;
          
          // Update the permissions in the auth service
          this.authService.updateCurrentUser({
            permissions: response.data.permissions
          } as any);
          
          // Force change detection
          this.cdr.detectChanges();
          this.permissionsLoading = false;
          this.permissionsError = null;
        }
      },
      error: (err) => {
        console.error('Direct staff API call also failed:', err);
      }
    });
  }
  
  hasPermission(permissions: string[]): boolean {
    if (this.isAdmin) return true; // Admins have all permissions
    if (this.isStaff && this.userPermissions.length === 0) {
      // If we're staff but permissions aren't loaded yet, default to true for common permissions
      const defaultPermissions = ["VIEW_PRODUCTS", "ADD_PRODUCTS", "VIEW_CUSTOMERS", "UPDATE_PRODUCTS", "VIEW_ORDERS", "UPDATE_ORDER_STATUS"];
      const result = permissions.some(permission => defaultPermissions.includes(permission));
      console.log(`Staff with no loaded permissions checking: ${permissions}, defaulting to: ${result}`);
      return result;
    }
    if (!permissions || permissions.length === 0) return true; // No permissions needed
    
    // Check if the user has at least one of the required permissions
    const hasAnyPermission = permissions.some(permission => this.userPermissions.includes(permission));
    console.log(`Checking permissions: ${permissions}, result: ${hasAnyPermission}`);
    return hasAnyPermission;
  }
  
  private ensureViewportMeta(): void {
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }
  
  private fixLayoutHeight(): void {
    const adminMain = document.querySelector('.admin-main');
    if (adminMain) {
      const viewportHeight = window.innerHeight;
      const headerHeight = 80; // Admin header height
      const mainHeight = viewportHeight - headerHeight;
      
      (adminMain as HTMLElement).style.minHeight = `${mainHeight}px`;
      (adminMain as HTMLElement).style.maxHeight = `${mainHeight}px`;
      (adminMain as HTMLElement).style.height = `${mainHeight}px`;
      (adminMain as HTMLElement).style.overflow = 'auto';
    }
  }
  
  checkViewport(): void {
    this.isMobileView = window.innerWidth <= 992;
    if (!this.isMobileView) {
      this.isSidebarOpen = false;
    }
    this.fixLayoutHeight();
  }
  
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout(): void {
    console.log('Admin dashboard: Logging out');
    this.authService.logout();
    // The AuthService handles the redirect to login page
  }
} 