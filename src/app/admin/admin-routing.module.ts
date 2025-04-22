import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

// Import standalone components
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminProductListComponent } from './admin-product-list/admin-product-list.component';
import { AdminProductAddComponent } from './admin-product-add/admin-product-add.component';
import { AdminProductEditComponent } from './admin-product-edit/admin-product-edit.component';
import { AdminOrderListComponent } from './admin-order-list/admin-order-list.component';
import { AdminOrderDetailsComponent } from './admin-order-details/admin-order-details.component';
import { AdminUserListComponent } from './admin-user-list/admin-user-list.component';
import { AdminProfileComponent } from './admin-profile/admin-profile.component';
import { AdminProfileListComponent } from './admin-profile-list/admin-profile-list.component';
import { AdminStaffListComponent } from './admin-staff-list/admin-staff-list.component';
import { AdminStaffAddComponent } from './admin-staff-add/admin-staff-add.component';
import { AdminStaffDetailsComponent } from './admin-staff-details/admin-staff-details.component';
import { AdminStockLowComponent } from './admin-stock-low/admin-stock-low.component';
import { AdminStockBulkUpdateComponent } from './admin-stock-bulk-update/admin-stock-bulk-update.component';
import { AdminDevLoginComponent } from './admin-dev-login/admin-dev-login.component';
import { AdminReportsComponent } from './admin-reports/admin-reports.component';
import { AdminLogsComponent } from './admin-logs/admin-logs.component';

const routes: Routes = [
  {
    path: 'dev-login',
    component: AdminDevLoginComponent
  },
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: AdminDashboardComponent
      },
      {
        path: 'products',
        component: AdminProductListComponent
      },
      {
        path: 'products/add',
        component: AdminProductAddComponent
      },
      {
        path: 'products/edit/:id',
        component: AdminProductEditComponent
      },
      {
        path: 'orders',
        component: AdminOrderListComponent
      },
      {
        path: 'orders/:id',
        component: AdminOrderDetailsComponent
      },
      {
        path: 'users',
        component: AdminUserListComponent
      },
      {
        path: 'profile',
        component: AdminProfileComponent
      },
      {
        path: 'profiles',
        component: AdminProfileListComponent
      },
      {
        path: 'staff',
        component: AdminStaffListComponent
      },
      {
        path: 'staff/add',
        component: AdminStaffAddComponent
      },
      {
        path: 'staff/:id',
        component: AdminStaffDetailsComponent
      },
      {
        path: 'stock/low',
        component: AdminStockLowComponent
      },
      {
        path: 'stock/bulk-update',
        component: AdminStockBulkUpdateComponent
      },
      {
        path: 'reports',
        component: AdminReportsComponent
      },
      {
        path: 'logs',
        component: AdminLogsComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
