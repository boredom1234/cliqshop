import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from './services/admin.service';
import { AdminRoutingModule } from './admin-routing.module';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

// Import all standalone components
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminProfileComponent } from './admin-profile/admin-profile.component';
import { AdminProfileListComponent } from './admin-profile-list/admin-profile-list.component';
import { AdminStaffListComponent } from './admin-staff-list/admin-staff-list.component';
import { AdminStaffAddComponent } from './admin-staff-add/admin-staff-add.component';
import { AdminStaffDetailsComponent } from './admin-staff-details/admin-staff-details.component';
import { AdminStockLowComponent } from './admin-stock-low/admin-stock-low.component';
import { AdminStockBulkUpdateComponent } from './admin-stock-bulk-update/admin-stock-bulk-update.component';
import { AdminProductListComponent } from './admin-product-list/admin-product-list.component';
import { AdminProductAddComponent } from './admin-product-add/admin-product-add.component';
import { AdminProductEditComponent } from './admin-product-edit/admin-product-edit.component';
import { AdminOrderListComponent } from './admin-order-list/admin-order-list.component';
import { AdminUserListComponent } from './admin-user-list/admin-user-list.component';
import { AdminDevLoginComponent } from './admin-dev-login/admin-dev-login.component';
import { DashboardChartsComponent } from './admin-dashboard/dashboard-charts/dashboard-charts.component';
import { AdminReportsComponent } from './admin-reports/admin-reports.component';
import { AdminLogsComponent } from './admin-logs/admin-logs.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    // Register all standalone components in imports
    AdminLayoutComponent,
    AdminDashboardComponent,
    AdminProfileComponent,
    AdminProfileListComponent,
    AdminStaffListComponent,
    AdminStaffAddComponent,
    AdminStaffDetailsComponent,
    AdminStockLowComponent,
    AdminStockBulkUpdateComponent,
    AdminProductListComponent,
    AdminProductAddComponent,
    AdminProductEditComponent,
    AdminOrderListComponent,
    AdminUserListComponent,
    AdminDevLoginComponent,
    DashboardChartsComponent,
    AdminReportsComponent,
    AdminLogsComponent
  ],
  providers: [
    AdminService,
    provideCharts(withDefaultRegisterables())
  ]
})
export class AdminModule { }
