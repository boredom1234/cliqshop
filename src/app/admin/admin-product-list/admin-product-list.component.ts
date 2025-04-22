import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AdminService, AdminProduct } from '../services/admin.service';
import { FormsModule } from '@angular/forms';

// Define interface for the component
interface AdminProductResponse {
  products: AdminProduct[];
  totalCount: number;
}

@Component({
  selector: 'app-admin-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule],
  templateUrl: './admin-product-list.component.html',
  styleUrls: ['./admin-product-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdminProductListComponent implements OnInit {
  products: AdminProduct[] = [];
  loading: boolean = true;
  error: string | null = null;
  
  // Pagination
  currentPage: number = 0;  // API uses 0-based indexing
  totalPages: number = 1;
  pageSize: number = 10;
  totalProducts: number = 0;
  
  // Search
  searchQuery: string = '';
  
  // Getter for display page number (1-based)
  get displayPage(): number {
    return this.currentPage + 1;
  }
  
  constructor(private adminService: AdminService) {}
  
  ngOnInit(): void {
    console.log('🔍 AdminProductListComponent: Initializing');
    this.loadProducts();
  }
  
  loadProducts(): void {
    console.log('🔍 AdminProductListComponent: Loading products');
    this.loading = true;
    this.error = null;
    
    this.adminService.getProducts(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (response) => {
        console.log('🔍 AdminProductListComponent: Products loaded successfully', response);
        if (response && response.success && response.data) {
          this.products = response.data.content || [];
          this.totalProducts = response.data.totalElements || 0;
          this.totalPages = response.data.totalPages || 1;
          
          // Transform data to handle missing fields
          this.products = this.products.map(product => ({
            ...product,
            active: product.active === null ? false : product.active,
            image: product.imageUrl || '',
            sku: product.sku || 'SKU' + product.id
          }));
        } else {
          console.error('🔍 AdminProductListComponent: Invalid response format', response);
          this.products = [];
          this.totalProducts = 0;
          this.totalPages = 1;
          this.error = response?.message || 'Invalid response from server';
        }
        this.loading = false;
        
        // Force an extra browser reflow to ensure rendering
        setTimeout(() => {
          console.log('🔍 AdminProductListComponent: Force redraw with products:', this.products ? this.products.length : 0);
          document.querySelectorAll('.product-list').forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            const display = htmlEl.style.display;
            htmlEl.style.display = 'none';
            void htmlEl.offsetHeight; // Force reflow
            htmlEl.style.display = display;
          });
        }, 100);
      },
      error: (err: any) => {
        console.error('🔍 AdminProductListComponent: Error loading products', err);
        this.error = err.error?.message || 'Failed to load products. Please try again.';
        this.products = [];
        this.loading = false;
      }
    });
  }
  
  goToPage(page: number): void {
    // Convert from 1-based to 0-based indexing
    const zeroBasedPage = page - 1;
    if (zeroBasedPage < 0 || zeroBasedPage >= this.totalPages) {
      return;
    }
    this.currentPage = zeroBasedPage;
    this.loadProducts();
  }
  
  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadProducts();
    }
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadProducts();
    }
  }
  
  search(): void {
    this.currentPage = 0;
    this.loadProducts();
  }
  
  clearSearch(): void {
    this.searchQuery = '';
    this.search();
  }
  
  toggleProductStatus(productId: number | undefined): void {
    if (!productId) return;
    
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    
    // Treat null as inactive, so we want to activate it
    const currentActive = product.active === null ? false : product.active;
    const newStatus = currentActive ? 'inactive' : 'active';
    
    this.adminService.updateProductStatus(productId, newStatus).subscribe({
      next: (response) => {
        if (response && response.success) {
          product.active = !currentActive;
        } else {
          console.error('Failed to update product status', response);
          this.error = response?.message || 'Failed to update product status';
        }
      },
      error: (err: any) => {
        console.error('Failed to update product status', err);
        this.error = err.error?.message || 'Failed to update product status';
      }
    });
  }
  
  getStatusLabel(active: boolean | null | undefined): string {
    if (active === true) return 'Active';
    return 'Inactive';
  }
  
  getStatusButtonLabel(active: boolean | null | undefined): string {
    if (active === true) return 'Deactivate';
    return 'Activate';
  }
}
