import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { TokenFactoryService } from './token-factory.service';

interface UserDetailsResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    email: string;
    name: string;
    address: string;
    phoneNumber: string;
    role: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserDetailsService {
  private readonly API_URL = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private tokenFactory: TokenFactoryService
  ) {}

  /**
   * Get user details from the API
   * @returns Observable with user details data
   */
  getUserDetails(): Observable<UserDetailsResponse> {
    console.log('UserDetailsService: Fetching user details');
    
    // Get auth token
    const token = this.tokenFactory.getToken();
    if (!token) {
      console.warn('UserDetailsService: No auth token available');
      return of({ success: false, message: 'Authentication required', data: {} } as UserDetailsResponse);
    }
    
    // Create headers with auth token
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
    });
    
    // Make the API call
    return this.http.get<UserDetailsResponse>(`${this.API_URL}/user-details`, { headers })
      .pipe(
        map(response => {
          console.log('UserDetailsService: User details response:', response);
          return response;
        }),
        catchError(error => {
          console.error('UserDetailsService: Error fetching user details:', error);
          return of({ 
            success: false, 
            message: 'Failed to fetch user details', 
            data: {} 
          } as UserDetailsResponse);
        })
      );
  }
} 