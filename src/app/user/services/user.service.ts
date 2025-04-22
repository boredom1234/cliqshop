import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Order } from '../../order/models/order.model';
import { Cart } from '../../cart/models/cart.model';
import { AuthService } from '../../auth/services/auth.service';
import { ApiConfigService } from '../../core/services/api-config.service';

// API response interface
interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    email: string;
    role: string;
    name?: string;
    address?: string;
    phoneNumber?: string;
    createdAt?: string;
    orders?: Order[];
    cart?: Cart;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }
}

// User profile interface
export interface UserProfile {
  id: string;
  email: string;
  role: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  createdAt: string;
  orders: Order[];
  cart: Cart;
}

// Profile update interface
export interface ProfileUpdateRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  currentPassword?: string;
  newPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private apiConfigService: ApiConfigService
  ) {
    console.log('UserService initialized');
  }

  /**
   * Get the authenticated user's details including profile, orders, and cart
   * @returns Observable of UserProfile
   */
  getUserDetails(): Observable<UserProfile> {
    const url = this.apiConfigService.getUrl('user-details');
    console.log('UserService: Fetching user details from', url);
    
    return this.http.get<ApiResponse>(url, {
      headers: this.apiConfigService.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('UserService: Received API response:', response);
        
        if (response.success && response.data) {
          // Transform API response to match UserProfile interface
          const userData = response.data;
          
          // Create a reasonable default date for createdAt (6 months ago)
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          
          // Create a UserProfile object with default values for missing properties
          const userProfile: UserProfile = {
            id: userData.id.toString(),
            email: userData.email,
            role: userData.role,
            name: userData.name || '',
            address: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            postalCode: userData.postalCode || '',
            country: userData.country || '',
            phoneNumber: userData.phoneNumber || '',
            createdAt: userData.createdAt || sixMonthsAgo.toISOString(),
            orders: userData.orders || [],
            cart: userData.cart || { 
              items: [], 
              totalItems: 0, 
              subtotal: 0, 
              totalPrice: 0, 
              userId: userData.id, 
              id: null 
            }
          };
          
          console.log('UserService: Transformed user profile:', userProfile);
          return userProfile;
        } else {
          console.error('UserService: API response indicates failure', response);
          throw new Error(response.message || 'Failed to get user details');
        }
      }),
      catchError(error => {
        console.error('UserService: Error fetching user details', error);
        throw error;
      })
    );
  }

  /**
   * Update the user's profile information and optionally change password
   * @param updateData Profile data to update
   * @returns Observable of updated UserProfile
   */
  updateProfile(updateData: ProfileUpdateRequest): Observable<UserProfile> {
    const url = this.apiConfigService.getUrl('update-profile');
    console.log('UserService: Updating profile with data:', updateData);
    
    return this.http.put<ApiResponse>(url, updateData, {
      headers: this.apiConfigService.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('UserService: Profile update response:', response);
        
        if (response.success && response.data) {
          // Transform API response to match UserProfile interface
          const userData = response.data;
          
          // Create a reasonable default date for createdAt (6 months ago)
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          
          // Create a UserProfile object with default values for missing properties
          const userProfile: UserProfile = {
            id: userData.id.toString(),
            email: userData.email,
            role: userData.role,
            name: userData.name || '',
            address: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            postalCode: userData.postalCode || '',
            country: userData.country || '',
            phoneNumber: userData.phoneNumber || '',
            createdAt: userData.createdAt || sixMonthsAgo.toISOString(),
            orders: [], // API doesn't return orders in update response
            cart: { items: [], totalItems: 0, subtotal: 0, totalPrice: 0, userId: userData.id, id: null }
          };
          
          // Update the current user in the AuthService
          this.authService.updateCurrentUser({
            name: userProfile.name,
            address: userProfile.address,
            city: userProfile.city,
            state: userProfile.state,
            postalCode: userProfile.postalCode,
            country: userProfile.country,
            phoneNumber: userProfile.phoneNumber
          });
          
          console.log('UserService: Updated user profile:', userProfile);
          return userProfile;
        } else {
          console.error('UserService: API response indicates failure', response);
          throw new Error(response.message || 'Failed to update profile');
        }
      }),
      catchError(error => {
        console.error('UserService: Error updating profile', error);
        return throwError(() => error);
      })
    );
  }
}
