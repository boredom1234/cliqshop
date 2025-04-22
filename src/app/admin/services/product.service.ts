import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../../shared/models/product.model';
import { ApiResponse, PagedResponse, AdminProduct } from './admin.service';

// Define interface for stock updates
export interface StockUpdate {
  productId: number;
  stock: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // Helper method to get auth headers
  private getAuthHeaders(): HttpHeaders {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
      return new HttpHeaders({
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getProducts(page: number = 0, pageSize: number = 10, search?: string): Observable<{ products: AdminProduct[], totalCount: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', pageSize.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    
    return this.http.get<ApiResponse<PagedResponse<AdminProduct>>>(`${this.apiUrl}/products`, {
      params,
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('Raw API response:', response);
        if (response.success && response.data) {
          return {
            products: response.data.content || [],
            totalCount: response.data.totalElements || 0
          };
        } else {
          console.error('Invalid API response structure:', response);
          return {
            products: [],
            totalCount: 0
          };
        }
      })
    );
  }

  getProduct(id: number): Observable<AdminProduct> {
    return this.http.get<ApiResponse<AdminProduct>>(`${this.apiUrl}/product/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to get product');
        }
      })
    );
  }

  createProduct(product: Partial<AdminProduct>): Observable<AdminProduct> {
    return this.http.post<ApiResponse<AdminProduct>>(`${this.apiUrl}/product`, product, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to create product');
        }
      })
    );
  }

  updateProduct(id: number, product: Partial<AdminProduct>): Observable<AdminProduct> {
    return this.http.patch<ApiResponse<AdminProduct>>(`${this.apiUrl}/product/${id}`, product, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to update product');
        }
      })
    );
  }

  updateProductStatus(id: number, status: 'active' | 'inactive'): Observable<AdminProduct> {
    return this.http.patch<ApiResponse<AdminProduct>>(
      `${this.apiUrl}/product/${id}/status`,
      null,
      { 
        params: { status },
        headers: this.getAuthHeaders()
      }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to update product status');
        }
      })
    );
  }

  updateProductStock(productId: number, quantity: number): Observable<AdminProduct> {
    return this.http.patch<ApiResponse<AdminProduct>>(
      `${this.apiUrl}/product/${productId}/stock`,
      null,
      { 
        params: { quantity: quantity.toString() },
        headers: this.getAuthHeaders()
      }
    ).pipe(
      map(response => {
        console.log('Stock update response:', response);
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to update product stock');
        }
      })
    );
  }

  getLowStockProducts(threshold: number = 10): Observable<AdminProduct[]> {
    return this.http.get<ApiResponse<AdminProduct[]>>(
      `${this.apiUrl}/products/low-stock`,
      { 
        params: { threshold: threshold.toString() },
        headers: this.getAuthHeaders()
      }
    ).pipe(
      map(response => {
        console.log('Low stock products response:', response);
        if (response.success && response.data) {
          return response.data;
        } else {
          return [];
        }
      })
    );
  }

  bulkUpdateStock(updates: StockUpdate[]): Observable<AdminProduct[]> {
    return this.http.post<ApiResponse<AdminProduct[]>>(
      `${this.apiUrl}/products/bulk-stock-update`,
      updates,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        console.log('Bulk stock update response:', response);
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to perform bulk stock update');
        }
      })
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/product/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to delete product');
        }
      })
    );
  }
} 