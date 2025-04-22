import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { HttpClientModule } from '@angular/common/http';
import { Observable, catchError, of, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';

// Custom interfaces to match the exact API response structure
interface AdminOrderItem {
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  subtotal?: number;
}

interface AdminOrder {
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

@Component({
  selector: 'app-admin-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule],
  templateUrl: './admin-order-details.component.html',
  styleUrls: ['./admin-order-details.component.scss']
})
export class AdminOrderDetailsComponent implements OnInit {
  order: AdminOrder | null = null;
  orderId: number | null = null;
  loading = true;
  error = false;
  errorMessage = '';
  processingStatus = false;
  selectedStatus = '';

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const idParam = params.get('id');
        if (!idParam) {
          this.error = true;
          this.errorMessage = 'Invalid order ID';
          this.loading = false;
          return of(null);
        }
        
        this.orderId = parseInt(idParam, 10);
        this.loading = true;
        this.error = false;
        
        return this.fetchOrderDetails();
      })
    ).subscribe();
  }

  fetchOrderDetails(): Observable<AdminOrder | null> {
    if (!this.orderId) {
      return of(null);
    }

    return this.adminService.getOrderDetails(this.orderId).pipe(
      switchMap(response => {
        if (response && response.success && response.data) {
          this.order = response.data as unknown as AdminOrder;
          this.selectedStatus = this.order.status;
          console.log('Order details loaded:', this.order);
          this.loading = false;
          return of(this.order);
        } else {
          this.error = true;
          this.errorMessage = response?.message || 'Failed to load order details';
          this.loading = false;
          return of(null);
        }
      }),
      catchError(error => {
        console.error('Error loading order details:', error);
        this.error = true;
        this.errorMessage = error.error?.message || 'An error occurred while loading order details';
        this.loading = false;
        return of(null);
      })
    );
  }

  goBack(): void {
    this.router.navigate(['/admin/orders']);
  }

  updateOrderStatus(status: string): void {
    if (!this.orderId || this.processingStatus || status === this.order?.status) {
      return;
    }

    this.processingStatus = true;
    
    this.adminService.updateOrderStatus(this.orderId, status).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.order = response.data as unknown as AdminOrder;
          this.selectedStatus = this.order.status;
        } else {
          this.error = true;
          this.errorMessage = response?.message || 'Failed to update order status';
        }
        this.processingStatus = false;
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        this.error = true;
        this.errorMessage = err.error?.message || 'Failed to update order status';
        this.processingStatus = false;
      }
    });
  }

  canUpdateStatus(status: string): boolean {
    return true; // Allow updating to any status
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
        return 'status-confirmed';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
} 