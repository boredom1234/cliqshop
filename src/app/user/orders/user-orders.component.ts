import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';
import { UserLayoutComponent } from '../user-layout/user-layout.component';
import { OrderService } from '../../order/services/order.service';

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, UserLayoutComponent],
  templateUrl: './user-orders.component.html',
  styleUrl: './user-orders.component.scss'
})
export class UserOrdersComponent implements OnInit {
  orders: any[] = [];
  loading = true;
  error = '';

  constructor(
    private userService: UserService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = '';

    this.orderService.getOrderHistory().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
        console.log('Orders loaded:', this.orders);
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.error = err.error?.message || 'Failed to load orders. Please try again.';
        this.loading = false;
      }
    });
  }

  // Format date string to a readable format
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Get status badge class based on order status
  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'pending';
      case 'processing':
        return 'processing';
      case 'shipped':
        return 'shipped';
      case 'delivered':
        return 'delivered';
      case 'cancelled':
        return 'cancelled';
      default:
        return '';
    }
  }
} 