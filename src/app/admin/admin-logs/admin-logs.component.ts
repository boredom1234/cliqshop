import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { AdminService, ApiLog } from '../services/admin.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <section class="admin-logs">
      <div class="section-header">
        <div class="header-row">
          <h1>API Logs</h1>
          <div class="backend-status" [class.online]="backendStatus" [class.offline]="!backendStatus">
            <span class="status-indicator"></span>
            <span class="status-text">{{ backendStatus ? 'Backend Online' : 'Backend Offline' }}</span>
          </div>
        </div>
        <div class="subheader-row">
          <p class="section-description">
            View all API requests made to the platform
          </p>
          <div class="refresh-controls">
            <label class="auto-refresh-label">
              <input type="checkbox" [(ngModel)]="autoRefresh" (change)="toggleAutoRefresh()">
              Auto-refresh ({{ refreshInterval }}s)
            </label>
            <select [(ngModel)]="refreshInterval" (change)="updateRefreshInterval()" [disabled]="!autoRefresh">
              <option [value]="5">5 seconds</option>
              <option [value]="10">10 seconds</option>
              <option [value]="30">30 seconds</option>
              <option [value]="60">1 minute</option>
            </select>
            <button class="refresh-button" (click)="loadLogs()" [disabled]="loading">
              <span *ngIf="!loading">⟳</span>
              <span *ngIf="loading" class="loading-spinner">⟳</span>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div class="logs-filters">
        <div class="filter-controls">
          <div class="filter-row">
            <div class="filter-group">
              <label for="methodFilter">HTTP Method:</label>
              <select id="methodFilter" [(ngModel)]="methodFilter" (change)="applyFilters()">
                <option value="">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="statusFilter">Status:</label>
              <select id="statusFilter" [(ngModel)]="statusFilter" (change)="applyFilters()">
                <option value="">All Status Codes</option>
                <option value="200">200 (OK)</option>
                <option value="201">201 (Created)</option>
                <option value="400">400 (Bad Request)</option>
                <option value="401">401 (Unauthorized)</option>
                <option value="403">403 (Forbidden)</option>
                <option value="404">404 (Not Found)</option>
                <option value="500">500 (Server Error)</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="userRoleFilter">User Role:</label>
              <select id="userRoleFilter" [(ngModel)]="userRoleFilter" (change)="applyFilters()">
                <option value="">All Roles</option>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Staff</option>
              </select>
            </div>
          </div>
          
          <div class="filter-row">
            <div class="filter-group">
              <label for="endpointFilter">Endpoint:</label>
              <input 
                type="text" 
                id="endpointFilter" 
                [(ngModel)]="endpointFilter" 
                placeholder="Filter by endpoint..."
              >
            </div>
            
            <div class="filter-group">
              <label for="emailFilter">User Email:</label>
              <input 
                type="text" 
                id="emailFilter" 
                [(ngModel)]="emailFilter" 
                placeholder="Filter by email..."
              >
            </div>
            
            <div class="filter-group">
              <label for="userIdFilter">User ID:</label>
              <input 
                type="number" 
                id="userIdFilter" 
                [(ngModel)]="userIdFilter" 
                placeholder="Filter by user ID..."
              >
            </div>
          </div>
          
          <div class="filter-row">
            <div class="filter-group">
              <label for="startDateFilter">Start Date:</label>
              <input 
                type="datetime-local" 
                id="startDateFilter" 
                [(ngModel)]="startDateFilter" 
              >
            </div>
            
            <div class="filter-group">
              <label for="endDateFilter">End Date:</label>
              <input 
                type="datetime-local" 
                id="endDateFilter" 
                [(ngModel)]="endDateFilter" 
              >
            </div>
            
            <div class="filter-actions">
              <button class="apply-filters" (click)="applyFilters()">Apply Filters</button>
              <button class="clear-filters" (click)="clearFilters()">Clear Filters</button>
            </div>
          </div>
        </div>
      </div>

      <div class="logs-table-wrapper">
        <table class="logs-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Status</th>
              <th>User</th>
              <th>Role</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="loading">
              <td colspan="8" class="loading-message">Loading logs...</td>
            </tr>
            <tr *ngIf="!loading && logs.length === 0">
              <td colspan="8" class="no-logs-message">No logs found matching your criteria</td>
            </tr>
            <tr *ngFor="let log of logs" 
                [class.error]="log.responseStatus >= 400" 
                (click)="toggleLogDetails(log)">
              <td>{{ log.id }}</td>
              <td>{{ formatDate(log.timestamp) }}</td>
              <td [class]="'method-' + log.method.toLowerCase()">{{ log.method }}</td>
              <td class="endpoint">{{ log.endpoint }}</td>
              <td [class]="getStatusClass(log.responseStatus)">{{ log.responseStatus }}</td>
              <td>{{ log.userEmail }}</td>
              <td>{{ log.userRole }}</td>
              <td>{{ log.ipAddress }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-controls" *ngIf="totalPages > 0">
        <button 
          [disabled]="currentPage === 0" 
          (click)="changePage(currentPage - 1)">
          Previous
        </button>
        <span class="page-info">Page {{ currentPage + 1 }} of {{ totalPages }}</span>
        <button 
          [disabled]="currentPage >= totalPages - 1" 
          (click)="changePage(currentPage + 1)">
          Next
        </button>
      </div>

      <div class="log-details" *ngIf="selectedLog">
        <div class="log-details-header">
          <h3>Log Details</h3>
          <button class="close-details" (click)="selectedLog = null">×</button>
        </div>
        <div class="log-details-content">
          <div class="log-detail-item">
            <span class="detail-label">ID:</span>
            <span>{{ selectedLog.id }}</span>
          </div>
          <div class="log-detail-item">
            <span class="detail-label">Timestamp:</span>
            <span>{{ selectedLog.timestamp }}</span>
          </div>
          <div class="log-detail-item">
            <span class="detail-label">Method:</span>
            <span [class]="'method-badge method-' + selectedLog.method.toLowerCase()">{{ selectedLog.method }}</span>
          </div>
          <div class="log-detail-item">
            <span class="detail-label">Endpoint:</span>
            <span>{{ selectedLog.endpoint }}</span>
          </div>
          <div class="log-detail-item">
            <span class="detail-label">Status:</span>
            <span [class]="'status-badge ' + getStatusClass(selectedLog.responseStatus)">{{ selectedLog.responseStatus }}</span>
          </div>
          <div class="log-detail-item">
            <span class="detail-label">User:</span>
            <span>{{ selectedLog.userEmail }} (ID: {{ selectedLog.userId }})</span>
          </div>
          <div class="log-detail-item">
            <span class="detail-label">Role:</span>
            <span>{{ selectedLog.userRole }}</span>
          </div>
          <div class="log-detail-item">
            <span class="detail-label">IP Address:</span>
            <span>{{ selectedLog.ipAddress }}</span>
          </div>
          <div class="log-detail-item">
            <span class="detail-label">User Agent:</span>
            <span>{{ selectedLog.userAgent }}</span>
          </div>
          <div class="log-detail-item" *ngIf="selectedLog.executionTime">
            <span class="detail-label">Execution Time:</span>
            <span>{{ selectedLog.executionTime }} ms</span>
          </div>
          <div class="log-detail-item" *ngIf="selectedLog.requestBody">
            <span class="detail-label">Request Body:</span>
            <pre>{{ formatJson(selectedLog.requestBody) }}</pre>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .admin-logs {
      padding: 30px;
      position: relative;
    }

    .section-header {
      margin-bottom: 30px;
    }
    
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .subheader-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-header h1 {
      font-size: 24px;
      margin: 0;
      font-weight: 500;
    }

    .section-description {
      color: #666;
      margin: 0;
    }
    
    .backend-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      padding: 4px 12px;
      border-radius: 4px;
      background: #f3f4f6;
    }
    
    .backend-status.online {
      color: #059669;
    }
    
    .backend-status.offline {
      color: #dc2626;
    }
    
    .status-indicator {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      mask: url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" /></svg>');
      -webkit-mask: url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" /></svg>');
      mask-size: contain;
      -webkit-mask-size: contain;
    }
    
    .online .status-indicator {
      background-color: #059669;
    }
    
    .offline .status-indicator {
      background-color: #dc2626;
    }
    
    .refresh-controls {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .auto-refresh-label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 14px;
      color: #666;
    }
    
    .refresh-button {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      background: white;
      border: 1px solid #000;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .refresh-button:hover:not(:disabled) {
      background: #000;
      color: white;
    }
    
    .refresh-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .loading-spinner {
      display: inline-block;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .logs-filters {
      margin-bottom: 20px;
      background-color: #fff;
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 0;
    }

    .filter-controls {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      align-items: flex-end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 150px;
    }

    .filter-group label {
      font-size: 12px;
      margin-bottom: 5px;
      color: #666;
    }

    .filter-group select,
    .filter-group input {
      padding: 8px 12px;
      border: 1px solid #000;
      background: white;
      border-radius: 0;
      font-size: 14px;
      width: 100%;
    }

    .filter-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    button.apply-filters,
    button.clear-filters {
      padding: 8px 15px;
      background: white;
      border: 1px solid #000;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 37px;
    }

    button.apply-filters {
      background: #000;
      color: white;
    }

    button.apply-filters:hover {
      background: #333;
    }

    button.clear-filters:hover {
      background: #000;
      color: white;
    }

    .logs-table-wrapper {
      overflow-x: auto;
      background: white;
      border: 1px solid #ddd;
      border-radius: 0;
      margin-bottom: 20px;
    }

    .logs-table {
      width: 100%;
      border-collapse: collapse;
    }

    .logs-table th {
      text-align: left;
      padding: 12px 15px;
      border-bottom: 1px solid #000;
      font-weight: 500;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .logs-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
      transition: background-color 0.2s ease;
    }

    .logs-table tbody tr {
      cursor: pointer;
    }

    .logs-table tbody tr:hover td {
      background-color: #f8f8f8;
    }

    .endpoint {
      font-family: monospace;
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .method-get {
      color: #0a85d1;
    }

    .method-post {
      color: #10b981;
    }

    .method-put, .method-patch {
      color: #f59e0b;
    }

    .method-delete {
      color: #ef4444;
    }

    .status-success {
      color: #10b981;
    }

    .status-redirect {
      color: #0a85d1;
    }

    .status-client-error {
      color: #f59e0b;
    }

    .status-server-error {
      color: #ef4444;
    }

    .loading-message, .no-logs-message {
      text-align: center;
      padding: 20px;
      color: #666;
    }

    .error {
      background-color: rgba(254, 226, 226, 0.5);
    }

    .error:hover td {
      background-color: rgba(254, 226, 226, 0.8) !important;
    }

    .pagination-controls {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-top: 20px;
      align-items: center;
    }

    .pagination-controls button {
      padding: 8px 15px;
      background: white;
      border: 1px solid #000;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .pagination-controls button:hover:not(:disabled) {
      background: #000;
      color: white;
    }

    .pagination-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      border-color: #ccc;
    }

    .page-info {
      font-size: 14px;
      color: #666;
    }

    .log-details {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 800px;
      background: white;
      border: 1px solid #000;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      overflow: auto;
      max-height: 80vh;
    }

    .log-details-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid #eee;
    }

    .log-details-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .close-details {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    }

    .close-details:hover {
      color: #000;
    }

    .log-details-content {
      padding: 20px;
    }

    .log-detail-item {
      margin-bottom: 15px;
    }

    .detail-label {
      font-weight: 500;
      margin-right: 8px;
      color: #666;
      display: inline-block;
      width: 120px;
    }

    pre {
      background: #f8f8f8;
      padding: 10px;
      border-radius: 0;
      overflow: auto;
      font-family: monospace;
      margin: 10px 0 0;
      border: 1px solid #eee;
      max-height: 200px;
    }

    .method-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    @media (max-width: 992px) {
      .filter-row {
        flex-direction: column;
        gap: 10px;
      }

      .filter-group {
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .filter-controls {
        flex-direction: column;
        gap: 10px;
      }

      .filter-group {
        width: 100%;
      }

      .filter-actions {
        width: 100%;
        justify-content: space-between;
      }

      .endpoint {
        max-width: 150px;
      }
    }
  `]
})
export class AdminLogsComponent implements OnInit, OnDestroy {
  logs: ApiLog[] = [];
  loading = true;
  error: string | null = null;
  
  // Backend status
  backendStatus = false;
  
  // Auto-refresh settings
  autoRefresh = false;
  refreshInterval = 10; // seconds
  private refreshSubscription: Subscription | null = null;
  
  // Advanced Filters
  methodFilter = '';
  statusFilter = '';
  userRoleFilter = '';
  endpointFilter = '';
  emailFilter = '';
  userIdFilter: number | null = null;
  startDateFilter: string = '';
  endDateFilter: string = '';
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  
  // Selected log for details view
  selectedLog: ApiLog | null = null;
  
  // Track active filter
  activeFilterType: 'none' | 'method' | 'status' | 'user' | 'email' | 'endpoint' | 'date-range' = 'none';
  
  private subscription: Subscription | null = null;
  private backendCheckSubscription: Subscription | null = null;

  constructor(private adminService: AdminService, private http: HttpClient) {}

  ngOnInit(): void {
    this.checkBackendStatus();
    this.loadLogs();
    
    // Check backend status every 30 seconds
    this.backendCheckSubscription = interval(30000).subscribe(() => {
      this.checkBackendStatus();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.backendCheckSubscription) {
      this.backendCheckSubscription.unsubscribe();
    }
  }
  
  checkBackendStatus(): void {
    this.http.get('http://localhost:5000/health', { responseType: 'text' })
      .subscribe({
        next: () => {
          this.backendStatus = true;
        },
        error: () => {
          this.backendStatus = false;
          // If backend is down, stop auto-refresh
          if (this.autoRefresh) {
            this.toggleAutoRefresh();
          }
        }
      });
  }
  
  toggleAutoRefresh(): void {
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }
  
  startAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    
    // Convert seconds to milliseconds
    const intervalMs = this.refreshInterval * 1000;
    this.refreshSubscription = interval(intervalMs).subscribe(() => {
      if (!this.loading) {
        this.loadLogs();
      }
    });
  }
  
  stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = null;
    }
  }
  
  updateRefreshInterval(): void {
    if (this.autoRefresh) {
      // Restart with new interval
      this.startAutoRefresh();
    }
  }

  loadLogs(): void {
    this.loading = true;
    
    // Determine which API endpoint to use based on active filters
    let apiCall: Subscription;
    
    if (this.userIdFilter) {
      this.activeFilterType = 'user';
      apiCall = this.adminService.getUserLogs(this.userIdFilter, this.currentPage, this.pageSize).subscribe(this.handleResponse);
    } else if (this.emailFilter) {
      this.activeFilterType = 'email';
      apiCall = this.adminService.getLogsByEmail(this.emailFilter, this.currentPage, this.pageSize).subscribe(this.handleResponse);
    } else if (this.endpointFilter) {
      this.activeFilterType = 'endpoint';
      apiCall = this.adminService.getLogsByEndpoint(this.endpointFilter, this.currentPage, this.pageSize).subscribe(this.handleResponse);
    } else if (this.methodFilter) {
      this.activeFilterType = 'method';
      apiCall = this.adminService.getLogsByMethod(this.methodFilter, this.currentPage, this.pageSize).subscribe(this.handleResponse);
    } else if (this.statusFilter) {
      this.activeFilterType = 'status';
      apiCall = this.adminService.getLogsByStatus(parseInt(this.statusFilter), this.currentPage, this.pageSize).subscribe(this.handleResponse);
    } else if (this.startDateFilter && this.endDateFilter) {
      this.activeFilterType = 'date-range';
      apiCall = this.adminService.getLogsByDateRange(this.startDateFilter, this.endDateFilter, this.currentPage, this.pageSize).subscribe(this.handleResponse);
    } else {
      this.activeFilterType = 'none';
      apiCall = this.adminService.getLogs(this.currentPage, this.pageSize).subscribe(this.handleResponse);
    }
    
    this.subscription = apiCall;
  }
  
  private handleResponse = {
    next: (response: any) => {
      if (response.success) {
        this.logs = response.data.content;
        this.totalPages = response.data.totalPages;
        this.totalElements = response.data.totalElements;
        
        // Apply client-side filtering for user role
        if (this.userRoleFilter) {
          this.logs = this.logs.filter(log => log.userRole === this.userRoleFilter);
        }
        
        // Update backend status based on successful API call
        this.backendStatus = true;
      } else {
        this.error = response.message;
        this.logs = [];
      }
      this.loading = false;
    },
    error: (err: any) => {
      console.error('Error loading logs:', err);
      this.error = 'Failed to load logs. Please try again.';
      this.loading = false;
      this.logs = [];
      
      // Update backend status based on API error
      this.backendStatus = false;
      
      // If backend is down, stop auto-refresh
      if (this.autoRefresh) {
        this.autoRefresh = false;
        this.stopAutoRefresh();
      }
    }
  };

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadLogs();
    }
  }

  applyFilters(): void {
    this.currentPage = 0; // Reset to first page when applying filters
    this.loadLogs();
  }

  clearFilters(): void {
    this.methodFilter = '';
    this.statusFilter = '';
    this.userRoleFilter = '';
    this.endpointFilter = '';
    this.emailFilter = '';
    this.userIdFilter = null;
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.activeFilterType = 'none';
    this.currentPage = 0;
    this.loadLogs();
  }

  toggleLogDetails(log: ApiLog): void {
    this.selectedLog = log;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  formatJson(jsonString: string): string {
    try {
      if (!jsonString) return '';
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonString;
    }
  }

  getStatusClass(status: number): string {
    if (status >= 200 && status < 300) {
      return 'status-success';
    } else if (status >= 300 && status < 400) {
      return 'status-redirect';
    } else if (status >= 400 && status < 500) {
      return 'status-client-error';
    } else if (status >= 500) {
      return 'status-server-error';
    }
    return '';
  }
} 