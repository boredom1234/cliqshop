import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ApiConfigService } from '../../core/services/api-config.service';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  averageRating: number;
  reviewCount?: number;
}

export interface ProductDetail extends Product {
  reviews?: ProductReview[];
}

export interface ProductReview {
  id: number;
  rating: number;
  comment: string;
  userId: number;
  userEmail: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ProductResponse {
  content: Product[];
  totalPages: number;
  totalElements: number;
  currentPage?: number;
  pageable?: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last?: boolean;
  first?: boolean;
  size?: number;
  number?: number;
  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements?: number;
  empty?: boolean;
}

export interface ProductSearchResponse {
  results: Product[];
  totalResults: number;
}

export interface ProductCategoryResponse {
  content: Product[];
  totalProducts: number;
}

export interface ReviewResponse {
  reviews: ProductReview[];
  averageRating: number;
  totalReviews: number;
}

export interface AddReviewResponse {
  success: boolean;
  message: string;
  data: ProductReview;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {}

  // Get paginated product list
  getProducts(page = 0, size = 10): Observable<ProductResponse> {
    // Use 'page' and 'size' as query parameters - this is the Spring Data standard
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    // Try with a different URL format to match your API structure
    const url = this.apiConfig.getUrl('products');
    console.log('Making API request to:', url, 'with params:', params.toString());
      
    // Use direct URL generation to avoid any path joining issues
    return this.http.get<any>(url, { params })
      .pipe(
        map(response => {
          // Extract data from the wrapper
          console.log('Raw API response:', response);
          
          // Handle different response structures that might be returned
          if (response && response.success && response.data) {
            // Standard API wrapper: { success: true, message: "...", data: { ... } }
            console.log('API response successful using data wrapper:', response);
            return response.data;
          } 
          else if (response && response.content) {
            // Direct return of page data: { content: [...], totalPages: 1, ... }
            console.log('API response successful using direct content:', response);
            return response;
          }
          else {
            console.warn('API response format not as expected:', response);
            throw new Error('Invalid API response format');
          }
        }),
        catchError(error => {
          console.warn('API call failed, details:', error);
          console.warn('Error message:', error.message);
          console.warn('Status:', error.status, error.statusText);
          if (error.error) {
            console.warn('Error response:', error.error);
          }
          
          throw error;
        })
      );
  }

  // Get single product details
  getProductDetails(productId: number): Observable<ProductDetail> {
    // Use direct URL generation
    return this.http.get<ApiResponse<ProductDetail>>(this.apiConfig.getUrl(`product/${productId}`))
      .pipe(
        map(response => {
          if (response && response.success && response.data) {
            return response.data;
          } else {
            throw new Error('Invalid API response format');
          }
        }),
        catchError(error => {
          console.warn('API call failed', error);
          throw error;
        })
      );
  }

  // Search products
  searchProducts(query: string): Observable<ProductSearchResponse> {
    // Use the product-search endpoint as shown in the curl example
    const url = this.apiConfig.getUrl('product-search');
    console.log('Making search API request to:', url, 'with query:', query);
    
    // Create params with the search query
    const params = new HttpParams().set('query', query);
    
    return this.http.get<ApiResponse<Product[]>>(url, { params })
      .pipe(
        map(response => {
          console.log('Raw search API response:', response);
          
          // Handle the response format shown in the curl example:
          // {"success":true,"message":"Products retrieved successfully","data":[...]}
          if (response && response.success && response.data) {
            console.log('Search API response successful:', response);
            
            // Transform to match our ProductSearchResponse format
            return {
              results: response.data,
              totalResults: response.data.length
            };
          }
          else {
            console.warn('Search API response format not as expected:', response);
            throw new Error('Invalid search API response format');
          }
        }),
        catchError(error => {
          console.warn('Search API call failed, details:', error);
          console.warn('Error message:', error.message);
          console.warn('Status:', error.status, error.statusText);
          if (error.error) {
            console.warn('Error response:', error.error);
          }
          
          throw error;
        })
      );
  }

  // Get products by category
  getProductsByCategory(category: string): Observable<ProductCategoryResponse> {
    // Use direct URL generation with better debugging
    const url = this.apiConfig.getUrl(`products/category/${category}`);
    console.log('Making category API request to:', url);
    
    return this.http.get<any>(url)
      .pipe(
        map(response => {
          console.log('Raw category API response:', response);
          
          // Handle different response structures that might be returned
          if (response && response.success && response.data) {
            // Standard API wrapper: { success: true, message: "...", data: { ... } }
            console.log('Category API response successful using data wrapper:', response);
            
            // Transform to match our ProductCategoryResponse format
            if (Array.isArray(response.data)) {
              return {
                content: response.data,
                totalProducts: response.data.length
              };
            }
            return response.data;
          } 
          else if (response && response.content) {
            // Direct return of content: { content: [...], totalProducts: 10 }
            console.log('Category API response successful using direct content:', response);
            
            // If the response has totalElements instead of totalProducts, adapt it
            if (response.totalElements && !response.totalProducts) {
              return {
                content: response.content,
                totalProducts: response.totalElements
              };
            }
            
            return response;
          }
          else {
            console.warn('Category API response format not as expected:', response);
            throw new Error('Invalid category API response format');
          }
        }),
        catchError(error => {
          console.warn('Category API call failed, details:', error);
          throw error;
        })
      );
  }

  // Get product reviews
  getProductReviews(productId: number): Observable<ApiResponse<ProductReview[]>> {
    // Use direct URL generation
    return this.http.get<ApiResponse<ProductReview[]>>(this.apiConfig.getUrl(`product/${productId}/reviews`))
      .pipe(
        catchError(error => {
          console.warn('API call failed', error);
          throw error;
        })
      );
  }

  // Add product review
  addProductReview(productId: number, rating: number, comment: string): Observable<AddReviewResponse> {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      return throwError(() => ({
        status: 401,
        error: {
          message: 'Authentication required. Please log in to submit a review.'
        }
      }));
    }

    const headers = {
      'Authorization': `Bearer ${token}`
    };

    const params = new HttpParams()
      .set('rating', rating.toString())
      .set('comment', comment);

    // Use direct URL generation with query parameters
    return this.http.post<AddReviewResponse>(
      this.apiConfig.getUrl(`product/${productId}/review`),
      null,
      { headers, params }
    ).pipe(
      catchError(error => {
        console.warn('API call failed:', error);
        throw error;
      })
    );
  }

  // Helper function to get all available categories
  getCategories(): Observable<string[]> {
    // Try to get categories from a dedicated endpoint
    return this.http.get<ApiResponse<string[]>>(this.apiConfig.getUrl('categories'))
      .pipe(
        map(response => {
          if (response && response.success && response.data) {
            return response.data;
          }
          throw new Error('Invalid categories API response format');
        }),
        catchError(error => {
          console.warn('Failed to get categories, falling back to extraction from products', error);
          
          // If categories endpoint fails, extract from products
          return this.getProducts(0, 100).pipe(
            map(response => {
              if (response && response.content) {
                const categories = response.content.map(product => product.category);
                return [...new Set(categories)]; // Remove duplicates using Set
              }
              throw new Error('Failed to extract categories from products');
            })
          );
        })
      );
  }
} 