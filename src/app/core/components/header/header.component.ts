import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../../auth/services/auth.service';
import { CartService } from '../../../cart/services/cart.service';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  showUserMenu = false;
  cartItemCount$ = new BehaviorSubject<number>(0);
  isLoggedIn$ = new BehaviorSubject<boolean>(false);
  isAdmin$ = new BehaviorSubject<boolean>(false);
  isStaff$ = new BehaviorSubject<boolean>(false);
  userName$ = new BehaviorSubject<string>('');
  currentUser: User | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private elementRef: ElementRef
  ) {
    console.log('Header Component constructed');
  }

  ngOnInit(): void {
    console.log('Header Component initialized');
    
    // Subscribe to cart changes with more robust error handling
    const cartSub = this.cartService.cart$.pipe(
      map(cart => cart?.totalItems ?? 0),
      distinctUntilChanged() // Only react when the count actually changes
    ).subscribe({
      next: (count) => {
        console.log('HeaderComponent: Cart count updated:', count);
        this.cartItemCount$.next(count);
      },
      error: (err) => {
        console.error('HeaderComponent: Error in cart subscription:', err);
        // If there's an error, don't change the current value
      }
    });
    
    this.subscriptions.push(cartSub);
    
    // Check if user has explicitly logged out
    const hasLoggedOut = localStorage.getItem('user_logged_out') === 'true';
    if (hasLoggedOut) {
      console.log('Header: User has explicitly logged out, forcing logged out state');
      this.isLoggedIn$.next(false);
      this.isAdmin$.next(false);
      this.isStaff$.next(false);
      this.userName$.next('');
      this.currentUser = null;
      return;
    }
    
    // Subscribe to user changes
    const userSub = this.authService.currentUser$.subscribe(user => {
      console.log('Header: User state changed:', user);
      this.currentUser = user;
      this.isLoggedIn$.next(!!user);
      this.isAdmin$.next(user?.role === 'ADMIN');
      this.isStaff$.next(user?.role === 'STAFF');
      this.userName$.next(user?.name || '');
    });
    
    // Add to subscriptions array for cleanup
    this.subscriptions.push(userSub);
    
    // Check login state immediately
    this.checkAuthState();
    
    // Initial fetch of cart count
    this.updateCartCount();
  }
  
  // Update cart count manually
  private updateCartCount(): void {
    const currentCart = this.cartService.currentCart;
    if (currentCart) {
      console.log('HeaderComponent: Initial cart count:', currentCart.totalItems);
      this.cartItemCount$.next(currentCart.totalItems);
    }
  }
  
  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Force a check of the current auth state
  private checkAuthState(): void {
    // Check if user has explicitly logged out
    const hasLoggedOut = localStorage.getItem('user_logged_out') === 'true';
    if (hasLoggedOut) {
      console.log('Header: User has explicitly logged out, forcing logged out state');
      this.isLoggedIn$.next(false);
      this.isAdmin$.next(false);
      this.isStaff$.next(false);
      this.userName$.next('');
      this.currentUser = null;
      return;
    }
    
    const isLoggedIn = this.authService.isLoggedIn;
    const user = this.authService.currentUser;
    
    console.log('Header: Checking auth state manually');
    console.log('Header: Is logged in?', isLoggedIn);
    console.log('Header: Current user:', user);
    
    this.isLoggedIn$.next(isLoggedIn);
    this.isAdmin$.next(user?.role === 'ADMIN');
    this.isStaff$.next(user?.role === 'STAFF');
    this.userName$.next(user?.name || '');
    this.currentUser = user;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    console.log('User menu toggled:', this.showUserMenu);
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const isClickInside = this.elementRef.nativeElement.contains(event.target);
    if (!isClickInside && this.showUserMenu) {
      this.showUserMenu = false;
    }
  }

  logout(): void {
    console.log('Logout clicked in header');
    this.showUserMenu = false;
    this.authService.logout();
    // No need to navigate, AuthService handles it with a force refresh
  }
}
