import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AdminService, AdminProduct } from '../services/admin.service';
import { HttpClientModule } from '@angular/common/http';
import { ProductService, StockUpdate } from '../services/product.service';

@Component({
  selector: 'app-admin-stock-bulk-update',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  template: `
    <div class="bulk-update-container">
      <div class="bulk-update-header">
        <div>
          <h1>Bulk Stock Update</h1>
          <p>Update stock levels for multiple products at once</p>
        </div>
        <div class="header-actions">
          <a routerLink="/admin/stock/low" class="low-stock-btn">View Low Stock</a>
        </div>
      </div>
      
      <div class="bulk-update-content">
        <form [formGroup]="updateForm" (ngSubmit)="onSubmit()">
          <div class="bulk-update-table-container">
            <table class="bulk-update-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>New Stock</th>
                </tr>
              </thead>
              <tbody formArrayName="updates">
                <tr *ngFor="let product of products; let i = index" [formGroupName]="i">
                  <td>
                    <div class="product-info">
                      <div class="product-image" *ngIf="product.imageUrl" [style.background-image]="'url(' + product.imageUrl + ')'"></div>
                      <div class="product-details">
                        <div class="product-name">{{ product.name }}</div>
                        <div class="product-id">ID: {{ product.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ product.category }}</td>
                  <td>
                    <div class="current-stock" [ngClass]="{
                      'critical': product.stock <= 5,
                      'warning': product.stock > 5 && product.stock <= 10
                    }">
                      {{ product.stock }}
                    </div>
                  </td>
                  <td>
                    <input 
                      type="number" 
                      formControlName="stock" 
                      [min]="0"
                      placeholder="NEW STOCK"
                      style="width: 120px;"
                    >
                    <div class="error-message" *ngIf="getUpdateControl(i, 'stock')?.errors?.['min'] && getUpdateControl(i, 'stock')?.touched">
                      Min value is 0
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="empty-state" *ngIf="!isLoading && products.length === 0">
            <p>No products found.</p>
          </div>
          
          <div class="loading" *ngIf="isLoading">
            Loading products...
          </div>
          
          <div class="form-actions" *ngIf="products.length > 0">
            <button type="submit" [disabled]="updateForm.invalid || isSubmitting || !hasChanges()">
              {{ isSubmitting ? 'Updating Stock...' : 'Update Stock' }}
            </button>
          </div>
        </form>
        
        <div class="success-message" *ngIf="updateSuccess">
          <div class="success-header">
            <span class="success-icon">✓</span>
            <h3>Stock Updated Successfully</h3>
          </div>
          <ul class="updated-products">
            <li *ngFor="let product of updatedProducts">
              {{ product.name }}: Stock updated to {{ product.stock }}
            </li>
          </ul>
          <div class="success-actions">
            <button (click)="resetForm()">Update More</button>
            <a routerLink="/admin/products">View All Products</a>
          </div>
        </div>
        
        <div class="error-container" *ngIf="error">
          <p>{{ error }}</p>
          <button (click)="error = null">Dismiss</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as vars;
    
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      min-height: 0;
      flex: 1 1 auto;
    }
    
    .bulk-update-container {
      width: 100%;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
    }
    
    .bulk-update-content {
      flex: 1;
      margin-bottom: vars.$spacing-lg;
    }
    
    .bulk-update-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: vars.$spacing-xl;
      
      h1 {
        font-family: vars.$font-primary;
        font-size: vars.$font-size-3xl;
        font-weight: 400;
        margin-bottom: vars.$spacing-xs;
      }
      
      p {
        color: vars.$color-gray-600;
      }
      
      .header-actions {
        display: flex;
        gap: vars.$spacing-sm;
      }
      
      .low-stock-btn {
        display: inline-block;
        background: vars.$color-black;
        color: vars.$color-white;
        border: 1px solid vars.$color-black;
        padding: vars.$spacing-sm vars.$spacing-md;
        text-decoration: none;
        transition: all 0.2s;
        font-family: vars.$font-primary;
        
        &:hover {
          background: transparent;
          color: vars.$color-black;
        }
      }
    }
    
    .bulk-update-table-container {
      overflow-x: auto;
      background: vars.$color-white;
      border: 1px solid vars.$color-gray-200;
      margin-bottom: vars.$spacing-lg;
    }
    
    .bulk-update-table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: vars.$spacing-md;
        text-align: left;
        border-bottom: 1px solid vars.$color-gray-200;
      }
      
      th {
        background: vars.$color-gray-100;
        font-weight: 500;
        color: vars.$color-gray-700;
      }
      
      tr:last-child td {
        border-bottom: none;
      }
      
      tr:hover td {
        background: vars.$color-gray-50;
      }
    }
    
    .product-info {
      display: flex;
      align-items: center;
      gap: vars.$spacing-sm;
      
      .product-image {
        width: 40px;
        height: 40px;
        background-size: cover;
        background-position: center;
        border: 1px solid vars.$color-gray-200;
      }
      
      .product-details {
        .product-name {
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .product-id {
          font-size: vars.$font-size-sm;
          color: vars.$color-gray-600;
        }
      }
    }
    
    .current-stock {
      font-weight: 500;
      
      &.critical {
        color: vars.$danger-color;
      }
      
      &.warning {
        color: vars.$warning-color;
      }
    }
    
    input[type="number"] {
      width: 100px;
      padding: vars.$spacing-sm;
      border: 1px solid vars.$color-gray-300;
      
      &:focus {
        outline: none;
        border-color: vars.$color-black;
      }
    }
    
    .error-message {
      color: vars.$danger-color;
      font-size: vars.$font-size-xs;
      margin-top: vars.$spacing-xs;
    }
    
    .empty-state, .loading {
      text-align: center;
      padding: vars.$spacing-xl;
      background: vars.$color-white;
      border: 1px solid vars.$color-gray-200;
      margin-bottom: vars.$spacing-lg;
    }
    
    .form-actions {
      text-align: right;
      margin-bottom: vars.$spacing-xl;
      
      button {
        background: vars.$color-black;
        color: vars.$color-white;
        border: 1px solid vars.$color-black;
        padding: vars.$spacing-sm vars.$spacing-lg;
        cursor: pointer;
        transition: all 0.2s;
        font-family: vars.$font-primary;
        
        &:hover:not(:disabled) {
          background: transparent;
          color: vars.$color-black;
        }
        
        &:disabled {
          background: vars.$color-gray-300;
          border-color: vars.$color-gray-300;
          color: vars.$color-gray-600;
          cursor: not-allowed;
        }
      }
    }
    
    .success-message {
      background: rgba(vars.$success-color, 0.1);
      border: 1px solid vars.$success-color;
      padding: vars.$spacing-lg;
      margin-bottom: vars.$spacing-xl;
      
      .success-header {
        display: flex;
        align-items: center;
        margin-bottom: vars.$spacing-md;
        
        .success-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: vars.$success-color;
          color: vars.$color-white;
          border-radius: 50%;
          margin-right: vars.$spacing-sm;
        }
        
        h3 {
          color: vars.$success-color;
          font-weight: 500;
          margin: 0;
        }
      }
      
      .updated-products {
        list-style: none;
        padding: 0;
        margin: 0 0 vars.$spacing-lg 0;
        
        li {
          padding: vars.$spacing-xs 0;
          border-bottom: 1px solid rgba(vars.$success-color, 0.2);
          
          &:last-child {
            border-bottom: none;
          }
        }
      }
      
      .success-actions {
        display: flex;
        gap: vars.$spacing-md;
        
        button, a {
          padding: vars.$spacing-sm vars.$spacing-md;
          cursor: pointer;
          transition: all 0.2s;
          font-family: vars.$font-primary;
          text-decoration: none;
          display: inline-block;
        }
        
        button {
          background: vars.$success-color;
          color: vars.$color-white;
          border: 1px solid vars.$success-color;
          
          &:hover {
            background: transparent;
            color: vars.$success-color;
          }
        }
        
        a {
          background: vars.$color-black;
          color: vars.$color-white;
          border: 1px solid vars.$color-black;
          
          &:hover {
            background: transparent;
            color: vars.$color-black;
          }
        }
      }
    }
    
    .error-container {
      background: rgba(vars.$danger-color, 0.1);
      border: 1px solid vars.$danger-color;
      padding: vars.$spacing-md;
      margin-bottom: vars.$spacing-xl;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      p {
        color: vars.$danger-color;
        margin: 0;
      }
      
      button {
        background: transparent;
        color: vars.$danger-color;
        border: 1px solid vars.$danger-color;
        padding: 4px 8px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: vars.$font-size-sm;
        
        &:hover {
          background: vars.$danger-color;
          color: vars.$color-white;
        }
      }
    }
  `]
})
export class AdminStockBulkUpdateComponent implements OnInit {
  updateForm: FormGroup;
  isSubmitting = false;
  error: string | null = null;
  updateSuccess = false;
  isLoading = true;
  
  products: AdminProduct[] = [];
  updatedProducts: AdminProduct[] = [];
  
  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private productService: ProductService
  ) {
    this.updateForm = this.fb.group({
      updates: this.fb.array([])
    });
  }
  
  ngOnInit(): void {
    this.loadProducts();
  }
  
  get updatesFormArray(): FormArray {
    return this.updateForm.get('updates') as FormArray;
  }
  
  loadProducts(): void {
    this.isLoading = true;
    this.error = null;
    
    this.productService.getProducts(0, 1000).subscribe({
      next: (response) => {
        if (response.products) {
          this.products = response.products;
          this.initializeForm();
        } else {
          this.error = 'Failed to load products';
          this.products = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.error = err.error?.message || 'Failed to load products';
        this.products = [];
        this.isLoading = false;
      }
    });
  }
  
  initializeForm(): void {
    // Clear existing form array
    while (this.updatesFormArray.length !== 0) {
      this.updatesFormArray.removeAt(0);
    }
    
    // Create form groups for each product
    this.products.forEach(product => {
      const productGroup = this.fb.group({
        productId: [product.id],
        stock: [null, [Validators.min(0)]]
      });
      this.updatesFormArray.push(productGroup);
    });
  }
  
  getUpdateControl(index: number, controlName: string) {
    return this.updatesFormArray.at(index).get(controlName);
  }
  
  hasChanges(): boolean {
    return this.updatesFormArray.controls.some(control => {
      const stock = control.get('stock')?.value;
      return stock !== null && stock !== undefined;
    });
  }
  
  onSubmit(): void {
    if (this.updateForm.invalid || this.isSubmitting || !this.hasChanges()) {
      return;
    }
    
    // Filter out rows without changes
    const updates: StockUpdate[] = this.updatesFormArray.controls
      .map((control, index) => {
        const formGroup = control as FormGroup;
        const productId = formGroup.get('productId')?.value;
        const stock = formGroup.get('stock')?.value;
        
        if (stock !== null && stock !== undefined) {
          return { productId, stock };
        }
        return null;
      })
      .filter((update): update is StockUpdate => update !== null);
    
    if (updates.length === 0) {
      this.error = 'No stock updates specified.';
      return;
    }
    
    this.isSubmitting = true;
    this.error = null;
    
    this.productService.bulkUpdateStock(updates).subscribe({
      next: (updatedProducts) => {
        this.isSubmitting = false;
        this.updateSuccess = true;
        this.updatedProducts = updatedProducts;
        
        // Update the products array with new stock values
        updatedProducts.forEach(updated => {
          const index = this.products.findIndex(p => p.id === updated.id);
          if (index !== -1) {
            this.products[index] = updated;
          }
        });
        
        console.log('Bulk stock update successful:', updatedProducts);
      },
      error: (err) => {
        console.error('Error performing bulk stock update:', err);
        this.isSubmitting = false;
        this.error = err.error?.message || 'Failed to update stock. Please try again.';
      }
    });
  }
  
  resetForm(): void {
    this.initializeForm();
    this.updateSuccess = false;
    this.error = null;
    this.updatedProducts = [];
  }
} 