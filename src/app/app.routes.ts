import { Routes } from '@angular/router';
import { TokenReadyGuard } from './core/guards/token-ready.guard';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) 
  },
  { 
    path: 'auth', 
    children: [
      { 
        path: 'login', 
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) 
      },
      { 
        path: 'register', 
        loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) 
      },
      { 
        path: 'forgot-password', 
        loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) 
      },
      { 
        path: 'verify-otp', 
        loadComponent: () => import('./auth/verify-otp/verify-otp.component').then(m => m.VerifyOtpComponent) 
      },
      { 
        path: 'reset-password', 
        loadComponent: () => import('./auth/password-reset/password-reset.component').then(m => m.PasswordResetComponent) 
      }
    ]
  },
  { 
    path: 'products', 
    children: [
      { 
        path: '', 
        loadComponent: () => import('./products/product-list/product-list.component').then(m => m.ProductListComponent) 
      },
      { 
        path: ':id', 
        loadComponent: () => import('./products/product-details/product-details.component').then(m => m.ProductDetailsComponent) 
      }
    ]
  },
  { 
    path: 'cart', 
    loadComponent: () => import('./cart/cart-page/cart-page.component').then(m => m.CartPageComponent),
    canActivate: [TokenReadyGuard]
  },
  { 
    path: 'checkout', 
    loadComponent: () => import('./order/checkout/checkout.component').then(m => m.CheckoutComponent) 
  },
  { 
    path: 'order-success/:id', 
    loadComponent: () => import('./order/order-success/order-success.component').then(m => m.OrderSuccessComponent) 
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
  },
  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then(m => m.UserModule),
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];
