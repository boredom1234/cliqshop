import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { OrderService } from './services/order.service';

import { OrderRoutingModule } from './order-routing.module';
import { CheckoutComponent } from './checkout/checkout.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { OrderSuccessComponent } from './order-success/order-success.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OrderRoutingModule,
    HttpClientModule,
    CheckoutComponent,
    OrderHistoryComponent,
    OrderDetailsComponent,
    OrderSuccessComponent
  ],
  providers: [OrderService]
})
export class OrderModule { }
