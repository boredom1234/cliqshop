import { CartItem } from '../../cart/models/cart.model';

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
  cardHolderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export interface OrderSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderId: string; // User-facing order ID (e.g., ORD-12345)
  userId: string;
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