import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, catchError, tap } from 'rxjs/operators';
import { CartItem } from '../../cart/models/cart.model';
import { ApiConfigService } from '../../core/services/api-config.service';
import { UserDetailsService } from '../../core/services/user-details.service';

export interface OrderAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderPayment {
  cardHolderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  method?: string;
  paymentId?: string;
  orderId?: string;
}

export interface OrderSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface Order {
  id: number;
  orderId: string; // User-facing order ID (e.g., ORD-12345)
  userId: number;
  items: CartItem[];
  status: OrderStatus;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  payment: {
    method: string;
    last4: string;
  };
  summary: OrderSummary;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly API_URL = 'http://localhost:5000/api';
  
  private checkoutDataSubject = new BehaviorSubject<{
    shippingAddress?: OrderAddress;
    billingAddress?: OrderAddress;
    paymentMethod?: string;
  }>({});
  
  checkoutData$ = this.checkoutDataSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiConfigService: ApiConfigService,
    private userDetailsService: UserDetailsService
  ) {}

  /**
   * Get the current user's order history
   * @returns Observable of order history array
   */
  getOrderHistory(): Observable<Order[]> {
    console.log('OrderService: Fetching order history');
    // Use the real API endpoint with auth headers
    return this.http.get<{success: boolean; message: string; data: any[]}>(
      this.apiConfigService.getUrl('orders'),
      { headers: this.apiConfigService.getAuthHeaders() }
    ).pipe(
      map(response => {
        console.log('OrderService: Order history response:', response);
        if (response.success && response.data) {
          // Map the backend response to our Order model
          return response.data.map(item => this.mapApiOrderToModel(item));
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching order history:', error);
        // Properly propagate the error instead of using mock data
        throw error;
      })
    );
  }

  /**
   * Get details of a specific order by ID
   * @param orderId The ID of the order to fetch
   * @returns Observable of the order details
   */
  getOrderDetails(orderId: number): Observable<Order> {
    console.log(`OrderService: Fetching order details for ID ${orderId}`);
    // Use the real API endpoint with auth headers
    return this.http.get<{success: boolean; message: string; data: any}>(
      this.apiConfigService.getUrl(`order/${orderId}`),
      { headers: this.apiConfigService.getAuthHeaders() }
    ).pipe(
      map(response => {
        console.log(`OrderService: Order details response for ID ${orderId}:`, response);
        if (response.success && response.data) {
          // Log detailed API response for debugging
          console.log('Raw API response data:', JSON.stringify(response.data, null, 2));
          console.log('API Response - Shipping Address:', response.data.shippingAddress);
          console.log('API Response - Billing Address:', response.data.billingAddress);
          console.log('API Response - User Info:', {
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            email: response.data.email,
            phone: response.data.phone,
            address: response.data.address,
            city: response.data.city,
            state: response.data.state,
            postalCode: response.data.postalCode,
            country: response.data.country
          });
          
          // Map the backend response to our Order model
          const mappedOrder = this.mapApiOrderToModel(response.data);
          console.log('Mapped order shipping address:', mappedOrder.shippingAddress);
          console.log('Mapped order billing address:', mappedOrder.billingAddress);
          return mappedOrder;
        }
        throw new Error('Order data not found');
      }),
      catchError(error => {
        console.error(`Error fetching order details for ID ${orderId}:`, error);
        // Properly propagate the error instead of using mock data
        throw error;
      })
    );
  }

  /**
   * Place a new order with the items from the cart
   * @param orderData Order data including shipping address and items
   * @returns Observable with the result of the order placement
   */
  placeOrder(orderData: {
    items: CartItem[];
    shippingAddress: OrderAddress;
    billingAddress: OrderAddress;
    paymentInfo: OrderPayment;
    summary: OrderSummary;
  }): Observable<{success: boolean; order: Order}> {
    console.log('OrderService: Placing order with data:', orderData);
    
    // Prepare the shipping address as a URL-encoded string as required by the API
    const shippingAddressStr = `${orderData.shippingAddress.addressLine1}, ${orderData.shippingAddress.city}`;
    
    // Create the request body with payment information
    const requestBody: any = {
      items: orderData.items,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      summary: orderData.summary
    };
    
    // Add payment information based on method
    if (orderData.paymentInfo.method === 'razorpay') {
      requestBody.payment = {
        method: 'razorpay',
        razorpayOrderId: orderData.paymentInfo.orderId,
        razorpayPaymentId: orderData.paymentInfo.paymentId
      };
    } else {
      // Default credit card payment
      requestBody.payment = {
        method: 'credit_card',
        cardHolderName: orderData.paymentInfo.cardHolderName,
        last4: orderData.paymentInfo.cardNumber?.slice(-4) || '****',
        expiryDate: orderData.paymentInfo.expiryDate
      };
    }
    
    // Use the real API endpoint with query parameters as shown in the curl example and auth headers
    return this.http.post<{success: boolean; message: string; data: any}>(
      this.apiConfigService.getUrl('order-place'), 
      requestBody,
      {
        headers: this.apiConfigService.getAuthHeaders()
      }
    ).pipe(
      map(response => {
        console.log('OrderService: Order placement response:', response);
        if (response.success && response.data) {
          // Map the API response to our expected format
          return {
            success: true,
            order: this.mapApiOrderToModel(response.data)
          };
        }
        throw new Error('Order placement failed');
      }),
      tap(response => {
        if (response.success) {
          // Clear checkout data after successful order
          this.clearCheckoutData();
        }
      }),
      catchError(error => {
        console.error('Error placing order:', error);
        // Properly propagate the error instead of using mock data
        throw error;
      })
    );
  }

  /**
   * Map API order data to our Order model
   */
  private mapApiOrderToModel(apiOrder: any): Order {
    // Extract items or use empty array if not available
    const items = apiOrder.items || [];
    
    // Create cart items from API items
    const cartItems: CartItem[] = items.map((item: any) => ({
      id: item.productId,
      productId: item.productId,
      name: item.productName,
      price: item.price,
      image: item.productImage || 'assets/images/placeholder.jpg',
      quantity: item.quantity,
      totalPrice: item.price * item.quantity
    }));
    
    // Calculate subtotal from items
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Extract payment method information
    let paymentMethod = 'PENDING';
    let last4 = '****';
    
    if (apiOrder.payment) {
      paymentMethod = apiOrder.payment.method || apiOrder.paymentStatus || 'PENDING';
      
      if (paymentMethod === 'razorpay') {
        last4 = 'Razorpay';
      } else if (apiOrder.payment.last4) {
        last4 = apiOrder.payment.last4;
      }
    }
    
    // Create Order object matching our model
    return {
      id: apiOrder.id,
      orderId: `ORD-${apiOrder.id}`, // Generate a user-facing order ID
      userId: 1, // Assuming current user
      items: cartItems,
      status: apiOrder.status.toLowerCase() as OrderStatus,
      shippingAddress: this.parseShippingAddress(apiOrder),
      billingAddress: this.parseBillingAddress(apiOrder),
      payment: {
        method: paymentMethod,
        last4: last4
      },
      summary: {
        subtotal: subtotal,
        shipping: apiOrder.summary?.shipping || 0,
        tax: apiOrder.summary?.tax || 0,
        total: apiOrder.summary?.total || subtotal
      },
      createdAt: apiOrder.createdAt || new Date().toISOString(),
      updatedAt: apiOrder.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Parse shipping address from the API response
   */
  private parseShippingAddress(apiOrder: any): OrderAddress {
    console.log('Parsing shipping address from API order:', apiOrder);
    
    // The API response format shows user data in a specific format shown in the curl example:
    // First, try to get user data directly from the order or its nested properties
    
    // Check if there's a customer or user field in the API response
    const userData = apiOrder.user || apiOrder.customer || apiOrder;
    console.log('User data found for shipping address:', userData);
    
    // Extract name parts if a name exists
    let firstName = '';
    let lastName = '';
    
    if (userData.name) {
      const nameParts = userData.name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }
    
    // If we have a structured shipping address object, use it
    if (apiOrder.shippingAddress && typeof apiOrder.shippingAddress === 'object') {
      console.log('Found structured shipping address object:', apiOrder.shippingAddress);
      const shippingAddress = apiOrder.shippingAddress;
      
      return {
        firstName: shippingAddress.firstName || userData.firstName || firstName || userData.name?.split(' ')[0] || '',
        lastName: shippingAddress.lastName || userData.lastName || lastName || (userData.name?.split(' ').slice(1).join(' ')) || '',
        email: shippingAddress.email || userData.email || '',
        phone: shippingAddress.phone || userData.phoneNumber || userData.phone || '',
        addressLine1: shippingAddress.addressLine1 || shippingAddress.address || userData.address || '',
        addressLine2: shippingAddress.addressLine2 || '',
        city: shippingAddress.city || userData.city || '',
        state: shippingAddress.state || userData.state || '',
        postalCode: shippingAddress.postalCode || userData.postalCode || '',
        country: shippingAddress.country || userData.country || ''
      };
    }
    
    // Otherwise create a shipping address from available user data
    return {
      firstName: userData.firstName || firstName || userData.name?.split(' ')[0] || '',
      lastName: userData.lastName || lastName || (userData.name?.split(' ').slice(1).join(' ')) || '',
      email: userData.email || '',
      phone: userData.phoneNumber || userData.phone || '',
      addressLine1: userData.address || '',
      addressLine2: '',
      city: userData.city || '',
      state: userData.state || '',
      postalCode: userData.postalCode || '',
      country: userData.country || ''
    };
  }

  /**
   * Parse billing address from the API response
   */
  private parseBillingAddress(apiOrder: any): OrderAddress {
    console.log('Parsing billing address from API order:', apiOrder);
    
    // The API response format shows user data in a specific format shown in the curl example:
    // First, try to get user data directly from the order or its nested properties
    
    // Check if there's a customer or user field in the API response
    const userData = apiOrder.user || apiOrder.customer || apiOrder;
    console.log('User data found for billing address:', userData);
    
    // Extract name parts if a name exists
    let firstName = '';
    let lastName = '';
    
    if (userData.name) {
      const nameParts = userData.name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }
    
    // If we have a structured billing address object, use it
    if (apiOrder.billingAddress && typeof apiOrder.billingAddress === 'object') {
      console.log('Found structured billing address object:', apiOrder.billingAddress);
      const billingAddress = apiOrder.billingAddress;
      
      return {
        firstName: billingAddress.firstName || userData.firstName || firstName || userData.name?.split(' ')[0] || '',
        lastName: billingAddress.lastName || userData.lastName || lastName || (userData.name?.split(' ').slice(1).join(' ')) || '',
        email: billingAddress.email || userData.email || '',
        phone: billingAddress.phone || userData.phoneNumber || userData.phone || '',
        addressLine1: billingAddress.addressLine1 || billingAddress.address || userData.address || '',
        addressLine2: billingAddress.addressLine2 || '',
        city: billingAddress.city || userData.city || '',
        state: billingAddress.state || userData.state || '',
        postalCode: billingAddress.postalCode || userData.postalCode || '',
        country: billingAddress.country || userData.country || ''
      };
    }
    
    // If no dedicated billing address is found, use shipping address data
    return this.parseShippingAddress(apiOrder);
  }

  // Save shipping address during checkout
  saveShippingAddress(address: OrderAddress): void {
    const currentData = this.checkoutDataSubject.value;
    this.checkoutDataSubject.next({
      ...currentData,
      shippingAddress: address
    });
  }

  // Save billing address during checkout
  saveBillingAddress(address: OrderAddress): void {
    const currentData = this.checkoutDataSubject.value;
    this.checkoutDataSubject.next({
      ...currentData,
      billingAddress: address
    });
  }

  // Save payment method during checkout
  savePaymentMethod(method: string): void {
    const currentData = this.checkoutDataSubject.value;
    this.checkoutDataSubject.next({
      ...currentData,
      paymentMethod: method
    });
  }

  // Clear checkout data after order is placed
  clearCheckoutData(): void {
    this.checkoutDataSubject.next({});
  }

  // Calculate shipping cost
  calculateShipping(subtotal: number): number {
    // Simple shipping calculation (free shipping over $100)
    return subtotal > 100 ? 0 : 10;
  }

  // Calculate tax amount
  calculateTax(subtotal: number): number {
    // Simple tax calculation (8% tax rate)
    return subtotal * 0.08;
  }

  // Calculate order total
  calculateOrderTotal(subtotal: number): OrderSummary {
    const shipping = this.calculateShipping(subtotal);
    const tax = this.calculateTax(subtotal);
    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax
    };
  }

  /**
   * Get user profile data for auto-filling checkout forms
   * @returns Observable of user profile data
   */
  getUserProfileData(): Observable<{
    shippingAddress?: OrderAddress;
    billingAddress?: OrderAddress;
  }> {
    console.log('OrderService: Fetching user profile data');
    // Use the UserDetailsService to get user details from the API
    return this.userDetailsService.getUserDetails().pipe(
      map(response => {
        console.log('OrderService: User profile response:', response);
        // Check if response is successful and has data
        if (response.success && response.data) {
          const userData = response.data;
          
          // Parse name into first name and last name (if available)
          let firstName = '';
          let lastName = '';
          
          if (userData.name) {
            const nameParts = userData.name.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
          }
          
          // Format phone number if available (remove any non-digit characters)
          const phone = userData.phoneNumber ? userData.phoneNumber.replace(/\D/g, '') : '';
          
          // Create shipping address from user data
          const shippingAddress: OrderAddress = {
            email: userData.email,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            addressLine1: userData.address || '',
            addressLine2: '',
            city: userData.city || '',
            state: userData.state || '',
            postalCode: userData.postalCode || '',
            country: userData.country || ''
          };
          
          return {
            shippingAddress,
            billingAddress: { ...shippingAddress }  // Copy shipping address to billing
          };
        }
        
        console.log('OrderService: Invalid response format');
        return {};
      }),
      catchError(error => {
        console.error('Error fetching user profile data:', error);
        // Return empty object instead of mock data to require user input
        return of({});
      })
    );
  }

  /**
   * Cancel an order by ID
   * @param orderId The ID of the order to cancel
   * @returns Observable with the result of the cancellation
   */
  cancelOrder(orderId: number): Observable<{success: boolean; message: string}> {
    console.log(`OrderService: Cancelling order with ID ${orderId}`);
    return this.http.delete<{success: boolean; message: string; data: any}>(
      this.apiConfigService.getUrl(`order/${orderId}/cancel`),
      { headers: this.apiConfigService.getAuthHeaders() }
    ).pipe(
      map(response => {
        console.log('OrderService: Order cancellation response:', response);
        return {
          success: response.success,
          message: response.message
        };
      }),
      catchError(error => {
        console.error(`Error cancelling order with ID ${orderId}:`, error);
        throw error;
      })
    );
  }
} 