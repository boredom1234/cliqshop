import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CartService } from './services/cart.service';
import { FormsModule } from '@angular/forms';

import { CartRoutingModule } from './cart-routing.module';
import { CartPageComponent } from './cart-page/cart-page.component';
import { CartItemComponent } from './cart-item/cart-item.component';
import { CartSummaryComponent } from './cart-summary/cart-summary.component';

@NgModule({
  declarations: [],  // We don't need to declare standalone components
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    CartRoutingModule,
    // Import standalone components
    CartPageComponent,
    CartItemComponent, 
    CartSummaryComponent
  ],
  providers: [CartService]
})
export class CartModule { }
