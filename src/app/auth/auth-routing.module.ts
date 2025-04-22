import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { VerifyOtpComponent } from './verify-otp/verify-otp.component';

// TODO: Add routes for the auth module
/* These are the routes for the auth module */

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify-otp', component: VerifyOtpComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: PasswordResetComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
// const routes: Routes = [
//   { path: '', loadChildren: () => import('./products/products.module').then(m => m.ProductsModule) },
//   { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
//   { path: 'cart', loadChildren: () => import('./cart/cart.module').then(m => m.CartModule) },
//   { path: 'order', loadChildren: () => import('./order/order.module').then(m => m.OrderModule) },
//   { path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) },
//   { path: '**', redirectTo: '' }
// ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
