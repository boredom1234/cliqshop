import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, LowStockProduct } from '../services/admin.service';
import { HttpClientModule } from '@angular/common/http';
import { ProductService } from '../services/product.service';
import { AdminProduct } from '../services/admin.service';

@Component({
  selector: 'app-admin-stock-low',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  template: `
    <div class="low-stock-container">
      <div class="low-stock-header">
        <div>
          <h1>Low Stock Products</h1>
          <p>Products with stock levels below threshold</p>
        </div>
        <div class="header-actions">
          <div class="threshold-input">
            <label for="threshold">Threshold:</label>
            <input 
              type="number"
              id="threshold"
              [(ngModel)]="threshold"
              min="1"
              (change)="onThresholdChange()"
            >
          </div>
          <a routerLink="/admin/stock/bulk-update" class="bulk-update-btn">Bulk Update Stock</a>
        </div>
      </div>
      
      <div class="low-stock-content" *ngIf="lowStockProducts.length > 0">
        <div class="products-table-container">
          <table class="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let product of lowStockProducts">
                <td>{{ product.id }}</td>
                <td>{{ product.name }}</td>
                <td>{{ product.category }}</td>
                <td>
                  <span [ngClass]="{
                    'critical': product.stock <= 5,
                    'warning': product.stock > 5 && product.stock <= 10
                  }">
                    {{ product.stock }}
                  </span>
                </td>
                <td>{{ product.price | currency }}</td>
                <td>
                  <div class="stock-update-input">
                    <input 
                      type="number"
                      [min]="0"
                      [(ngModel)]="productStockUpdates[product.id]"
                      placeholder="New Quantity"
                    >
                    <button 
                      class="update-btn"
                      [disabled]="productStockUpdates[product.id] === undefined || productStockUpdates[product.id] === null || isUpdating[product.id]"
                      (click)="updateStock(product.id)"
                    >
                      {{ isUpdating[product.id] ? 'Updating...' : 'Update' }}
                    </button>
                  </div>
                  <div class="success-message" *ngIf="updateSuccess[product.id]">
                    ✓ Updated
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="empty-state" *ngIf="!isLoading && lowStockProducts.length === 0">
        <p>No products with stock below {{ threshold }}.</p>
        <button (click)="increaseThreshold()">Increase Threshold</button>
      </div>
      
      <div class="loading" *ngIf="isLoading">
        Loading low stock products...
      </div>
      
      <div class="error-container" *ngIf="error">
        <p>{{ error }}</p>
        <button (click)="loadLowStockProducts()">Try Again</button>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;
    @use 'sass:color';
    
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      min-height: 0;
      flex: 1 1 auto;
    }
    
    .low-stock-container {
      width: 100%;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
    }
    
    .low-stock-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: $spacing-xl;
      
      h1 {
        font-family: $font-primary;
        font-size: $font-size-3xl;
        font-weight: 400;
        margin-bottom: $spacing-xs;
      }
      
      p {
        color: $color-gray-600;
      }
      
      .header-actions {
        display: flex;
        align-items: center;
        gap: $spacing-md;
      }
      
      .threshold-input {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        
        label {
          color: $color-gray-700;
          font-weight: 500;
        }
        
        input {
          width: 60px;
          padding: $spacing-sm;
          border: 1px solid $color-gray-300;
          
          &:focus {
            outline: none;
            border-color: $color-black;
          }
        }
      }
    }
    
    .bulk-update-btn {
      display: inline-block;
      background: $color-black;
      color: $color-white;
      border: 1px solid $color-black;
      padding: $spacing-sm $spacing-md;
      text-decoration: none;
      transition: all 0.2s;
      font-family: $font-primary;
      
      &:hover {
        background: transparent;
        color: $color-black;
      }
    }
    
    .products-table-container {
      overflow-x: auto;
      background: $color-white;
      border: 1px solid $color-gray-200;
    }
    
    .products-table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: $spacing-md;
        text-align: left;
        border-bottom: 1px solid $color-gray-200;
      }
      
      th {
        background: $color-gray-100;
        font-weight: 500;
        color: $color-gray-700;
        position: sticky;
        top: 0;
      }
      
      tr:last-child td {
        border-bottom: none;
      }
      
      tr:hover td {
        background: $color-gray-100;
      }
      
      .critical {
        color: $danger-color;
        font-weight: 700;
      }
      
      .warning {
        color: color.adjust($danger-color, $lightness: -10%);
        font-weight: 500;
      }
    }
    
    .stock-update-input {
      display: flex;
      gap: $spacing-xs;
      
      input {
        width: 115px;
        padding: 4px 8px;
        border: 1px solid $color-gray-300;
        
        &:focus {
          outline: none;
          border-color: $color-black;
        }
      }
      
      .update-btn {
        background: $color-black;
        color: $color-white;
        border: 1px solid $color-black;
        padding: 4px 8px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: $font-primary;
        font-size: $font-size-sm;
        
        &:hover:not(:disabled) {
          background: transparent;
          color: $color-black;
        }
        
        &:disabled {
          background: $color-gray-300;
          border-color: $color-gray-300;
          color: $color-gray-600;
          cursor: not-allowed;
        }
      }
    }
    
    .success-message {
      margin-top: $spacing-xs;
      color: $success-color;
      font-size: $font-size-sm;
    }
    
    .empty-state, .loading, .error-container {
      text-align: center;
      padding: $spacing-xl;
      background: $color-white;
      border: 1px solid $color-gray-200;
    }
    
    .empty-state {
      p {
        margin-bottom: $spacing-md;
      }
      
      button {
        background: $color-black;
        color: $color-white;
        border: 1px solid $color-black;
        padding: $spacing-sm $spacing-md;
        cursor: pointer;
        transition: all 0.2s;
        font-family: $font-primary;
        
        &:hover {
          background: transparent;
          color: $color-black;
        }
      }
    }
    
    .error-container {
      p {
        color: $danger-color;
        margin-bottom: $spacing-md;
      }
      
      button {
        background: $color-black;
        color: $color-white;
        border: 1px solid $color-black;
        padding: $spacing-sm $spacing-md;
        cursor: pointer;
        transition: all 0.2s;
        font-family: $font-primary;
        
        &:hover {
          background: transparent;
          color: $color-black;
        }
      }
    }
  `]
})
export class AdminStockLowComponent implements OnInit {
  lowStockProducts: AdminProduct[] = [];
  threshold = 10;
  isLoading = true;
  error: string | null = null;
  
  productStockUpdates: Record<number, number | null> = {};
  isUpdating: Record<number, boolean> = {};
  updateSuccess: Record<number, boolean> = {};
  
  constructor(
    private adminService: AdminService,
    private productService: ProductService
  ) {}
  
  ngOnInit(): void {
    this.loadLowStockProducts();
  }
  
  loadLowStockProducts(): void {
    this.isLoading = true;
    this.error = null;
    this.resetUpdateStates();
    
    this.productService.getLowStockProducts(this.threshold).subscribe({
      next: (products) => {
        this.lowStockProducts = products;
        this.isLoading = false;
        console.log('Low stock products loaded:', products);
        
        // Initialize stock updates with current values
        products.forEach(product => {
          this.productStockUpdates[product.id] = null;
        });
      },
      error: (err) => {
        console.error('Error loading low stock products:', err);
        this.error = 'Failed to load low stock products. Please try again.';
        this.isLoading = false;
      }
    });
  }
  
  onThresholdChange(): void {
    // Ensure threshold is at least 1
    if (this.threshold < 1) {
      this.threshold = 1;
    }
    
    this.loadLowStockProducts();
  }
  
  increaseThreshold(): void {
    this.threshold += 10;
    this.loadLowStockProducts();
  }
  
  updateStock(productId: number): void {
    const newStock = this.productStockUpdates[productId];
    
    // Validate input
    if (newStock === null || newStock === undefined || newStock < 0) {
      return;
    }
    
    // Set updating flag
    this.isUpdating[productId] = true;
    this.updateSuccess[productId] = false;
    
    this.productService.updateProductStock(productId, newStock).subscribe({
      next: (updatedProduct) => {
        // Update the product in the list
        const index = this.lowStockProducts.findIndex(p => p.id === productId);
        if (index !== -1) {
          this.lowStockProducts[index] = updatedProduct;
          
          // If the updated stock is above threshold, remove it from the list
          if (updatedProduct.stock > this.threshold) {
            setTimeout(() => {
              this.lowStockProducts = this.lowStockProducts.filter(p => p.id !== productId);
            }, 1500);
          }
        }
        
        // Reset input and show success message
        this.productStockUpdates[productId] = null;
        this.isUpdating[productId] = false;
        this.updateSuccess[productId] = true;
        
        // Clear success message after a delay
        setTimeout(() => {
          this.updateSuccess[productId] = false;
        }, 3000);
      },
      error: (err) => {
        console.error('Error updating stock:', err);
        this.isUpdating[productId] = false;
        this.error = `Failed to update stock for product #${productId}. Please try again.`;
        
        // Clear error after a delay
        setTimeout(() => {
          this.error = null;
        }, 3000);
      }
    });
  }
  
  private resetUpdateStates(): void {
    this.productStockUpdates = {};
    this.isUpdating = {};
    this.updateSuccess = {};
  }
} 