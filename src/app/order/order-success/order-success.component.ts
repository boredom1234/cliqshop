import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { OrderService, Order } from '../services/order.service';
import { Observable, of, switchMap, catchError } from 'rxjs';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="success-container">
      <!-- Loading state -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading your order details...</p>
      </div>

      <!-- Error state -->
      <div class="error-card" *ngIf="error">
        <h1 class="error-title">Order Details Not Found</h1>
        <p class="error-message">{{ errorMessage }}</p>
        <div class="actions">
          <a routerLink="/order/orders" class="btn-secondary">View My Orders</a>
          <a routerLink="/products" class="btn-primary">Continue Shopping</a>
        </div>
      </div>

      <!-- Success state -->
      <div class="success-card" *ngIf="!loading && !error && order">
        <h1 class="success-title">Thank You for Your Order!</h1>
        <p class="success-message">
          Your order #{{ order.orderId }} has been placed successfully.
        </p>
        
        <div class="order-summary">
          <h2>Order Summary</h2>
          <div class="summary-details">
            <div class="summary-row">
              <span>Order Date</span>
              <span>{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="summary-row">
              <span>Items</span>
              <span>{{ order.items.length }}</span>
            </div>
            <div class="summary-row">
              <span>Order Status</span>
              <span class="order-status">{{ order.status }}</span>
            </div>
            <div class="summary-row">
              <span>Total</span>
              <span class="order-total">{{ formatCurrency(order.summary.total) }}</span>
            </div>
          </div>
        </div>
        
        <div class="actions">
          <a [routerLink]="['/order/order', order.id]" class="btn-secondary">View Order Details</a>
          <a routerLink="/products" class="btn-primary">Continue Shopping</a>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./order-success.component.scss']
})
export class OrderSuccessComponent implements OnInit {
  order: Order | null = null;
  orderId: number = 0;
  loading = true;
  error = false;
  errorMessage = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}
  
  ngOnInit(): void {
    // Get order ID from route parameters and fetch order details
    this.route.paramMap.pipe(
      switchMap(params => {
        const idParam = params.get('id');
        if (!idParam) {
          this.error = true;
          this.errorMessage = 'Order ID not found';
          this.loading = false;
          return of(null);
        }
        
        this.orderId = parseInt(idParam, 10);
        this.loading = true;
        this.error = false;
        
        // Log the attempt to fetch order details
        console.log(`Attempting to fetch order details for ID: ${this.orderId}`);
        
        return this.orderService.getOrderDetails(this.orderId).pipe(
          catchError(error => {
            console.error('Error fetching order details:', error);
            this.error = true;
            this.errorMessage = 'Failed to load order details';
            this.loading = false;
            return of(null);
          })
        );
      })
    ).subscribe(order => {
      console.log('Order details received:', order);
      this.order = order;
      this.loading = false;
      
      if (!order) {
        this.error = true;
        this.errorMessage = 'Order details not available';
      }
    });
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