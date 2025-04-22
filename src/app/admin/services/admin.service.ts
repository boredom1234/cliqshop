import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { retry, tap } from 'rxjs/operators';
import { Product } from '../../products/services/product.service';
import { Order } from '../../order/services/order.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PagedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ApiLog {
  id: number;
  endpoint: string;
  method: string;
  userId: number;
  userEmail: string;
  userRole: string;
  requestBody: string;
  responseStatus: number;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  executionTime: number | null;
}

export interface ApiLogResponse extends PagedResponse<ApiLog> {}

export interface AdminProductResponse extends PagedResponse<AdminProduct> {}

export interface AdminProduct extends Product {
  stock: number;
  active: boolean | null;
  createdAt: string;
  lastModified: string;
  sku?: string;
  image?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  role: 'USER' | 'ADMIN' | 'STAFF';
}

export interface UserProfile extends User {
  verified: boolean;
  createdAt: string | null;
  lastLogin: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  accountLocked: boolean;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}

export interface AdminProfile {
  id: number;
  email: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  role: 'ADMIN';
  verified: boolean;
  lastLogin?: string | null;
  createdAt?: string | null;
  managedUsersCount?: number;
  createdProductsCount?: number;
  processedOrdersCount?: number;
}

export interface StaffMember {
  id: number;
  userId: number;
  email: string;
  name: string;
  permissions: StaffPermission[];
  createdBy: number;
}

export type StaffPermission = 
  'VIEW_ORDERS' | 
  'UPDATE_ORDER_STATUS' | 
  'VIEW_PRODUCTS' | 
  'UPDATE_PRODUCTS' | 
  'ADD_PRODUCTS' | 
  'VIEW_CUSTOMERS' | 
  'MANAGE_STOCK' | 
  'VIEW_STOCK_REPORTS';

export interface StockUpdate {
  productId: number;
  stock: number;
}

export interface LowStockProduct {
  id: number;
  name: string;
  category: string;
  stock: number;
  price: number;
}

export interface UserStatistics {
  totalUsers: number;
  adminCount: number;
  lockedAccounts: number;
  unverifiedAccounts: number;
  staffCount: number;
  customerCount: number;
}

// Dashboard statistics interface
export interface DashboardStatistics {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalUsersCount?: number;
  usersByRole?: Record<string, number>;
  totalCustomers?: number;
  activeCustomers?: number;
  averageOrderValue?: number;
  cancelledOrders?: number;
  confirmedOrders?: number;
  conversionRate?: number;
  dailyRevenue?: number;
  deliveredOrders?: number;
  lowStockProducts?: number;
  monthlyRevenue?: number;
  newCustomersThisMonth?: number;
  ordersByDay?: Record<string, number>;
  ordersByMonth?: Record<string, number>;
  outOfStockProducts?: number;
  pendingOrders?: number;
  revenueByDay?: Record<string, number>;
  revenueByMonth?: Record<string, number>;
  shippedOrders?: number;
  topCustomers?: Array<{
    id: number;
    name: string;
    email: string;
    orderCount: number;
    totalSpent: number;
  }>;
  topSellingProducts?: Array<{
    id: number;
    name: string;
    imageUrl: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  weeklyRevenue?: number;
  totalRevenue?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_URL = 'http://localhost:5000/api/admin';
  
  // Dashboard data sharing
  private dashboardStatistics = new BehaviorSubject<DashboardStatistics>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0
  });
  
  public dashboardStatistics$ = this.dashboardStatistics.asObservable();

  constructor(private http: HttpClient) {}

  // Helper method to get auth headers
  private getAuthHeaders(): HttpHeaders {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
      console.log('Using auth token (first 10 chars):', token.substring(0, 10) + '...');
      // Check if token has Bearer prefix, add if not
      return new HttpHeaders({
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    console.warn('No authentication token found in localStorage');
    // Return basic headers without auth
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Method to update dashboard statistics
  updateDashboardStatistics(stats: Partial<DashboardStatistics>): void {
    const currentStats = this.dashboardStatistics.getValue();
    this.dashboardStatistics.next({
      ...currentStats,
      ...stats
    });
  }
  
  // Get current dashboard statistics from BehaviorSubject
  getLocalDashboardStatistics(): DashboardStatistics {
    return this.dashboardStatistics.getValue();
  }

  // Public method to expose headers for debugging
  getDebugAuthHeaders(): { [key: string]: string } {
    const headers = this.getAuthHeaders();
    const headerObj: { [key: string]: string } = {};
    
    headers.keys().forEach(key => {
      const values = headers.getAll(key);
      if (values) {
        headerObj[key] = values.join(', ');
      }
    });
    
    return headerObj;
  }

  // Product Management
  getProducts(page = 0, size = 10, searchQuery?: string): Observable<ApiResponse<AdminProductResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (searchQuery) {
      params = params.set('query', searchQuery);
    }
    
    return this.http.get<ApiResponse<AdminProductResponse>>(
      `${this.API_URL}/products`, 
      { params, headers: this.getAuthHeaders() }
    );
  }

  addProduct(product: Partial<AdminProduct>): Observable<ApiResponse<AdminProduct>> {
    return this.http.post<ApiResponse<AdminProduct>>(
      `${this.API_URL}/product`,
      product,
      { headers: this.getAuthHeaders() }
    );
  }

  updateProduct(productId: number, updates: Partial<AdminProduct>): Observable<ApiResponse<AdminProduct>> {
    return this.http.patch<ApiResponse<AdminProduct>>(
      `${this.API_URL}/product/${productId}`,
      updates,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteProduct(productId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.API_URL}/product/${productId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  updateProductStatus(productId: number, status: 'active' | 'inactive'): Observable<ApiResponse<AdminProduct>> {
    return this.http.patch<ApiResponse<AdminProduct>>(
      `${this.API_URL}/product/${productId}/status`,
      null,
      { 
        params: { status },
        headers: this.getAuthHeaders()
      }
    );
  }

  // Order Management
  getAllOrders(): Observable<ApiResponse<{ content: Order[]; totalElements: number }>> {
    return this.http.get<ApiResponse<{ content: Order[]; totalElements: number }>>(
      `${this.API_URL}/orders`,
      { headers: this.getAuthHeaders() }
    );
  }

  getOrderDetails(orderId: number): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(
      `${this.API_URL}/order/${orderId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getRecentOrders(limit: number = 5): Observable<ApiResponse<Order[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResponse<Order[]>>(
      `${this.API_URL}/orders/recent`,
      { params, headers: this.getAuthHeaders() }
    );
  }

  updateOrderStatus(orderId: number, status: string): Observable<ApiResponse<Order>> {
    return this.http.patch<ApiResponse<Order>>(
      `${this.API_URL}/order/${orderId}/status`,
      null,
      { 
        params: { status },
        headers: this.getAuthHeaders()
      }
    );
  }

  // User Management
  getUsers(page = 0, size = 20): Observable<ApiResponse<PagedResponse<User>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      
    return this.http.get<ApiResponse<PagedResponse<User>>>(
      `${this.API_URL}/users`,
      { params, headers: this.getAuthHeaders() }
    );
  }

  searchUsers(query: string, role?: string, page = 0, size = 20): Observable<ApiResponse<User[] | PagedResponse<User>>> {
    let params = new HttpParams();
    
    if (query) {
      if (query.includes('@')) {
        params = params.set('email', query);
      } else {
        params = params.set('name', query);
      }
    }
    
    if (role) {
      params = params.set('role', role);
    }
    
    params = params.set('page', page.toString()).set('size', size.toString());
    
    return this.http.get<ApiResponse<User[] | PagedResponse<User>>>(
      `${this.API_URL}/users/search`,
      { params, headers: this.getAuthHeaders() }
    );
  }

  updateUserRole(userId: number, role: 'USER' | 'ADMIN' | 'STAFF'): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(
      `${this.API_URL}/user/${userId}/role`,
      null,
      { 
        params: { role },
        headers: this.getAuthHeaders()
      }
    );
  }

  getUserProfile(userId: number): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(
      `${this.API_URL}/user-profile/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getUserProfiles(): Observable<ApiResponse<UserProfile[]>> {
    return this.http.get<ApiResponse<UserProfile[]>>(
      `${this.API_URL}/users/profiles`,
      { headers: this.getAuthHeaders() }
    );
  }

  updateUserProfile(userId: number, updates: Partial<UserProfile>): Observable<ApiResponse<UserProfile>> {
    return this.http.patch<ApiResponse<UserProfile>>(
      `${this.API_URL}/user-profile/${userId}`,
      updates,
      { headers: this.getAuthHeaders() }
    );
  }

  toggleUserAccountLock(userId: number): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(
      `${this.API_URL}/user/${userId}/toggle-lock`,
      null,
      { headers: this.getAuthHeaders() }
    );
  }

  resetUserPassword(userId: number, newPassword: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.API_URL}/user/${userId}/reset-password`,
      null,
      { 
        params: { newPassword },
        headers: this.getAuthHeaders() 
      }
    );
  }

  getUserStatistics(): Observable<ApiResponse<UserStatistics>> {
    return this.http.get<ApiResponse<UserStatistics>>(
      `${this.API_URL}/users/statistics`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Admin Profile Management
  getAdminProfile(adminId: number): Observable<ApiResponse<AdminProfile>> {
    return this.http.get<ApiResponse<AdminProfile>>(
      `${this.API_URL}/admin-profile/${adminId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getAllAdminProfiles(): Observable<ApiResponse<AdminProfile[]>> {
    return this.http.get<ApiResponse<AdminProfile[]>>(
      `${this.API_URL}/admin-profiles`,
      { headers: this.getAuthHeaders() }
    );
  }

  getCurrentAdminProfile(): Observable<ApiResponse<AdminProfile>> {
    return this.http.get<ApiResponse<AdminProfile>>(
      `${this.API_URL}/current-admin-profile`,
      { headers: this.getAuthHeaders() }
    );
  }

  updateAdminProfile(adminId: number, updates: Partial<AdminProfile>): Observable<ApiResponse<AdminProfile>> {
    return this.http.patch<ApiResponse<AdminProfile>>(
      `${this.API_URL}/admin-profile/${adminId}`,
      updates,
      { headers: this.getAuthHeaders() }
    );
  }

  // Staff Management
  registerStaff(staffData: { 
    email: string; 
    password: string; 
    name: string; 
    address?: string; 
    phoneNumber?: string; 
    permissions: StaffPermission[] 
  }): Observable<ApiResponse<{ token: string; user: Partial<User> }>> {
    return this.http.post<ApiResponse<{ token: string; user: Partial<User> }>>(
      `${this.API_URL}/staff/register`,
      staffData,
      { headers: this.getAuthHeaders() }
    );
  }

  getAllStaff(): Observable<ApiResponse<StaffMember[]>> {
    return this.http.get<ApiResponse<StaffMember[]>>(
      `${this.API_URL}/staff`,
      { headers: this.getAuthHeaders() }
    );
  }

  getStaffDetails(staffId: number): Observable<ApiResponse<StaffMember>> {
    return this.http.get<ApiResponse<StaffMember>>(
      `${this.API_URL}/staff/${staffId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  updateStaffPermissions(staffId: number, permissions: StaffPermission[]): Observable<ApiResponse<StaffMember>> {
    return this.http.patch<ApiResponse<StaffMember>>(
      `${this.API_URL}/staff/${staffId}/permissions`,
      permissions,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteStaff(staffId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.API_URL}/staff/${staffId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Stock Management
  updateProductStock(productId: number, quantity: number): Observable<ApiResponse<AdminProduct>> {
    return this.http.patch<ApiResponse<AdminProduct>>(
      `${this.API_URL}/product/${productId}/stock`,
      null,
      { 
        params: { quantity: quantity.toString() },
        headers: this.getAuthHeaders()
      }
    );
  }

  getLowStockProducts(threshold: number = 10): Observable<ApiResponse<LowStockProduct[]>> {
    return this.http.get<ApiResponse<LowStockProduct[]>>(
      `${this.API_URL}/products/low-stock`,
      { 
        params: { threshold: threshold.toString() },
        headers: this.getAuthHeaders()
      }
    );
  }

  bulkUpdateStock(updates: StockUpdate[]): Observable<ApiResponse<AdminProduct[]>> {
    return this.http.post<ApiResponse<AdminProduct[]>>(
      `${this.API_URL}/products/bulk-stock-update`,
      updates,
      { headers: this.getAuthHeaders() }
    );
  }

  // Dashboard
  getDashboardStatisticsFromApi(): Observable<ApiResponse<{
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    recentOrders: Order[];
  }>> {
    console.log('AdminService: Requesting dashboard statistics from', `${this.API_URL}/dashboard/statistics`);
    const headers = this.getAuthHeaders();
    console.log('AdminService: Request headers set:', JSON.stringify(headers.keys()));
    
    return this.http.get<ApiResponse<{
      totalProducts: number;
      totalOrders: number;
      totalUsers: number;
      recentOrders: Order[];
    }>>(
      `${this.API_URL}/dashboard/statistics`,
      { headers: headers }
    ).pipe(
      // Try up to 3 times with a 1 second delay between attempts
      retry({ count: 3, delay: 1000 }),
      // Log the response
      tap(response => console.log('AdminService: Dashboard statistics response:', response))
    );
  }
  
  // Dashboard statistics with curl-like headers (no Content-Type)
  getDashboardStatisticsWithSimpleHeaders(): Observable<ApiResponse<{
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    recentOrders: Order[];
  }>> {
    console.log('AdminService: Requesting dashboard statistics with simple headers');
    
    // Get token similar to curl command (auth only, no content-type)
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const headers = token 
      ? new HttpHeaders({
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
          // No Content-Type header, matching curl behavior
        })
      : new HttpHeaders();
    
    console.log('AdminService: Simple headers set:', headers.keys());
    
    return this.http.get<ApiResponse<{
      totalProducts: number;
      totalOrders: number;
      totalUsers: number;
      recentOrders: Order[];
    }>>(
      `${this.API_URL}/dashboard/statistics`,
      { headers: headers }
    ).pipe(
      retry({ count: 1, delay: 1000 }),
      tap(response => console.log('AdminService: Simple headers response:', response))
    );
  }

  getDashboardStatistics(): Observable<ApiResponse<DashboardStatistics>> {
    return this.http.get<ApiResponse<DashboardStatistics>>(
      `${this.API_URL}/dashboard/statistics`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      retry(1),
      tap(response => {
        if (response.success) {
          this.updateDashboardStatistics(response.data);
        }
      })
    );
  }

  // Get API logs with pagination
  getLogs(page = 0, size = 20): Observable<ApiResponse<ApiLogResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ApiResponse<ApiLogResponse>>(`${this.API_URL}/logs`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      retry(1)
    );
  }
  
  // Get logs for a specific user by ID
  getUserLogs(userId: number, page = 0, size = 20): Observable<ApiResponse<ApiLogResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ApiResponse<ApiLogResponse>>(`${this.API_URL}/logs/user/${userId}`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      retry(1)
    );
  }
  
  // Get logs for a specific email
  getLogsByEmail(email: string, page = 0, size = 20): Observable<ApiResponse<ApiLogResponse>> {
    const params = new HttpParams()
      .set('email', email)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ApiResponse<ApiLogResponse>>(`${this.API_URL}/logs/email`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      retry(1)
    );
  }
  
  // Get logs for a specific endpoint
  getLogsByEndpoint(endpoint: string, page = 0, size = 20): Observable<ApiResponse<ApiLogResponse>> {
    const params = new HttpParams()
      .set('endpoint', endpoint)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ApiResponse<ApiLogResponse>>(`${this.API_URL}/logs/endpoint`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      retry(1)
    );
  }
  
  // Get logs for a specific HTTP method
  getLogsByMethod(method: string, page = 0, size = 20): Observable<ApiResponse<ApiLogResponse>> {
    const params = new HttpParams()
      .set('method', method)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ApiResponse<ApiLogResponse>>(`${this.API_URL}/logs/method`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      retry(1)
    );
  }
  
  // Get logs for a date range
  getLogsByDateRange(startDate: string, endDate: string, page = 0, size = 20): Observable<ApiResponse<ApiLogResponse>> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ApiResponse<ApiLogResponse>>(`${this.API_URL}/logs/date-range`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      retry(1)
    );
  }
  
  // Get logs for a specific status code
  getLogsByStatus(status: number, page = 0, size = 20): Observable<ApiResponse<ApiLogResponse>> {
    const params = new HttpParams()
      .set('status', status.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ApiResponse<ApiLogResponse>>(`${this.API_URL}/logs/status`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      retry(1)
    );
  }
} 