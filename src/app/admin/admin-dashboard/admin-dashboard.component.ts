import { Component, OnInit, AfterViewInit, ElementRef, Renderer2, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { catchError, forkJoin, of } from 'rxjs';
import { Order } from '../../order/services/order.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DashboardChartsComponent } from './dashboard-charts/dashboard-charts.component';

// Define interfaces for dashboard data
interface DashboardOrder {
  id: number;
  customerName: string;
  total: number;
  createdAt: string;
  status: string;
}

interface ActivityItem {
  type: string;
  text: string;
  time: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DashboardChartsComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: [
    './admin-dashboard-stability.css', // Add stability CSS first
    './admin-dashboard.component.scss'
  ]
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  totalProducts = 0;
  totalOrders = 0;
  totalUsers = 0;
  recentOrders: DashboardOrder[] = [];
  isLoading = true;
  errorMessage = '';
  private styleElement: HTMLStyleElement | null = null;
  private mainDashboard: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // New statistics properties
  activeCustomers = 0;
  averageOrderValue = 0;
  cancelledOrders = 0;
  confirmedOrders = 0;
  conversionRate = 0;
  dailyRevenue = 0;
  deliveredOrders = 0;
  lowStockProducts = 0;
  monthlyRevenue = 0;
  newCustomersThisMonth = 0;
  ordersByDay: Record<string, number> = {};
  ordersByMonth: Record<string, number> = {};
  outOfStockProducts = 0;
  pendingOrders = 0;
  revenueByDay: Record<string, number> = {};
  revenueByMonth: Record<string, number> = {};
  shippedOrders = 0;
  topCustomers: Array<{
    id: number;
    name: string;
    email: string;
    orderCount: number;
    totalSpent: number;
  }> = [];
  topSellingProducts: Array<{
    id: number;
    name: string;
    imageUrl: string;
    totalQuantity: number;
    totalRevenue: number;
  }> = [];
  weeklyRevenue = 0;
  totalRevenue = 0;
  totalUsersCount = 0;
  totalCustomers = 0;
  usersByRole: Record<string, number> = {};

  constructor(
    private adminService: AdminService,
    private router: Router,
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {
    console.log('AdminDashboardComponent constructor called');
  }

  ngOnInit(): void {
    console.log('AdminDashboardComponent initialized');
    this.setupDashboardVisibility();
    this.addPermanentStyles();
    
    // Add stability class to help with height retention
    document.body.classList.add('admin-dashboard-active');
    
    // Add visibility classes to fix white screen issue
    document.body.classList.add('admin-page');
    document.body.classList.add('admin-dashboard-page');
    
    // Ensure no emergency dashboard is visible
    this.hideEmergencyDashboard();
    
    // Load dashboard data after a short delay
    setTimeout(() => this.loadDashboardData(), 100);
    
    // Set up periodic style enforcement during loading
    const enforceInterval = setInterval(() => {
      this.enforceStyles();
    }, 100);

    // Clear interval after 10 seconds
    setTimeout(() => {
      clearInterval(enforceInterval);
    }, 10000);
  }

  ngAfterViewInit(): void {
    console.log('AdminDashboardComponent view initialized');
    this.enforceStyles();
    
    // Hide emergency dashboard if present
    this.hideEmergencyDashboard();
    
    // Direct style fix for the host and dashboard elements
    this.fixNegativeMinHeight();
    
    // Wait for dashboard to render completely
    setTimeout(() => {
      this.mainDashboard = this.elementRef.nativeElement.querySelector('.dashboard');
      
      if (this.mainDashboard) {
        // Observe size changes to prevent shrinking
        this.setupResizeObserver();
        
        // Lock the height in place - fix min-height calculation
        const viewportHeight = window.innerHeight;
        const minHeight = Math.max(
          viewportHeight - 140, 
          this.mainDashboard.offsetHeight
        );
        
        this.renderer.setStyle(this.mainDashboard, 'min-height', `${minHeight}px`);
        
        // Apply direct inline style
        this.mainDashboard.style.minHeight = `${minHeight}px`;
      }
      
      // Re-apply direct style fix
      this.fixNegativeMinHeight();
    }, 200);
    
    // Multiple attempts to ensure visibility and hide emergency dashboard
    [100, 300, 500, 1000, 2000, 5000].forEach(timing => {
      setTimeout(() => {
        this.enforceStyles();
        this.hideEmergencyDashboard();
        this.fixNegativeMinHeight();
      }, timing);
    });
  }
  
  private hideEmergencyDashboard(): void {
    const emergencyDashboard = document.querySelector('.emergency-dashboard');
    if (emergencyDashboard) {
      (emergencyDashboard as HTMLElement).style.display = 'none';
    }
  }
  
  private setupResizeObserver(): void {
    if (!this.mainDashboard || typeof ResizeObserver === 'undefined') return;
    
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        const viewportHeight = window.innerHeight;
        
        // If height is shrinking below our threshold, enforce min-height
        if (height < viewportHeight - 140) {
          this.renderer.setStyle(
            this.mainDashboard, 
            'min-height', 
            `${viewportHeight - 140}px`
          );
        }
      }
    });
    
    this.resizeObserver.observe(this.mainDashboard);
  }

  ngOnDestroy(): void {
    // Clean up the resize observer
    if (this.resizeObserver && this.mainDashboard) {
      this.resizeObserver.unobserve(this.mainDashboard);
      this.resizeObserver.disconnect();
    }
    
    // Remove any added styles
    if (this.styleElement && document.head.contains(this.styleElement)) {
      document.head.removeChild(this.styleElement);
    }
    
    // Remove added body classes
    document.body.classList.remove('admin-dashboard-active');
    document.body.classList.remove('admin-page');
    document.body.classList.remove('admin-dashboard-page');
  }

  private addPermanentStyles(): void {
    if (this.styleElement) {
      document.head.removeChild(this.styleElement);
    }

    this.styleElement = document.createElement('style');
    this.styleElement.setAttribute('id', 'dashboard-permanent-styles');
    this.styleElement.textContent = `
      /* Hide emergency dashboard */
      .emergency-dashboard {
        display: none !important;
      }
    
      /* Ensure dashboard container maintains height during and after data load */
      .dashboard {
        min-height: calc(100vh - 140px) !important; /* Correct calculation */
        height: auto !important;
        display: block !important;
        position: relative !important;
        z-index: 10 !important;
        box-sizing: border-box !important;
        padding: 20px !important;
        overflow-x: hidden !important;
        background-color: #fff !important;
        width: 100% !important;
        max-width: 100% !important;
      }

      /* Ensure content remains visible during data loading */
      app-admin-dashboard {
        display: block !important;
        min-height: calc(100vh - 140px) !important; /* Correct calculation */
        height: auto !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      
      /* Ensure stats grid maintains layout after data load */
      .stats-grid {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 30px !important;
        width: 100% !important;
        max-width: 100% !important;
        margin-bottom: 50px !important;
        min-height: 200px !important;
        box-sizing: border-box !important;
      }
      
      /* Ensure recent orders section maintains height */
      .recent-orders {
        min-height: 300px !important;
        border: 1px solid #000 !important;
        padding: 30px !important;
        margin-bottom: 40px !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      
      /* Styles for cards */
      .stats-card {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 140px !important;
        border: 1px solid #000 !important;
        padding: 40px 30px !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      
      /* Prevent flash of empty content */
      .dashboard:empty::before {
        content: "Loading dashboard..." !important;
        display: block !important;
        padding: 40px !important;
        text-align: center !important;
        color: #999 !important;
      }
      
      /* Table container */
      .table-container {
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: auto !important;
        box-sizing: border-box !important;
      }
      
      /* Fix for mobile views */
      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: 1fr !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        
        .dashboard {
          padding: 15px !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        
        .recent-orders {
          padding: 20px !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        
        .stats-card {
          width: 100% !important;
          max-width: 100% !important;
        }
      }
    `;

    document.head.appendChild(this.styleElement);
  }

  private enforceStyles(): void {
    const dashboard = this.elementRef.nativeElement.querySelector('.dashboard');
    if (!dashboard) return;
    
    // Hide emergency dashboard
    this.hideEmergencyDashboard();
    
    const viewportHeight = window.innerHeight;
    
    const styles = {
      'display': 'block',
      'visibility': 'visible',
      'opacity': '1',
      'width': '100%',
      'max-width': '100%',
      'min-height': `${viewportHeight - 140}px`, // Explicit calculation
      'padding': '20px',
      'margin': '0',
      'box-sizing': 'border-box',
      'overflow-x': 'hidden',
      'background': '#fff',
      'position': 'relative',
      'z-index': '10'
    };

    Object.entries(styles).forEach(([property, value]) => {
      this.renderer.setStyle(dashboard, property, value);
    });

    // Ensure the host component takes full height
    this.renderer.setStyle(
      this.elementRef.nativeElement, 
      'min-height', 
      `${viewportHeight - 140}px` // Explicit calculation
    );

    // Enforce styles on critical child elements 
    const selectors = [
      '.stats-grid', 
      '.stats-card', 
      '.recent-orders', 
      '.data-table',
      '.dashboard__title'
    ];
    
    selectors.forEach(selector => {
      const elements = dashboard.querySelectorAll(selector);
      elements.forEach((element: HTMLElement) => {
        this.renderer.setStyle(element, 'display', selector === '.stats-grid' ? 'grid' : 'block');
        this.renderer.setStyle(element, 'visibility', 'visible');
        this.renderer.setStyle(element, 'opacity', '1');
      });
    });
    
    // Force proper grid layout on stats-grid
    const statsGrid = dashboard.querySelector('.stats-grid');
    if (statsGrid) {
      this.renderer.setStyle(statsGrid, 'display', 'grid');
      this.renderer.setStyle(statsGrid, 'grid-template-columns', 'repeat(3, 1fr)');
      this.renderer.setStyle(statsGrid, 'width', '100%');
      this.renderer.setStyle(statsGrid, 'min-height', '200px');
      
      // Apply styles to each stats card
      const statCards = statsGrid.querySelectorAll('.stats-card');
      statCards.forEach((card: HTMLElement) => {
        this.renderer.setStyle(card, 'display', 'flex');
        this.renderer.setStyle(card, 'flex-direction', 'column');
        this.renderer.setStyle(card, 'align-items', 'center');
        this.renderer.setStyle(card, 'min-height', '140px');
      });
    }
  }

  loadDashboardData(): void {
    // Apply styles before changing the loading state
    this.enforceStyles();
    this.fixNegativeMinHeight();
    
    // Store the current height before data loading
    const dashboard = this.elementRef.nativeElement.querySelector('.dashboard');
    let initialHeight = 0;
    
    if (dashboard) {
      initialHeight = Math.max(dashboard.offsetHeight, window.innerHeight - 140);
      // Lock the height in place before loading
      dashboard.style.minHeight = `${initialHeight}px`;
    }
    
    this.isLoading = true;
    
    // Add logging before making the API call
    console.log('Making API request to dashboard/statistics endpoint');
    
    // Get and log headers that will be used
    const authHeaders = this.adminService.getDebugAuthHeaders();
    console.log('Request headers to be used:', authHeaders);
    
    // Try to fetch dashboard statistics from the new endpoint
    this.adminService.getDashboardStatistics().subscribe({
      next: (response) => {
        console.log('Dashboard statistics response:', response);
        
        if (response.success && response.data) {
          // Set total counts
          this.totalProducts = response.data.totalProducts || 0;
          this.totalOrders = response.data.totalOrders || 0;
          this.totalUsers = response.data.totalUsersCount || response.data.totalUsers || 0;
          
          // Set new statistics
          this.activeCustomers = response.data.activeCustomers || 0;
          this.averageOrderValue = response.data.averageOrderValue || 0;
          this.cancelledOrders = response.data.cancelledOrders || 0;
          this.confirmedOrders = response.data.confirmedOrders || 0;
          this.conversionRate = response.data.conversionRate || 0;
          this.dailyRevenue = response.data.dailyRevenue || 0;
          this.deliveredOrders = response.data.deliveredOrders || 0;
          this.lowStockProducts = response.data.lowStockProducts || 0;
          this.monthlyRevenue = response.data.monthlyRevenue || 0;
          this.newCustomersThisMonth = response.data.newCustomersThisMonth || 0;
          this.ordersByDay = response.data.ordersByDay || {};
          this.ordersByMonth = response.data.ordersByMonth || {};
          this.outOfStockProducts = response.data.outOfStockProducts || 0;
          this.pendingOrders = response.data.pendingOrders || 0;
          this.revenueByDay = response.data.revenueByDay || {};
          this.revenueByMonth = response.data.revenueByMonth || {};
          this.shippedOrders = response.data.shippedOrders || 0;
          this.topCustomers = response.data.topCustomers || [];
          this.topSellingProducts = response.data.topSellingProducts || [];
          this.weeklyRevenue = response.data.weeklyRevenue || 0;
          this.totalRevenue = response.data.totalRevenue || 0;
          this.totalCustomers = response.data.totalCustomers || 0;
          this.usersByRole = response.data.usersByRole || {};
          
          // Build recent orders from API data if available
          this.recentOrders = [];
          
          // Store the values in localStorage for other admin components to access
          localStorage.setItem('admin_dashboard_stats', JSON.stringify({
            totalProducts: this.totalProducts,
            totalOrders: this.totalOrders,
            totalUsers: this.totalUsers,
            activeCustomers: this.activeCustomers,
            monthlyRevenue: this.monthlyRevenue,
            weeklyRevenue: this.weeklyRevenue,
            dailyRevenue: this.dailyRevenue,
            totalRevenue: this.totalRevenue,
            totalCustomers: this.totalCustomers
          }));
          
          this.errorMessage = '';
        } else {
          this.errorMessage = response.message || 'Failed to load dashboard statistics';
          console.error('Error in dashboard statistics response:', response);
          
          // Fallback to older methods if needed
          this.loadDashboardWithFallback(dashboard, initialHeight);
          return;
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
        
        // Apply styles again after loading is complete
        this.enforceStyles();
        this.fixNegativeMinHeight();
        this.hideEmergencyDashboard();
        
        // Re-apply height to dashboard element after data is loaded
        if (dashboard) {
          // Ensure height doesn't shrink below initial height
          const currentHeight = dashboard.offsetHeight;
          const finalHeight = Math.max(initialHeight, currentHeight, window.innerHeight - 140);
          
          dashboard.style.minHeight = `${finalHeight}px`;
          dashboard.style.height = 'auto';
          dashboard.style.width = '100%';
          dashboard.style.maxWidth = '100%';
          dashboard.style.display = 'block';
        }
      },
      error: (error) => {
        console.error('Error loading dashboard statistics:', error);
        this.errorMessage = `Failed to load dashboard data: ${error.status} - ${error.statusText}`;
        
        // Fallback to older methods
        this.loadDashboardWithFallback(dashboard, initialHeight);
      }
    });
  }

  // Use the working endpoint as a fallback
  private loadDashboardWithFallback(dashboardElement: HTMLElement | null, initialHeight: number): void {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const headers = token 
      ? { headers: new HttpHeaders({ 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` }) } 
      : {};
    
    // Make parallel requests to get both user and product statistics
    forkJoin({
      userStats: this.http.get('http://localhost:5000/api/admin/users/statistics', headers),
      productStats: this.http.get('http://localhost:5000/api/admin/products', headers).pipe(
        catchError(error => {
          console.error('Error fetching product data:', error);
          return of(null);
        })
      ),
      orderStats: this.http.get('http://localhost:5000/api/admin/orders', headers).pipe(
        catchError(error => {
          console.error('Error fetching order data:', error);
          return of(null);
        })
      )
    }).subscribe({
      next: (responses) => {
        console.log('Fallback responses:', responses);
        
        // Process user statistics
        if (responses.userStats && (responses.userStats as any).success) {
          this.totalUsers = (responses.userStats as any).data.totalUsers || 0;
        } else {
          this.totalUsers = 0;
        }
        
        // Process product statistics
        if (responses.productStats && (responses.productStats as any).success) {
          const productResponse = responses.productStats as any;
          if (productResponse.data && productResponse.data.totalElements) {
            this.totalProducts = productResponse.data.totalElements;
          } else if (productResponse.data && productResponse.data.content) {
            this.totalProducts = productResponse.data.content.length;
          } else {
            this.totalProducts = 0;
          }
        } else {
          this.totalProducts = 0;
        }
        
        // Process order statistics
        if (responses.orderStats && (responses.orderStats as any).success) {
          const orderResponse = responses.orderStats as any;
          
          // Handle when data is a direct array (not in content/totalElements format)
          if (orderResponse.data && Array.isArray(orderResponse.data)) {
            this.totalOrders = orderResponse.data.length;
            
            // Get recent orders - sort by createdAt desc and take top 5
            if (orderResponse.data.length > 0) {
              const sortedOrders = [...orderResponse.data]
                .sort((a, b) => {
                  // Sort most recent first
                  const dateA = new Date(a.createdAt || 0).getTime();
                  const dateB = new Date(b.createdAt || 0).getTime();
                  return dateB - dateA;
                })
                .slice(0, 5);

              this.recentOrders = sortedOrders.map((order: any) => ({
                id: order.id,
                customerName: order.userName || 'Customer',
                total: order.totalAmount || 0,
                createdAt: order.createdAt || new Date().toISOString(),
                status: order.status || 'PENDING'
              }));
              
              console.log('Dashboard - Recent orders (from array):', this.recentOrders);
            }
          }
          // Handle when data has content/totalElements structure
          else if (orderResponse.data && orderResponse.data.totalElements) {
            this.totalOrders = orderResponse.data.totalElements;
          } else if (orderResponse.data && orderResponse.data.content) {
            this.totalOrders = orderResponse.data.content.length;
            
            // Get recent orders - sort by createdAt desc and take top 5
            if (orderResponse.data.content.length > 0) {
              const sortedOrders = [...orderResponse.data.content]
                .sort((a, b) => {
                  // Sort most recent first
                  const dateA = new Date(a.createdAt || 0).getTime();
                  const dateB = new Date(b.createdAt || 0).getTime();
                  return dateB - dateA;
                })
                .slice(0, 5);

              this.recentOrders = sortedOrders.map((order: any) => ({
                id: order.id,
                customerName: order.userName || 'Customer',
                total: order.totalAmount || 0,
                createdAt: order.createdAt || new Date().toISOString(),
                status: order.status || 'PENDING'
              }));
              
              console.log('Dashboard - Recent orders (from content):', this.recentOrders);
            }
          } else {
            this.totalOrders = 0;
          }
        } else {
          this.totalOrders = 0;
          this.recentOrders = [];
        }
        
        // Store the values in localStorage for other admin components to access
        localStorage.setItem('admin_dashboard_stats', JSON.stringify({
          totalProducts: this.totalProducts,
          totalOrders: this.totalOrders,
          totalUsers: this.totalUsers
        }));
        
        this.errorMessage = '';
        
        this.isLoading = false;
        this.cdr.detectChanges();
        
        // Apply styles again after loading is complete
        this.enforceStyles();
        this.fixNegativeMinHeight();
        this.hideEmergencyDashboard();
        
        // Re-apply height to dashboard element after data is loaded
        if (dashboardElement) {
          // Ensure height doesn't shrink below initial height
          const currentHeight = dashboardElement.offsetHeight;
          const finalHeight = Math.max(initialHeight, currentHeight, window.innerHeight - 140);
          
          dashboardElement.style.minHeight = `${finalHeight}px`;
          dashboardElement.style.height = 'auto';
          dashboardElement.style.width = '100%';
          dashboardElement.style.maxWidth = '100%';
          dashboardElement.style.display = 'block';
        }
      },
      error: (error) => {
        console.error('Error loading fallback data:', error);
        this.errorMessage = `Failed to load dashboard data: ${error.status} - ${error.statusText}`;
        
        this.totalProducts = 0;
        this.totalOrders = 0;
        this.totalUsers = 0;
        this.recentOrders = [];
        
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private setupDashboardVisibility(): void {
    // Add base styles to ensure dashboard is visible
    const baseStyles = document.createElement('style');
    baseStyles.textContent = `
      .dashboard {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        width: 100% !important;
        max-width: 100% !important;
        min-height: calc(100vh - 140px) !important;
        background: #fff !important;
        position: relative !important;
        z-index: 10 !important;
        padding: 20px !important;
      }
      
      /* Hide emergency dashboard */
      .emergency-dashboard {
        display: none !important;
      }
      
      /* When dashboard is loading */
      .dashboard.loading {
        min-height: calc(100vh - 140px) !important;
      }
    `;
    document.head.appendChild(baseStyles);
  }

  private fixNegativeMinHeight(): void {
    // Direct style fixes for the host element
    const hostElement = this.elementRef.nativeElement;
    if (hostElement) {
      const viewportHeight = window.innerHeight;
      const correctMinHeight = Math.max(viewportHeight - 140, hostElement.offsetHeight);
      
      // Set direct style on host element
      hostElement.style.minHeight = `${correctMinHeight}px`;
      hostElement.style.height = 'auto';
      hostElement.style.display = 'block';
      hostElement.style.width = '100%';
    }
    
    // Direct style fixes for the dashboard element
    const dashboardElement = this.elementRef.nativeElement.querySelector('.dashboard');
    if (dashboardElement) {
      const viewportHeight = window.innerHeight;
      const currentHeight = dashboardElement.offsetHeight;
      const correctMinHeight = Math.max(viewportHeight - 140, currentHeight);
      
      // Set direct style on dashboard element
      dashboardElement.style.minHeight = `${correctMinHeight}px`;
      dashboardElement.style.height = 'auto';
      dashboardElement.style.display = 'block';
      dashboardElement.style.width = '100%';
      dashboardElement.style.visibility = 'visible';
      dashboardElement.style.opacity = '1';
    }
    
    // Ensure emergency dashboard is hidden
    const emergencyDashboard = document.querySelector('.emergency-dashboard');
    if (emergencyDashboard) {
      (emergencyDashboard as HTMLElement).style.display = 'none';
      (emergencyDashboard as HTMLElement).style.visibility = 'hidden';
      (emergencyDashboard as HTMLElement).style.height = '0';
      (emergencyDashboard as HTMLElement).style.width = '0';
    }
  }

  checkBackendConnection(): void {
    this.http.get('/api/check-connection').subscribe(
      response => {
        console.log('Backend connection check:', response);
        if (response) {
          this.errorMessage = 'Connected to backend server';
        } else {
          this.errorMessage = 'Failed to connect to backend server';
        }
      },
      error => {
        console.error('Error checking backend connection:', error);
        this.errorMessage = 'An error occurred while checking backend connection';
      }
    );
  }

  // Debug methods for API testing
  testApiWithoutAuth(): void {
    console.log('Testing API without authentication...');
    // Make a request without auth headers
    this.http.get('http://localhost:5000/api/admin/dashboard/statistics').subscribe(
      response => {
        console.log('API response without auth:', response);
        this.errorMessage = 'API request without auth succeeded: ' + JSON.stringify(response);
      },
      error => {
        console.error('API error without auth:', error);
        this.errorMessage = `API request without auth failed: ${error.status} ${error.statusText}`;
        
        if (error.error) {
          this.errorMessage += ' - ' + JSON.stringify(error.error);
        }
      }
    );
  }

  testApiWithNewEndpoint(endpoint: string): void {
    console.log(`Testing API with alternative endpoint: ${endpoint}...`);
    // Get token from localStorage
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const headers = token 
      ? { headers: new HttpHeaders({ 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` }) } 
      : {};
    
    // Make a request to an alternative endpoint
    this.http.get(`http://localhost:5000${endpoint}`, headers).subscribe(
      response => {
        console.log('Alternative API response:', response);
        this.errorMessage = 'Alternative API request succeeded: ' + JSON.stringify(response);
      },
      error => {
        console.error('Alternative API error:', error);
        this.errorMessage = `Alternative API request failed: ${error.status} ${error.statusText}`;
        
        if (error.error) {
          this.errorMessage += ' - ' + JSON.stringify(error.error);
        }
      }
    );
  }

  clearTokenAndRetry(): void {
    console.log('Clearing auth token and retrying...');
    // Clear token temporarily
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    
    // Retry loading with a new token
    this.loadDashboardData();
    
    // Restore token after attempt
    setTimeout(() => {
      if (token) {
        if (localStorage.getItem('auth_token') === null) {
          localStorage.setItem('auth_token', token);
        } else if (localStorage.getItem('token') === null) {
          localStorage.setItem('token', token);
        }
        console.log('Auth token restored');
      }
    }, 3000);
  }

  testWorkingEndpoint(): void {
    console.log('Testing working endpoint from curl...');
    // Get token from localStorage
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const headers = token 
      ? { headers: new HttpHeaders({ 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` }) } 
      : {};
    
    // Make a request to the endpoint that worked with curl
    this.http.get('http://localhost:5000/api/admin/users/statistics', headers).subscribe(
      response => {
        console.log('Working endpoint response:', response);
        this.errorMessage = 'Users statistics endpoint succeeded: ' + JSON.stringify(response);
      },
      error => {
        console.error('Working endpoint error:', error);
        this.errorMessage = `Users statistics endpoint failed: ${error.status} ${error.statusText}`;
        
        if (error.error) {
          this.errorMessage += ' - ' + JSON.stringify(error.error);
        }
      }
    );
  }

  testWithFetch(): void {
    console.log('Testing dashboard statistics with fetch API...');
    // Get token from localStorage
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const authHeader = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
    
    // Use fetch API which is closer to curl in behavior
    fetch('http://localhost:5000/api/admin/dashboard/statistics', {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        // Try without Content-Type header to match curl behavior
      }
    })
    .then(response => {
      console.log('Fetch API response status:', response.status);
      console.log('Fetch API response headers:', response.headers);
      return response.json();
    })
    .then(data => {
      console.log('Fetch API data:', data);
      this.errorMessage = 'Fetch API succeeded: ' + JSON.stringify(data);
      
      // Update the dashboard with this data if it's valid
      if (data && data.success && data.data) {
        this.totalProducts = data.data.totalProducts || 0;
        this.totalOrders = data.data.totalOrders || 0;
        this.totalUsers = data.data.totalUsers || 0;
        
        // Process recent orders if available
        if (data.data.recentOrders && Array.isArray(data.data.recentOrders)) {
          this.recentOrders = data.data.recentOrders.map((order: any) => ({
            id: order.id,
            customerName: order.shippingAddress?.firstName + ' ' + order.shippingAddress?.lastName || 'Anonymous',
            total: order.summary.total,
            createdAt: order.createdAt,
            status: order.status
          }));
        }
        
        // Trigger change detection
        this.cdr.detectChanges();
      }
    })
    .catch(error => {
      console.error('Fetch API error:', error);
      this.errorMessage = `Fetch API failed: ${error.message}`;
    });
  }

  testWithCurlHeaders(): void {
    console.log('Testing dashboard with curl-like headers...');
    this.isLoading = true;
    
    this.adminService.getDashboardStatisticsWithSimpleHeaders().subscribe({
      next: (response) => {
        console.log('Curl-like headers response:', response);
        this.errorMessage = 'Curl-like headers request succeeded!';
        
        if (response.success) {
          // Update the dashboard data
          this.totalProducts = response.data.totalProducts;
          this.totalOrders = response.data.totalOrders;
          this.totalUsers = response.data.totalUsers;
          
          // Process recent orders
          this.recentOrders = response.data.recentOrders.map((order: Order) => ({
            id: order.id,
            customerName: order.shippingAddress?.firstName + ' ' + order.shippingAddress?.lastName || 'Anonymous',
            total: order.summary.total,
            createdAt: order.createdAt,
            status: order.status
          }));
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Curl-like headers error:', error);
        this.errorMessage = `Curl-like headers request failed: ${error.status} ${error.statusText}`;
        
        if (error.error) {
          this.errorMessage += ' - ' + JSON.stringify(error.error);
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
