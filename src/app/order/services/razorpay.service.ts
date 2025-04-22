import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from '../../core/services/api-config.service';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

declare var Razorpay: any;

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status?: string;
  created_at?: number;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

@Injectable({
  providedIn: 'root'
})
export class RazorpayService {
  private readonly razorpayKeyId = 'rzp_test_ZHByihbXVbJUrA';
  
  constructor(
    private http: HttpClient,
    private apiConfigService: ApiConfigService
  ) {}

  /**
   * Creates a Razorpay order on the server
   * @param amount Amount to be paid in smallest currency unit (paise for INR)
   * @param currency Currency code (default: INR)
   * @param receipt Receipt ID (typically your internal order ID)
   * @returns Observable with the Razorpay order object
   */
  createOrder(amount: number, currency: string = 'INR', receipt: string = 'order_receipt'): Observable<RazorpayOrder> {
    // Convert amount from dollars to paise if needed
    // Our API expects the amount in the smallest currency unit (paise for INR)
    const amountInPaise = Math.round(amount);
    
    const orderData = {
      amount: amountInPaise / 100, // Convert back to regular currency for the API
      currency: currency,
      receipt: receipt,
      notes: {
        orderType: "Standard"
      }
    };
    
    console.log('Creating Razorpay order with data:', orderData);
    
    return this.http.post<{success: boolean; data: RazorpayOrder}>(
      this.apiConfigService.getUrl('razorpay-create-order'), 
      orderData,
      {
        headers: this.apiConfigService.getAuthHeaders()
      }
    ).pipe(
      retry(1),
      map(response => {
        console.log('Razorpay order creation response:', response);
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to create Razorpay order');
      }),
      catchError(error => {
        console.error('Error creating Razorpay order:', error);
        
        if (error.status === 500) {
          return throwError(() => new Error('Server error while creating Razorpay order. Please try again later.'));
        }
        
        return throwError(() => new Error('Failed to create Razorpay order: ' + (error.message || 'Unknown error')));
      })
    );
  }

  /**
   * Initiate payment for an existing order
   * @param orderId The order ID to initiate payment for
   * @returns Observable with the Razorpay order details
   */
  initiatePaymentForOrder(orderId: number): Observable<RazorpayOrder> {
    return this.http.post<{success: boolean; data: RazorpayOrder}>(
      this.apiConfigService.getUrl(`order/${orderId}/initiate-payment`),
      null,
      {
        headers: this.apiConfigService.getAuthHeaders()
      }
    ).pipe(
      map(response => {
        console.log('Razorpay payment initiation response:', response);
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to initiate payment');
      }),
      catchError(error => {
        console.error('Error initiating payment:', error);
        return throwError(() => new Error('Failed to initiate payment: ' + (error.message || 'Unknown error')));
      })
    );
  }

  /**
   * Opens the Razorpay payment dialog
   * @param order The Razorpay order object
   * @param customerInfo Customer information
   * @returns Promise that resolves with payment details or rejects with error
   */
  openPaymentDialog(order: RazorpayOrder, customerInfo: {
    name: string;
    email: string;
    contact: string;
  }): Promise<RazorpayPaymentResponse> {
    return new Promise((resolve, reject) => {
      const options = {
        key: this.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'CliqShop',
        description: 'Purchase from CliqShop',
        order_id: order.id,
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.contact
        },
        notes: {
          address: 'CliqShop Corporate Office'
        },
        theme: {
          color: '#3399cc'
        },
        handler: (response: RazorpayPaymentResponse) => {
          resolve(response);
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'));
          }
        }
      };

      try {
        console.log('Opening Razorpay payment dialog with options:', options);
        const razorpayInstance = new Razorpay(options);
        razorpayInstance.on('payment.failed', (response: any) => {
          console.error('Razorpay payment failed:', response.error);
          reject(response.error);
        });
        razorpayInstance.open();
      } catch (err) {
        console.error('Error opening Razorpay:', err);
        reject(new Error('Failed to initialize payment gateway'));
      }
    });
  }

  /**
   * Verify payment signature
   * @param paymentResponse Razorpay payment response
   * @returns Observable with verification result
   */
  verifyPayment(paymentResponse: RazorpayPaymentResponse): Observable<{success: boolean}> {
    console.log('Verifying payment with response:', paymentResponse);
    
    return this.http.post<{success: boolean}>(
      this.apiConfigService.getUrl('razorpay-verify-payment'),
      paymentResponse,
      {
        headers: this.apiConfigService.getAuthHeaders()
      }
    ).pipe(
      map(response => {
        console.log('Payment verification response:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error verifying payment:', error);
        return throwError(() => new Error('Payment verification failed: ' + (error.message || 'Unknown error')));
      })
    );
  }
} 