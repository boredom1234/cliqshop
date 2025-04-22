import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { OrderService, Order, OrderAddress } from '../services/order.service';
import { Observable, of, switchMap, catchError, map, forkJoin } from 'rxjs';
import { UserDetailsService } from '../../core/services/user-details.service';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {
  order$!: Observable<Order | null>;
  orderId!: number;
  loading = true;
  error = false;
  errorMessage = '';
  userDetails: any = null;
  cancellingOrder = false;
  cancelSuccess = false;
  cancelMessage = '';

  constructor(
    private orderService: OrderService,
    private userDetailsService: UserDetailsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.order$ = this.route.paramMap.pipe(
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
        
        console.log(`Loading order details for ID: ${this.orderId}`);
        
        // Use forkJoin to fetch both order details and user profile data
        return forkJoin({
          order: this.orderService.getOrderDetails(this.orderId),
          userProfile: this.userDetailsService.getUserDetails()
        }).pipe(
          map(results => {
            const { order, userProfile } = results;
            
            // Store user details for reference
            if (userProfile.success && userProfile.data) {
              this.userDetails = userProfile.data;
              console.log('User profile data:', this.userDetails);
            }
            
            // Merge user profile data with order address data
            if (order && this.userDetails) {
              this.enhanceOrderWithUserData(order);
            }
            
            return order;
          }),
          catchError(error => {
            console.error('Error fetching order details or user profile:', error);
            this.error = true;
            this.errorMessage = 'Failed to load order details: ' + (error.message || 'Unknown error');
            this.loading = false;
            return of(null);
          })
        );
      })
    );
    
    // Set loading to false after data is loaded
    setTimeout(() => {
      this.loading = false;
    }, 800);
  }

  /**
   * Enhance order data with user profile information
   */
  private enhanceOrderWithUserData(order: Order): void {
    if (!this.userDetails) return;
    
    // Extract name from user profile
    let firstName = '';
    let lastName = '';
    
    if (this.userDetails.name) {
      const nameParts = this.userDetails.name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }
    
    // Create a merged address using user profile data
    const enhancedAddress: OrderAddress = {
      firstName: order.shippingAddress.firstName || firstName || this.userDetails.firstName || '',
      lastName: order.shippingAddress.lastName || lastName || this.userDetails.lastName || '',
      email: order.shippingAddress.email || this.userDetails.email || '',
      phone: order.shippingAddress.phone || this.userDetails.phoneNumber || '',
      addressLine1: order.shippingAddress.addressLine1 || this.userDetails.address || '',
      addressLine2: order.shippingAddress.addressLine2 || '',
      city: order.shippingAddress.city || this.userDetails.city || '',
      state: order.shippingAddress.state || this.userDetails.state || '',
      postalCode: order.shippingAddress.postalCode || this.userDetails.postalCode || '',
      country: order.shippingAddress.country || this.userDetails.country || ''
    };
    
    console.log('Enhanced shipping address with user data:', enhancedAddress);
    
    // Update the order with enhanced address data
    order.shippingAddress = enhancedAddress;
    order.billingAddress = { ...enhancedAddress };
  }

  goBack(): void {
    this.router.navigate(['/user/orders']);
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

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'processing':
        return 'status-processing';
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Cancel the current order
   */
  cancelOrder(order: Order): void {
    if (this.cancellingOrder) return;
    
    if (confirm('Are you sure you want to cancel this order?')) {
      this.cancellingOrder = true;
      this.orderService.cancelOrder(this.orderId).subscribe({
        next: (response) => {
          this.cancellingOrder = false;
          this.cancelSuccess = response.success;
          this.cancelMessage = response.message;
          
          if (response.success) {
            // Update the order status in the current view without reloading
            order.status = 'cancelled';
            
            // Show success message
            alert('Order cancelled successfully');
          } else {
            // Show error message
            alert(`Failed to cancel order: ${response.message}`);
          }
        },
        error: (error) => {
          this.cancellingOrder = false;
          this.cancelSuccess = false;
          this.cancelMessage = error.message || 'Failed to cancel order';
          alert(`Error: ${this.cancelMessage}`);
        }
      });
    }
  }

  /**
   * Check if order can be cancelled (orders that are pending, processing, or confirmed)
   */
  canCancelOrder(status: string): boolean {
    // Allow cancellation for pending, processing, confirmed, and shipped (for testing)
    return ['pending', 'processing', 'confirmed', 'shipped'].includes(status.toLowerCase());
  }

  /**
   * Check if a status step is completed based on the current order status
   */
  isStatusCompleted(status: string, orderStatus: string): boolean {
    const statusOrder: Record<string, number> = {
      'pending': 0,
      'processing': 1,
      'confirmed': 1, // Same level as processing
      'shipped': 2,
      'delivered': 3
    };
    
    const currentStatusValue = statusOrder[this.normalizeStatus(status)] || 0;
    const orderStatusValue = statusOrder[this.normalizeStatus(orderStatus)] || 0;
    
    // A step is completed if the order has progressed past this step
    return orderStatusValue > currentStatusValue;
  }
  
  /**
   * Check if a status step is active (current status)
   */
  isStatusActive(status: string, orderStatus: string): boolean {
    return this.normalizeStatus(orderStatus) === this.normalizeStatus(status);
  }
  
  /**
   * Normalize status string for comparison
   * Handles the mapping between UI status names and API status names
   */
  private normalizeStatus(status: string): string {
    // Map 'processing' to 'confirmed' for the progress tracker
    if (status.toLowerCase() === 'processing') {
      return 'confirmed';
    }
    return status.toLowerCase();
  }
}
