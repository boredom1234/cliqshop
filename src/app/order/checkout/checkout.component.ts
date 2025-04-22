import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { OrderService, OrderAddress, OrderSummary } from '../services/order.service';
import { CartService, Cart } from '../../cart/services/cart.service';
import { RazorpayService, RazorpayOrder, RazorpayPaymentResponse } from '../services/razorpay.service';
import { Observable } from 'rxjs';

enum CheckoutStep {
  SHIPPING = 0,
  BILLING = 1,
  PAYMENT = 2,
  REVIEW = 3
}

enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  RAZORPAY = 'razorpay'
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  currentStep = CheckoutStep.SHIPPING;
  steps = CheckoutStep;
  paymentMethods = PaymentMethod;
  selectedPaymentMethod = PaymentMethod.RAZORPAY;
  
  // Cart data
  cart$: Observable<Cart>;
  orderSummary!: OrderSummary;
  
  // Form groups
  shippingForm!: FormGroup;
  billingForm!: FormGroup;
  
  // Razorpay data
  razorpayOrder: RazorpayOrder | null = null;
  razorpayPaymentId: string | null = null;
  
  // Control flags
  loading = false;
  submitted = false;
  sameBillingAddress = true;
  errorMessage = '';
  
  constructor(
    private formBuilder: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private razorpayService: RazorpayService,
    private router: Router
  ) {
    this.cart$ = this.cartService.cart$;
  }

  ngOnInit(): void {
    // Initialize the order summary
    this.cart$.subscribe(cart => {
      this.orderSummary = this.orderService.calculateOrderTotal(cart.subtotal);
    });
    
    // Initialize shipping form
    this.shippingForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      country: ['', [Validators.required]]
    });
    
    // Initialize billing form
    this.billingForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      country: ['', [Validators.required]]
    });
    
    // Load user profile data to auto-fill forms
    this.loadUserProfileData();

    // Load Razorpay script
    this.loadRazorpayScript();
  }

  // Load the Razorpay script
  private loadRazorpayScript(): void {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }

  // Load user profile data and auto-fill forms
  loadUserProfileData(): void {
    this.orderService.getUserProfileData().subscribe({
      next: (userData) => {
        console.log('Checkout: Received user profile data:', userData);
        
        if (userData.shippingAddress) {
          this.shippingForm.patchValue(userData.shippingAddress);
          
          // Show a notification that user details were loaded
          // if (userData.shippingAddress.email) {
          //   this.errorMessage = `User details loaded for ${userData.shippingAddress.email}`;
            
          //   // Clear the success message after 5 seconds
          //   setTimeout(() => {
          //     if (this.errorMessage.includes('User details loaded')) {
          //       this.errorMessage = '';
          //     }
          //   }, 5000);
          // }
        }
        
        if (userData.billingAddress) {
          this.billingForm.patchValue(userData.billingAddress);
          
          // Check if shipping and billing addresses are the same
          if (userData.shippingAddress && this.areAddressesSame(userData.shippingAddress, userData.billingAddress)) {
            this.sameBillingAddress = true;
          } else {
            this.sameBillingAddress = false;
          }
        } else if (userData.shippingAddress) {
          // If no billing address but shipping address exists, use it as default
          this.billingForm.patchValue(userData.shippingAddress);
          this.sameBillingAddress = true;
        }
      },
      error: (error) => {
        console.error('Error loading user profile data:', error);
        this.errorMessage = 'Failed to load user details. Please fill in your information manually.';
        
        // Clear the error message after 5 seconds
        setTimeout(() => {
          if (this.errorMessage.includes('Failed to load')) {
            this.errorMessage = '';
          }
        }, 5000);
      }
    });
  }
  
  // Helper method to check if two addresses are the same
  private areAddressesSame(address1: OrderAddress, address2: OrderAddress): boolean {
    return address1.firstName === address2.firstName &&
           address1.lastName === address2.lastName &&
           address1.addressLine1 === address2.addressLine1 &&
           address1.city === address2.city &&
           address1.state === address2.state &&
           address1.postalCode === address2.postalCode &&
           address1.country === address2.country;
  }

  // Convenience getters for easy access to form fields
  get sf() { return this.shippingForm.controls; }
  get bf() { return this.billingForm.controls; }
  
  // Set payment method
  setPaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod = method;
    
    // Clear previous Razorpay data
    this.razorpayOrder = null;
    this.razorpayPaymentId = null;
  }

  // Generate Razorpay order and start payment flow
  initiateRazorpayPayment(): void {
    this.loading = true;
    this.errorMessage = '';
    
    // First, place the order to get an order ID
    this.placeOrderForRazorpay();
  }

  // Place an order first to get an order ID for Razorpay
  private placeOrderForRazorpay(): void {
    const cartValue = this.cartService.currentCart;
    
    // Add payment method information
    const paymentInfo = { 
      method: 'razorpay',
      status: 'pending'
    };
    
    this.orderService.placeOrder({
      items: cartValue.items,
      shippingAddress: this.shippingForm.value,
      billingAddress: this.billingForm.value,
      paymentInfo: paymentInfo,
      summary: this.orderSummary
    }).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Order created successfully, initiating Razorpay payment for order ID:', response.order.id);
          this.initiateRazorpayPaymentForOrder(response.order.id);
        } else {
          this.errorMessage = 'Failed to create order. Please try again.';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error creating order:', error);
        this.errorMessage = 'An error occurred while creating your order. Please try again.';
        this.loading = false;
      }
    });
  }

  // Initiate Razorpay payment for an existing order
  private initiateRazorpayPaymentForOrder(orderId: number): void {
    this.razorpayService.initiatePaymentForOrder(orderId).subscribe({
      next: (order) => {
        this.razorpayOrder = order;
        
        // Get customer info from shipping form
        const customerInfo = {
          name: `${this.shippingForm.value.firstName} ${this.shippingForm.value.lastName}`,
          email: this.shippingForm.value.email,
          contact: this.shippingForm.value.phone
        };
        
        console.log('Initiating Razorpay payment with order:', order);
        
        // Open Razorpay payment dialog
        this.razorpayService.openPaymentDialog(order, customerInfo)
          .then((response: RazorpayPaymentResponse) => {
            console.log('Razorpay payment successful:', response);
            
            // Verify payment signature
            this.razorpayService.verifyPayment(response).subscribe({
              next: (verifyResponse) => {
                if (verifyResponse.success) {
                  this.razorpayPaymentId = response.razorpay_payment_id;
                  this.errorMessage = 'Payment successfully completed with Razorpay!';
                  // Go to order success page after successful payment
                  this.router.navigate(['/order/order-success', orderId]);
                } else {
                  this.errorMessage = 'Payment verification failed. Please contact support.';
                  this.loading = false;
                }
              },
              error: (error) => {
                console.error('Razorpay verification error:', error);
                // Even if verification fails, show appropriate message
                this.errorMessage = 'Payment completed, but verification is pending. Your order will be confirmed after manual verification.';
                this.loading = false;

                // Route back to order page http://localhost:4200/user/orders
                this.router.navigate(['/user/orders']);
              }
            });
          })
          .catch(error => {
            console.error('Razorpay payment error:', error);
            let errorMessage = 'Payment failed: ';
            
            if (error.description) {
              errorMessage += error.description;
            } else if (error.message) {
              errorMessage += error.message;
            } else {
              errorMessage += 'Unknown error occurred';
            }
            
            // If user cancelled, show appropriate message
            if (error.message === 'Payment cancelled by user') {
              this.errorMessage = 'Payment was cancelled. Please try again when ready.';
            } else {
              this.errorMessage = errorMessage;
              
              // Suggest alternatives
              this.errorMessage += '. You may want to try UPI payment method instead.';
            }
            
            this.loading = false;
          });
      },
      error: (error) => {
        console.error('Error initiating Razorpay payment:', error);
        this.errorMessage = 'Failed to initiate payment. Please try again later or choose a different payment method.';
        this.loading = false;
      }
    });
  }

  // Place the final order with Razorpay
  placeOrder(): void {
    // Always use Razorpay flow
    this.initiateRazorpayPayment();
    return;
  }
  
  // Step navigation methods
  goToStep(step: CheckoutStep): void {
    this.currentStep = step;
  }
  
  nextStep(): void {
    this.submitted = true;
    
    // Validate and process current step
    switch (this.currentStep) {
      case CheckoutStep.SHIPPING:
        if (this.shippingForm.invalid) return;
        
        // If using same billing address, copy shipping address
        if (this.sameBillingAddress) {
          this.copyShippingToBilling();
        }
        
        // Save shipping address
        this.orderService.saveShippingAddress(this.shippingForm.value);
        
        // Go to next step - Billing or Payment
        this.currentStep = this.sameBillingAddress ? CheckoutStep.PAYMENT : CheckoutStep.BILLING;
        this.submitted = false;
        break;
        
      case CheckoutStep.BILLING:
        if (this.billingForm.invalid) return;
        
        // Save billing address
        this.orderService.saveBillingAddress(this.billingForm.value);
        
        // Go to payment step
        this.currentStep = CheckoutStep.PAYMENT;
        this.submitted = false;
        break;
        
      case CheckoutStep.PAYMENT:
        // Always valid since there's only Razorpay option
        this.orderService.savePaymentMethod('razorpay');
        this.currentStep = CheckoutStep.REVIEW;
        this.submitted = false;
        break;
        
      case CheckoutStep.REVIEW:
        // Place order
        this.placeOrder();
        break;
    }
  }
  
  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }
  
  // Toggle billing same as shipping
  toggleSameBillingAddress(): void {
    this.sameBillingAddress = !this.sameBillingAddress;
    
    if (this.sameBillingAddress) {
      this.billingForm.setValue(this.shippingForm.value);
    }
  }
  
  // Format currency for display
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Copy shipping address to billing form
  private copyShippingToBilling(): void {
    this.billingForm.setValue(this.shippingForm.value);
  }
}
