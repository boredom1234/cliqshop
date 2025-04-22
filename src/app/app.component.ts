import { Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './core/components/header/header.component';
import { FooterComponent } from './core/components/footer/footer.component';
import { AuthService } from './auth/services/auth.service';
import { TokenManagerService } from './core/services/token-manager.service';
import { AuthSyncService } from './core/services/auth-sync.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'cliqshop';
  
  constructor(
    private authService: AuthService,
    private tokenManager: TokenManagerService,
    private authSyncService: AuthSyncService,
    private router: Router,
    private renderer: Renderer2
  ) {
    // Listen to route changes to update body class
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Remove all possible admin route classes first
      this.renderer.removeClass(document.body, 'admin-page');
      this.renderer.removeClass(document.body, 'admin-dashboard-page');
      this.renderer.removeClass(document.body, 'shop-page');
      this.renderer.removeClass(document.body, 'admin-view');
      
      if (this.isAdminRoute()) {
        console.log('Admin route detected:', this.router.url);
        this.renderer.addClass(document.body, 'admin-page');
        this.renderer.addClass(document.body, 'admin-view');
        
        // Add specific class for dashboard
        if (this.isAdminDashboardRoute()) {
          console.log('Admin dashboard route detected');
          this.renderer.addClass(document.body, 'admin-dashboard-page');
          
          // Ensure critical angular components are visible after a slight delay
          setTimeout(() => {
            console.log('Enforcing admin dashboard visibility');
            this.enforceAdminDashboardVisibility();
          }, 500);
        }
      } else {
        this.renderer.addClass(document.body, 'shop-page');
      }
    });
  }
  
  isAdminRoute(): boolean {
    const url = this.router.url;
    return url.startsWith('/admin') && url !== '/admin/dev-login';
  }
  
  isAdminDashboardRoute(): boolean {
    const url = this.router.url;
    return url === '/admin/dashboard' || url === '/admin' || url === '/admin/';
  }
  
  enforceAdminDashboardVisibility(): void {
    // Force dashboard to be visible through direct DOM manipulation
    const dashboard = document.querySelector('app-admin-dashboard');
    const adminLayout = document.querySelector('app-admin-layout');
    const adminContent = document.querySelector('.admin-content');
    const adminMain = document.querySelector('.admin-main');
    
    if (dashboard) {
      console.log('Found dashboard element, enforcing visibility');
      dashboard.setAttribute('style', 'display: block !important; visibility: visible !important; opacity: 1 !important; width: 100% !important; min-height: 600px !important;');
    }
    
    if (adminLayout) {
      console.log('Found admin layout element, enforcing visibility');
      adminLayout.setAttribute('style', 'display: block !important; visibility: visible !important; opacity: 1 !important; width: 100% !important;');
    }
    
    if (adminContent) {
      console.log('Found admin content element, enforcing visibility');
      adminContent.setAttribute('style', 'display: block !important; visibility: visible !important; opacity: 1 !important; width: 100% !important;');
    }
    
    if (adminMain) {
      console.log('Found admin main element, enforcing visibility');
      adminMain.setAttribute('style', 'display: block !important; visibility: visible !important; opacity: 1 !important; width: 100% !important; padding: 30px !important;');
    }
  }
  
  ngOnInit() {
    // Apply initial body class based on route
    if (this.isAdminRoute()) {
      this.renderer.addClass(document.body, 'admin-page');
      this.renderer.addClass(document.body, 'admin-view');
      
      if (this.isAdminDashboardRoute()) {
        this.renderer.addClass(document.body, 'admin-dashboard-page');
        
        // Ensure dashboard is visible
        setTimeout(() => {
          this.enforceAdminDashboardVisibility();
        }, 500);
      }
    } else {
      this.renderer.addClass(document.body, 'shop-page');
    }
    
    // Check if user has explicitly logged out
    const hasLoggedOut = localStorage.getItem('user_logged_out') === 'true';
    if (hasLoggedOut) {
      console.log('🔒 App Component: User has explicitly logged out, skipping token retrieval');
      return;
    }
    
    // Test token retrieval at application startup
    console.log('🔒 App Component: Testing auth token retrieval');
    const token = this.authService.getToken();
    console.log('🔒 App Component: Auth token available:', !!token);
    
    if (token) {
      console.log('🔒 App Component: First 20 chars of token:', token.substring(0, 20) + '...');
      
      // Sync token to other tabs
      this.authSyncService.syncCurrentToken();
    }
    
    // Also test token manager
    this.tokenManager.ensureToken().then(managerToken => {
      console.log('🔒 App Component: Token manager token available:', !!managerToken);
      if (managerToken) {
        console.log('🔒 App Component: First 20 chars of manager token:', managerToken.substring(0, 20) + '...');
      }
    });
  }
}
