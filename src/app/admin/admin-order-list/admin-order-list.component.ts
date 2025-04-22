import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { HttpClientModule } from '@angular/common/http';

// Admin Order interfaces that match API structure
export interface AdminOrderItem {
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  subtotal?: number;
}

export interface AdminOrderListItem {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  shippingAddress: string;
  paymentStatus: string;
  items: AdminOrderItem[];
  userId: number;
  userEmail: string;
  userName: string;
  userPhoneNumber?: string;
}

// Define order status enum to match backend
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

@Component({
  selector: 'app-admin-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './admin-order-list.component.html',
  styleUrl: './admin-order-list.component.scss'
})
export class AdminOrderListComponent implements OnInit {
  orders: AdminOrderListItem[] = [];
  originalOrders: AdminOrderListItem[] = []; // Store original order list
  loading = true;
  error = '';
  processingOrderId: number | null = null;
  statusFilter: string | null = null;
  OrderStatus = OrderStatus; // Expose enum to template
  
  constructor(private adminService: AdminService) {}
  
  ngOnInit(): void {
    this.loadOrders();
  }
  
  loadOrders(): void {
    this.loading = true;
    this.adminService.getAllOrders().subscribe({
      next: (response) => {
        console.log('AdminOrderListComponent: Orders loaded', response);
        if (response && response.success && response.data) {
          // API returns an array of orders
          const orders = Array.isArray(response.data) ? response.data : [];
          this.originalOrders = [...orders]; // Keep original copy
          this.orders = orders;
        } else {
          console.error('AdminOrderListComponent: Invalid response format', response);
          this.orders = [];
          this.originalOrders = [];
          this.error = response.message || 'Failed to load orders';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('AdminOrderListComponent: Error loading orders', err);
        this.orders = [];
        this.originalOrders = [];
        this.error = err.error?.message || 'Failed to load orders';
        this.loading = false;
      }
    });
  }
  
  updateOrderStatus(orderId: number, status: string): void {
    this.processingOrderId = orderId;
    
    this.adminService.updateOrderStatus(orderId, status).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          // Update order in the local array
          const orderIndex = this.orders.findIndex(o => o.id === orderId);
          const originalIndex = this.originalOrders.findIndex(o => o.id === orderId);
          
          if (orderIndex !== -1) {
            this.orders[orderIndex] = response.data as unknown as AdminOrderListItem;
          }
          
          if (originalIndex !== -1) {
            this.originalOrders[originalIndex] = response.data as unknown as AdminOrderListItem;
          }
          
          // If filtering is active, reapply the filter
          if (this.statusFilter) {
            this.filterByStatus(this.statusFilter);
          }
        } else {
          this.error = response?.message || 'Failed to update order status';
        }
        this.processingOrderId = null;
      },
      error: (err) => {
        console.error('AdminOrderListComponent: Error updating order status', err);
        this.error = err.error?.message || 'Failed to update order status';
        this.processingOrderId = null;
      }
    });
  }
  
  // Get status priority for sorting (PENDING -> CONFIRMED -> SHIPPED -> DELIVERED -> CANCELLED)
  getStatusPriority(status: string): number {
    switch (status.toUpperCase()) {
      case OrderStatus.PENDING:
        return 1;
      case OrderStatus.CONFIRMED:
        return 2;
      case OrderStatus.SHIPPED:
        return 3;
      case OrderStatus.DELIVERED:
        return 4;
      case OrderStatus.CANCELLED:
        return 5;
      default:
        return 99; // Unknown status
    }
  }
  
  // Sort orders by status
  sortByStatus(): void {
    this.orders = [...this.orders].sort((a, b) => {
      return this.getStatusPriority(a.status) - this.getStatusPriority(b.status);
    });
  }
  
  // Sort orders by date (newest first)
  sortByDate(): void {
    this.orders = [...this.orders].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  
  // Filter orders by status
  filterByStatus(status: string | null): void {
    this.statusFilter = status;
    
    if (!status) {
      // Reset to original order list
      this.orders = [...this.originalOrders];
    } else {
      // Filter by selected status
      this.orders = this.originalOrders.filter(order => 
        order.status.toUpperCase() === status.toUpperCase()
      );
    }
  }
  
  // Reset all filters and sorting
  resetFilters(): void {
    this.statusFilter = null;
    this.orders = [...this.originalOrders];
  }
  
  getStatusColor(status: string): string {
    switch (status.toUpperCase()) {
      case OrderStatus.PENDING:
        return 'warning';
      case OrderStatus.CONFIRMED:
        return 'secondary';
      case OrderStatus.SHIPPED:
        return 'info';
      case OrderStatus.DELIVERED:
        return 'success';
      case OrderStatus.CANCELLED:
        return 'danger';
      default:
        return 'default';
    }
  }
  
  getNextStatus(currentStatus: string): string {
    switch (currentStatus.toUpperCase()) {
      case OrderStatus.PENDING:
        return OrderStatus.CONFIRMED;
      case OrderStatus.CONFIRMED:
        return OrderStatus.SHIPPED;
      case OrderStatus.SHIPPED:
        return OrderStatus.DELIVERED;
      default:
        return currentStatus;
    }
  }
  
  canUpdateStatus(status: string): boolean {
    return status.toUpperCase() !== OrderStatus.DELIVERED && status.toUpperCase() !== OrderStatus.CANCELLED;
  }
}
