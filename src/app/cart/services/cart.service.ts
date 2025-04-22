import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, forkJoin, from, timer, switchMap, retry, delay } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { Product, ProductDetail } from '../../products/services/product.service';
import { ApiConfigService } from '../../core/services/api-config.service';
import { TokenManagerService } from '../../core/services/token-manager.service';

export interface CartItem {
  id: number;
  productId: number;  // Added productId to match API response
  name: string;       // Will map from productName in API
  price: number;
  image: string;      // Will map from productImage in API
  quantity: number;
  totalPrice?: number; // Added to match API response
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
}

export interface CartResponse {
  success?: boolean;
  message?: string;
  cart?: Cart;
  items?: CartItem[]; // For direct response from GET /api/cart
  totalItems?: number; // For direct response from GET /api/cart
  subtotal?: number; // For direct response from GET /api/cart
}

// Response for GET /api/cart
interface GetCartResponse {
  success: boolean;
  message: string;
  data?: Array<{
    id: number;
    productId: number;
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
  items?: CartItem[];
  totalItems?: number;
  subtotal?: number;
  cart?: Cart;
}

// Response for all cart modification endpoints
interface ModifyCartResponse {
  success: boolean;
  message: string;
  cart?: Cart;
  data?: Array<{
    id: number;
    productId: number;
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
  items?: CartItem[];
  totalItems?: number;
  subtotal?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Cart data subject
  private cartSubject = new BehaviorSubject<Cart>({
    items: [],
    totalItems: 0,
    subtotal: 0
  });

  // Expose the cart as an observable to components
  cart$ = this.cartSubject.asObservable();

  // Environment check
  private isLocalEnvironment = window.location.hostname === 'localhost';
  
  // Flag to prevent token creation after explicit logout
  private hasUserLoggedOut: boolean;

  constructor(
    private http: HttpClient,
    private apiConfigService: ApiConfigService,
    private tokenManager: TokenManagerService
  ) {
    console.log('CartService: Initializing...');
    
    // Initialize with empty cart
    this.cartSubject.next({
      items: [],
      totalItems: 0,
      subtotal: 0
    });

    // Check if user has explicitly logged out - do this before any token creation
    this.hasUserLoggedOut = localStorage.getItem('user_logged_out') === 'true';
    console.log('CartService: User logged out flag is:', this.hasUserLoggedOut);
    
    // If user has explicitly logged out, don't bother with tokens
    if (this.hasUserLoggedOut) {
      console.log('CartService: User has explicitly logged out, skipping cart initialization');
      return;
    }

    // Wait for token to be available before loading cart
    this.initializeCart();
  }

  private async initializeCart(): Promise<void> {
    try {
      console.log('CartService: Starting initialization...');
      
      // First try to load from localStorage while waiting for token
      const savedCart = this.loadCartFromStorage();
      if (savedCart) {
        console.log('CartService: Loading saved cart while waiting for token');
        this.cartSubject.next(savedCart);
      }
      
      // Skip local token creation - don't create test tokens anymore
      
      // Skip the rest of initialization if user has logged out
      if (this.hasUserLoggedOut) {
        console.log('CartService: User has explicitly logged out, skipping API fetch');
        return;
      }

      // Create a helper function for retry with exponential backoff
      const fetchCartWithRetry = async (attempt = 1): Promise<void> => {
        try {
          const maxAttempts = 3;
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          
          console.log(`CartService: Attempting to get token and fetch cart (attempt ${attempt}/${maxAttempts})`);
          
          const token = await this.tokenManager.ensureToken();
          if (token) {
            console.log('CartService: Token obtained, fetching cart from API');
            
            // Token available, fetch cart from API
            this.fetchCart().subscribe({
              next: (cart) => {
                console.log('CartService: Successfully loaded cart from API');
                this.cartSubject.next(cart);
              },
              error: (error) => {
                console.error('CartService: Error fetching cart:', error);
                
                // If auth error and we have retries left, try again after delay
                if (error.status === 401 && attempt < maxAttempts) {
                  console.log(`CartService: Auth error, retrying after ${backoffDelay}ms...`);
                  setTimeout(() => fetchCartWithRetry(attempt + 1), backoffDelay);
                  return;
                }
                
                // Keep using localStorage cart if API fails
                console.log('CartService: Using saved cart after API failures');
              }
            });
            
            return; // Successfully initialized
          }
          
          // If no token and we have retries left, try again
          if (attempt < maxAttempts) {
            console.log(`CartService: No token yet, waiting before retry ${backoffDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            return fetchCartWithRetry(attempt + 1);
          }
          
          console.log('CartService: Using local cart as fallback after all retries');
        } catch (error) {
          console.error('CartService: Error during cart fetch attempt:', error);
        }
      };
      
      // Start the retry process
      await fetchCartWithRetry();
      
    } catch (error) {
      console.error('CartService: Error during initialization:', error);
    }
  }

  // Get the current cart value
  get currentCart(): Cart {
    return this.cartSubject.getValue();
  }

  // 4.1 Get Cart Items - Retrieves the current state of the user's shopping cart
  fetchCart(): Observable<Cart> {
    console.log('CartService: Fetching cart from API');
    
    // First load from local storage to have something to show immediately
    const savedCart = this.loadCartFromStorage();
    
    // Always immediately update with local storage cart while waiting
    if (savedCart && savedCart.items && savedCart.items.length > 0) {
      // Make sure we update the cart subject right away so UI shows something
      this.cartSubject.next(savedCart);
    }
    
    // Function to perform API fetch with token
    const fetchFromApi = (token: string | null): Observable<Cart> => {
      if (!token) {
        console.log('CartService: No token available, using local cart');
        return savedCart 
          ? of(savedCart) 
          : of(this.cartSubject.getValue());
      }
      
      // Make the API call with our token - wrap in timer to avoid multiple rapid calls
      return timer(300).pipe(
        switchMap(() => {
          console.log('CartService: Making API call to fetch cart');
          
          // Simplest possible request - only Authorization header, nothing else
          return this.http.get<GetCartResponse>(
            this.apiConfigService.getUrl('/cart'),
            {
              headers: {
                'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
              }
            }
          ).pipe(
            // Handle successful response
            map(response => {
              console.log('CartService: Raw cart API response:', response);
              
              try {
                let cart: Cart;
                
                // If the response includes data array (new API format)
                if (response.data) {
                  console.log('CartService: Using data array from response');
                  
                  // Map API response to our CartItem structure
                  const items = response.data.map(item => ({
                    id: item.id,
                    productId: item.productId,
                    name: item.productName,
                    price: item.price,
                    image: item.productImage,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice
                  }));
                  
                  // Calculate totals
                  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
                  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
                  
                  cart = {
                    items,
                    totalItems,
                    subtotal
                  };
                } 
                // Support for direct response format
                else if (response.items) {
                  console.log('CartService: Using items array from response');
                  cart = {
                    items: response.items,
                    totalItems: response.totalItems || response.items.reduce((sum, item) => sum + item.quantity, 0),
                    subtotal: response.subtotal || response.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                  };
                }
                // If the response has cart object
                else if (response.cart) {
                  console.log('CartService: Using cart object from response');
                  cart = response.cart;
                }
                else {
                  console.warn('CartService: Unexpected API response format');
                  // Use empty cart as fallback
                  cart = { items: [], totalItems: 0, subtotal: 0 };
                }
                
                console.log('CartService: Processed cart from API:', cart);
                
                // Save cart to localStorage for offline use
                this.saveCart(cart);
                
                // Always update the cart subject
                this.cartSubject.next(cart);
                
                return cart;
              } catch (error) {
                console.error('CartService: Error processing cart data:', error);
                // Return saved cart as fallback
                return savedCart || { items: [], totalItems: 0, subtotal: 0 };
              }
            }),
            // Handle errors quietly without showing 401s in the console
            catchError(error => {
              if (error.status === 401) {
                console.log('CartService: Auth error (401) when fetching cart, using local cart');
              } else {
                console.error('CartService: Error fetching cart from API:', error);
              }
              
              // Return saved cart as fallback
              return of(savedCart || { items: [], totalItems: 0, subtotal: 0 });
            })
          );
        })
      );
    };
    
    // Use the token manager with promise but don't retry - let the component handle retry logic
    return from(this.tokenManager.ensureToken()).pipe(
      delay(100), // Small delay to let token processing finish
      switchMap(token => fetchFromApi(token)),
      catchError(error => {
        console.log('CartService: Error in fetchCart token handling:', error);
        return of(savedCart || { items: [], totalItems: 0, subtotal: 0 });
      })
    );
  }

  // 4.2 Add to Cart - Adds a selected product to the user's cart
  addToCart(product: Product | ProductDetail, quantity: number = 1): Observable<Cart> {
    // First ensure we have a token
    return from(this.tokenManager.ensureToken()).pipe(
      mergeMap(token => {
        console.log('CartService: Token ready for add to cart:', !!token);
        
        // If no token is available, still allow adding to local cart
        if (!token) {
          console.warn('CartService: No authentication token available, adding to local cart only');
          return this.addToLocalCart(product, quantity);
        }
        
        return this.http.post<ModifyCartResponse>(
          this.apiConfigService.getUrl(`/cart-add/${product.id}`),
          null,
          { params: { quantity: quantity.toString() } }
        ).pipe(
          switchMap(response => {
            if (response && response.success) {
              // Parse the cart using our helper method which handles various response formats
              const parsedCart = this.parseCartResponse(response);
              console.log('CartService: Add to cart successful:', parsedCart);
              this.cartSubject.next(parsedCart);
              this.saveCart(parsedCart);
              
              // Force refresh the cart count in header
              this.refreshCartCount();
              
              return of(parsedCart);
            } else {
              console.warn('CartService: Server returned non-success response');
              return this.addToLocalCart(product, quantity);
            }
          }),
          catchError(error => {
            console.error('Error adding item to cart:', error);
            
            // Handle unauthorized or API errors by updating local storage directly
            if (error.status === 401 || error.status === 0) {
              console.warn('API error when adding to cart. Updating local storage directly.');
              return this.addToLocalCart(product, quantity);
            }
            
            return throwError(() => new Error('Failed to add item to cart. Please try again.'));
          })
        );
      })
    );
  }
  
  // Helper method to add to local cart
  private addToLocalCart(product: Product | ProductDetail, quantity: number): Observable<Cart> {
    // Create a new cart item from the product
    const item: CartItem = {
      id: Math.floor(Math.random() * 100000), // Generate a temporary ID
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.imageUrl || '',
      quantity: quantity,
      totalPrice: product.price * quantity
    };
    
    // Get current cart and add the item
    const currentCart = this.currentCart;
    const existingItemIndex = currentCart.items.findIndex(i => i.productId === product.id);
    
    let updatedCart: Cart;
    
    if (existingItemIndex !== -1) {
      // Update existing item
      const updatedItems = [...currentCart.items];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].totalPrice = 
        updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
      
      updatedCart = {
        items: updatedItems,
        totalItems: currentCart.totalItems + quantity,
        subtotal: currentCart.subtotal + (product.price * quantity)
      };
    } else {
      // Add new item
      updatedCart = {
        items: [...currentCart.items, item],
        totalItems: currentCart.totalItems + quantity,
        subtotal: currentCart.subtotal + (product.price * quantity)
      };
    }
    
    // Update state and save to localStorage
    this.cartSubject.next(updatedCart);
    this.saveCart(updatedCart);
    this.refreshCartCount();
    return of(updatedCart);
  }

  // 4.3 Update Cart Item - Updates the quantity of an item already in the cart
  updateQuantity(itemId: number, quantity: number): Observable<Cart> {
    console.log(`CartService: Updating quantity for item ${itemId} to ${quantity}`);
    
    // Enforce minimum quantity of 1
    if (quantity <= 0) {
      console.log('CartService: Received quantity <= 0, enforcing minimum of 1');
      quantity = 1;
    }
    
    // Add a delay to ensure token is loaded
    return timer(300).pipe(
      switchMap(() => {
        console.log('CartService: Ensuring token is available before update operation');
        // First ensure we have a token
        return from(this.tokenManager.ensureToken()).pipe(
          mergeMap(token => {
            console.log('CartService: Token ready for update quantity:', !!token);
            
            // If no token available, update local cart only
            if (!token) {
              console.log('CartService: No token available, updating local cart only');
              return this.updateLocalCartQuantity(itemId, quantity);
            }
            
            // Format token correctly
            const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            
            // According to API docs, we need to use PATCH with query parameter for quantity
            const apiUrl = this.apiConfigService.getUrl(`/cart-update/${itemId}`);
            
            // Log the exact request format for debugging
            console.log(`CartService: Sending EXACT API FORMAT: PATCH ${apiUrl}?quantity=${quantity}`);
            
            // Send request with query parameter format exactly as shown in API docs
            // Note: The only parameter is a query parameter - no body
            return this.http.patch<ModifyCartResponse>(
              apiUrl,
              null, // Explicitly set body to null
              { 
                params: { quantity: quantity.toString() }, // Add quantity as query param
                headers: { 'Authorization': authToken },
                observe: 'body' // Observe only the response body
              }
            ).pipe(
              tap(response => console.log('CartService: Update quantity response:', response)),
              switchMap(response => {
                // Check if the server returned a success response
                if (response && response.success) {
                  // Parse the cart data using our helper method
                  const parsedCart = this.parseCartResponse(response);
                  
                  // If the parsed cart has items, use it
                  if (parsedCart && Array.isArray(parsedCart.items)) {
                    console.log('CartService: Cart updated successfully:', parsedCart);
                    this.cartSubject.next(parsedCart);
                    this.saveCart(parsedCart);
                    this.refreshCartCount();
                    return of(parsedCart);
                  } else {
                    // If success but invalid cart, fetch the latest cart
                    console.log('CartService: Server returned success but no valid cart data, fetching latest cart');
                    return this.fetchCart();
                  }
                } else {
                  console.warn('CartService: Server returned non-success response');
                  return this.updateLocalCartQuantity(itemId, quantity);
                }
              }),
              catchError(error => {
                console.error('Error updating cart:', error);
                console.log('CartService: Error details:', {
                  status: error.status,
                  statusText: error.statusText,
                  message: error.message,
                  url: error.url,
                  error: error.error
                });
                
                // For auth failures
                if (error.status === 401) {
                  console.log('CartService: Authentication failed, updating locally');
                  return this.updateLocalCartQuantity(itemId, quantity);
                }
                
                // For Bad Request errors (400), log more information and update locally
                if (error.status === 400) {
                  console.log('CartService: API returned Bad Request (400). Updating locally instead.');
                  return this.updateLocalCartQuantity(itemId, quantity);
                }
                
                // For server errors or other issues
                console.log('CartService: API update failed with status ' + error.status + ', updating locally');
                return this.updateLocalCartQuantity(itemId, quantity);
              })
            );
          })
        );
      })
    );
  }

  // Helper method to update cart locally
  private updateLocalCartQuantity(itemId: number, quantity: number): Observable<Cart> {
    console.log('CartService: Updating quantity locally for item', itemId, 'to', quantity);
    
    // Get current cart and find item
    const currentCart = this.currentCart;
    const itemIndex = currentCart.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      console.warn(`CartService: Item ${itemId} not found in cart`);
      return of(currentCart);
    }
    
    // Create updated items array with new quantity
    const updatedItems = [...currentCart.items];
    
    // Get the current quantity
    const oldQuantity = updatedItems[itemIndex].quantity;
    
    // Update the quantity
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      quantity: quantity,
      totalPrice: updatedItems[itemIndex].price * quantity
    };
    
    // Calculate the change in quantity
    const quantityDifference = quantity - oldQuantity;
    
    // Create updated cart with new totals
    const updatedCart: Cart = {
      items: updatedItems,
      totalItems: currentCart.totalItems + quantityDifference,
      subtotal: currentCart.subtotal + (updatedItems[itemIndex].price * quantityDifference)
    };
    
    // Update state and save to localStorage
    this.cartSubject.next(updatedCart);
    this.saveCart(updatedCart);
    
    // Force refresh the cart count in header
    this.refreshCartCount();
    
    return of(updatedCart);
  }

  // 4.4 Remove from Cart - Removes an item from the shopping cart
  removeItem(itemId: number): Observable<Cart> {
    console.log(`CartService: Removing item ${itemId} from cart`);
    
    // Add a delay to ensure token is loaded
    return timer(300).pipe(
      switchMap(() => {
        console.log('CartService: Ensuring token is available before remove operation');
        // First ensure we have a token
        return from(this.tokenManager.ensureToken()).pipe(
          mergeMap(token => {
            console.log('CartService: Token ready for remove item:', !!token);
            
            // If no token, use local cart only
            if (!token) {
              console.log('CartService: No token available for remove, using local update');
              return this.removeItemLocally(itemId);
            }
            
            // According to API docs, we need to use DELETE with the cart-delete endpoint
            const apiUrl = this.apiConfigService.getUrl(`/cart-delete/${itemId}`);
            console.log('CartService: Sending DELETE request to:', apiUrl);
            
            // Format token correctly
            const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            
            // Make DELETE request with only Authorization header as shown in the API docs
            return this.http.delete<ModifyCartResponse>(
              apiUrl,
              {
                headers: {
                  'Authorization': authToken
                }
              }
            ).pipe(
              tap(response => console.log('CartService: Remove item response:', response)),
              switchMap(response => {
                // Check if the server returned a success response
                if (response && response.success) {
                  // Parse the cart data using our helper method
                  const parsedCart = this.parseCartResponse(response);
                  
                  // If the parsed cart has items, use it
                  if (parsedCart && Array.isArray(parsedCart.items)) {
                    console.log('CartService: Item removed successfully from cart');
                    this.cartSubject.next(parsedCart);
                    this.saveCart(parsedCart);
                    this.refreshCartCount();
                    return of(parsedCart);
                  } else {
                    // If success but invalid cart, fetch the latest cart
                    console.log('CartService: Server returned success but no valid cart data, fetching latest cart');
                    return this.fetchCart();
                  }
                } else {
                  console.warn('CartService: Server returned non-success response');
                  return this.removeItemLocally(itemId);
                }
              }),
              catchError(error => {
                console.error('Error removing cart item:', error);
                console.log('CartService: Error details:', {
                  status: error.status,
                  statusText: error.statusText,
                  message: error.message,
                  url: error.url
                });
                
                // For auth failures
                if (error.status === 401) {
                  console.log('CartService: Authentication failed, removing locally');
                  return this.removeItemLocally(itemId);
                }
                
                // For server errors or other issues
                console.log('CartService: API remove failed, removing locally');
                return this.removeItemLocally(itemId);
              })
            );
          })
        );
      })
    );
  }
  
  // Helper method to remove item locally
  private removeItemLocally(itemId: number): Observable<Cart> {
    console.log('CartService: Removing item locally:', itemId);
    
    // Get current cart
    const currentCart = this.currentCart;
    const itemIndex = currentCart.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      console.warn(`CartService: Item ${itemId} not found in cart`);
      return of(currentCart);
    }
    
    // Get the item being removed for calculations
    const removedItem = currentCart.items[itemIndex];
    
    // Create updated items array without the removed item
    const updatedItems = currentCart.items.filter(item => item.id !== itemId);
    
    // Create updated cart with new totals
    const updatedCart: Cart = {
      items: updatedItems,
      totalItems: currentCart.totalItems - removedItem.quantity,
      subtotal: currentCart.subtotal - (removedItem.price * removedItem.quantity)
    };
    
    // Update state and save to localStorage
    this.cartSubject.next(updatedCart);
    this.saveCart(updatedCart);
    
    // Force refresh the cart count in header
    this.refreshCartCount();
    
    return of(updatedCart);
  }

  // Clear entire cart (convenience method)
  clearCart(): Observable<Cart> {
    console.log('CartService: Clearing cart');
    const currentCart = this.currentCart;
    
    // If cart is already empty, just return it
    if (currentCart.items.length === 0) {
      console.log('CartService: Cart is already empty');
      return of(currentCart);
    }
    
    const emptyCart: Cart = { items: [], totalItems: 0, subtotal: 0 };
    
    // Add a delay to ensure token is loaded
    return timer(300).pipe(
      switchMap(() => {
        console.log('CartService: Ensuring token is available before clear operation');
        // First ensure we have a token
        return from(this.tokenManager.ensureToken()).pipe(
          mergeMap(token => {
            console.log('CartService: Token ready for clear cart:', !!token);
            
            // If no token, clear local cart only
            if (!token) {
              console.log('CartService: No token available, clearing local cart only');
              this.cartSubject.next(emptyCart);
              this.saveCart(emptyCart);
              this.refreshCartCount();
              return of(emptyCart);
            }
            
            // Based on server error logs, there is no /cart-clear endpoint
            // Instead, use the clearCartByRemovingItems approach directly
            console.log('CartService: Clearing cart by removing items one by one');
            return this.clearCartByRemovingItems().pipe(
              catchError(error => {
                console.error('Error clearing cart by removing items:', error);
                // Last resort: just clear the local cart
                this.cartSubject.next(emptyCart);
                this.saveCart(emptyCart);
                this.refreshCartCount();
                return of(emptyCart);
              })
            );
          })
        );
      })
    );
  }
  
  // Helper method that clears the cart by removing all items one by one
  private clearCartByRemovingItems(): Observable<Cart> {
    const currentCart = this.currentCart;
    const itemIds = currentCart.items.map(item => item.id);
    
    // If cart is already empty, just return it
    if (itemIds.length === 0) {
      console.log('CartService: No items to remove');
      return of(currentCart);
    }
    
    console.log('CartService: Removing all items one by one:', itemIds);
    
    // Create an observable for each item removal
    const removeObservables = itemIds.map(id => this.removeItem(id));
    
    // Use forkJoin to run all removals in parallel and return when all are complete
    return forkJoin(removeObservables).pipe(
      map(() => {
        const emptyCart: Cart = { items: [], totalItems: 0, subtotal: 0 };
        console.log('CartService: All items removed successfully');
        // The cart subject should already be updated by each removeItem call,
        // but we'll ensure it's empty here
        this.cartSubject.next(emptyCart);
        this.saveCart(emptyCart);
        this.refreshCartCount();
        return emptyCart;
      }),
      catchError(error => {
        console.error('Error removing items during cart clear:', error);
        
        // Force refresh from the API to get the current state
        return this.fetchCart();
      })
    );
  }

  // Save cart to localStorage as backup
  private saveCart(cart: Cart): void {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  // Load cart from localStorage
  private loadCartFromStorage(): Cart | null {
    const savedCart = localStorage.getItem('cart');
    
    if (savedCart) {
      try {
        return JSON.parse(savedCart) as Cart;
      } catch (error) {
        console.error('Error parsing saved cart:', error);
        return null;
      }
    }
    
    return null;
  }
  
  // Test method to manually fetch cart with a token - NO LONGER USED
  testCartApiWithToken(token: string): Observable<any> {
    // This method is removed as requested
    console.log('API token test method has been disabled');
    return of(null);
  }
  
  // Add a new method to diagnose interceptor issues - NO LONGER USED
  debugAuthInterceptor(): void {
    // This method is removed as requested
    console.log('Auth interceptor debug method has been disabled');
  }

  // Helper method to properly parse cart data from different response formats
  private parseCartResponse(response: any): Cart {
    console.log('CartService: Parsing cart response:', response);
    
    // Default empty cart to return if we can't parse the response
    const emptyCart: Cart = { items: [], totalItems: 0, subtotal: 0 };
    
    try {
      // If the response includes an explicit cart object, use it
      if (response.cart && typeof response.cart === 'object') {
        console.log('CartService: Using cart object from response');
        // Make sure the cart has the expected structure
        const cart = response.cart as Cart;
        if (!Array.isArray(cart.items)) {
          cart.items = [];
        }
        if (typeof cart.totalItems !== 'number') {
          cart.totalItems = cart.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
        }
        if (typeof cart.subtotal !== 'number') {
          cart.subtotal = cart.items.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
        }
        return cart;
      }
      
      // If the response has a data array (API format with item details)
      else if (Array.isArray(response.data)) {
        console.log('CartService: Using data array from response');
        
        // Map API response to our CartItem structure
        const items = response.data.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          name: item.productName,
          price: item.price,
          image: item.productImage,
          quantity: item.quantity,
          totalPrice: item.totalPrice
        }));
        
        // Calculate totals
        const totalItems = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
        const subtotal = items.reduce((sum: number, item: CartItem) => sum + (item.totalPrice || 0), 0);
        
        return {
          items,
          totalItems,
          subtotal
        };
      }
      
      // If the response has direct items array
      else if (Array.isArray(response.items)) {
        console.log('CartService: Using items array from response');
        
        const totalItems = response.totalItems || 
          response.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
        
        const subtotal = response.subtotal || 
          response.items.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
        
        return {
          items: response.items,
          totalItems,
          subtotal
        };
      }
      
      // Fall back to empty cart if response format is unexpected
      console.warn('CartService: Unexpected response format, returning empty cart');
      return emptyCart;
    } catch (error) {
      console.error('CartService: Error parsing cart response:', error);
      return emptyCart;
    }
  }

  // Add a method to force refresh the cart count
  refreshCartCount(): void {
    console.log('CartService: Force refreshing cart count in header');
    
    // Use setTimeout to ensure this runs outside the current change detection cycle
    setTimeout(() => {
      // Get current cart value and create a completely new object to force change detection
      const currentCart = this.cartSubject.getValue();
      
      // Create a deep copy of the cart with completely new object identities
      const newCart: Cart = {
        items: [...currentCart.items.map(item => ({...item}))],
        totalItems: currentCart.totalItems,
        subtotal: currentCart.subtotal
      };
      
      console.log('CartService: Emitting new cart with totalItems:', newCart.totalItems);
      
      // Emit the new cart object to all subscribers
      this.cartSubject.next(newCart);
    }, 0);
  }
} 