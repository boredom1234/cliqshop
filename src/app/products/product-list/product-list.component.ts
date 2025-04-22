import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService, Product } from '../services/product.service';
import { ProductCardComponent } from '../product-card/product-card.component';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent],
  template: `
    <div class="product-list-container">
      <div class="product-header">
        <h1 class="product-title">{{ title }}</h1>
        <div class="product-filters">
          <div class="search-container">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Search products..." 
              class="search-input"
              (keyup.enter)="searchProducts()"
            >
            <button class="search-button" (click)="searchProducts()">
              <i class="fa fa-search"></i>
            </button>
          </div>
          <div class="filter-container">
            <select [(ngModel)]="selectedCategory" (change)="filterByCategory()" class="category-filter">
              <option value="">All Categories</option>
              <option *ngFor="let category of categories" [value]="category">{{ category }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading indicator -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading products...</p>
      </div>

      <!-- Error message -->
      <div class="error-message" *ngIf="errorMessage">
        <p>{{ errorMessage }}</p>
        <button class="retry-btn" (click)="retry()">Try Again</button>
      </div>

      <div class="products-grid" *ngIf="!loading && !errorMessage && products.length > 0; else noProducts">
        <app-product-card 
          *ngFor="let product of products" 
          [product]="product"
        ></app-product-card>
      </div>

      <ng-template #noProducts>
        <div class="no-products" *ngIf="!loading && !errorMessage">
          <p>No products found. Try adjusting your search or filters.</p>
        </div>
      </ng-template>

      <div class="pagination" *ngIf="totalPages > 1 && !loading && !errorMessage">
        <button 
          class="pagination-btn" 
          [disabled]="currentPage === 0"
          (click)="changePage(currentPage - 1)"
        >
          <i class="fa fa-chevron-left"></i>
        </button>
        <span class="page-info">Page {{ currentPage + 1 }} of {{ totalPages }}</span>
        <button 
          class="pagination-btn" 
          [disabled]="currentPage >= totalPages - 1"
          (click)="changePage(currentPage + 1)"
        >
          <i class="fa fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as vars;

    .product-list-container {
      padding: vars.$spacing-lg;
      max-width: 1200px;
      margin: 0 auto;
    }

    .product-header {
      margin-bottom: vars.$spacing-xl;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: vars.$spacing-md;
    }

    .product-title {
      font-size: vars.$font-size-2xl;
      font-weight: 500;
      margin: 0;
    }

    .product-filters {
      display: flex;
      gap: vars.$spacing-md;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-container {
      position: relative;
      width: 250px;
    }

    .search-input {
      width: 100%;
      padding: vars.$spacing-sm vars.$spacing-lg vars.$spacing-sm vars.$spacing-sm;
      border: 1px solid vars.$color-gray-300;
      border-radius: 4px;
      font-size: vars.$font-size-sm;
      
      &:focus {
        outline: none;
        border-color: vars.$color-gray-700;
      }
    }

    .search-button {
      position: absolute;
      right: 0;
      top: 0;
      height: 100%;
      padding: 0 vars.$spacing-sm;
      background: none;
      border: none;
      color: vars.$color-gray-700;
      cursor: pointer;
      
      &:hover {
        color: vars.$color-black;
      }
    }

    .category-filter {
      padding: vars.$spacing-sm;
      border: 1px solid vars.$color-gray-300;
      border-radius: 4px;
      font-size: vars.$font-size-sm;
      background: vars.$color-white;
      
      &:focus {
        outline: none;
        border-color: vars.$color-gray-700;
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: vars.$spacing-xl;
      margin-bottom: vars.$spacing-lg;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: vars.$primary-color;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: vars.$spacing-md;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      text-align: center;
      padding: vars.$spacing-xl;
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 4px;
      margin-bottom: vars.$spacing-lg;
      
      p {
        color: #d33;
        margin-bottom: vars.$spacing-md;
      }
      
      .retry-btn {
        padding: vars.$spacing-sm vars.$spacing-md;
        background: vars.$color-white;
        border: 1px solid #d33;
        color: #d33;
        border-radius: 4px;
        cursor: pointer;
        
        &:hover {
          background: #d33;
          color: vars.$color-white;
        }
      }
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: vars.$spacing-lg;
      margin-bottom: vars.$spacing-xl;
    }

    .no-products {
      text-align: center;
      padding: vars.$spacing-xl;
      background: vars.$color-gray-100;
      border-radius: 4px;
      
      p {
        color: vars.$color-gray-700;
      }
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: vars.$spacing-md;
      margin-top: vars.$spacing-xl;
    }

    .pagination-btn {
      background: vars.$color-white;
      border: 1px solid vars.$color-gray-300;
      width: 40px;
      height: 40px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      
      &:hover:not(:disabled) {
        border-color: vars.$color-black;
      }
      
      &:disabled {
        color: vars.$color-gray-400;
        cursor: not-allowed;
      }
    }

    .page-info {
      font-size: vars.$font-size-sm;
      color: vars.$color-gray-700;
    }

    @media (max-width: vars.$breakpoint-md) {
      .product-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .product-filters {
        width: 100%;
      }
      
      .search-container {
        width: 100%;
      }
      
      .products-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: vars.$breakpoint-sm) {
      .products-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  currentPage = 0;
  pageSize = 12;
  totalPages = 0;
  totalProducts = 0;
  
  searchQuery = '';
  selectedCategory = '';
  title = 'Our Products';
  
  loading = false;
  errorMessage = '';
  
  categories: string[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load available categories
    this.loadCategories();
    
    // Subscribe to route parameter changes
    const routeSub = this.route.queryParams.subscribe(params => {
      this.currentPage = params['page'] ? parseInt(params['page']) : 0;
      this.searchQuery = params['search'] || '';
      this.selectedCategory = params['category'] || '';
      
      if (this.searchQuery) {
        this.searchProducts(false);
      } else if (this.selectedCategory) {
        this.filterByCategory(false);
      } else {
        this.loadProducts();
      }
    });
    
    this.subscriptions.push(routeSub);
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadCategories(): void {
    // Initialize categories with defaults in case API fails
    this.categories = ['Clothing', 'Footwear', 'Accessories', 'Electronics', 'Home'];

    // Then try to load from API
    const categorySub = this.productService.getCategories()
      .subscribe({
        next: (categories) => {
          if (categories && categories.length > 0) {
            this.categories = categories;
          }
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          // Already initialized with defaults above
        }
      });
      
    this.subscriptions.push(categorySub);
  }

  loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';
    this.title = 'Our Products';
    
    console.log('Starting loadProducts(), requesting page:', this.currentPage, 'size:', this.pageSize);
    
    // Initialize with empty array to prevent undefined errors
    this.products = [];
    
    const productsSub = this.productService.getProducts(this.currentPage, this.pageSize)
      .pipe(finalize(() => {
        console.log('Request completed (success or error)');
        this.loading = false;
      }))
      .subscribe({
        next: (response) => {
          console.log('Response received in component:', response);
          if (response && response.content) {
            console.log('Setting products array:', response.content);
            this.products = response.content;
            // Handle the response properties based on Spring Data JPA PageImpl structure
            this.totalPages = response.totalPages || 1;
            this.totalProducts = response.totalElements || 0;
            
            // If using the REST API response format
            if (response.pageable) {
              // Update the current page if it's different than what we have
              if (response.pageable.pageNumber !== undefined && response.pageable.pageNumber !== this.currentPage) {
                this.currentPage = response.pageable.pageNumber;
              }
            } else if (response.number !== undefined) {
              // Alternative property for page number
              this.currentPage = response.number;
            }
            
            console.log('Products loaded:', this.products);
          } else {
            this.errorMessage = 'No products found. Please try again.';
            console.warn('Response has no content property:', response);
          }
        },
        error: (error) => {
          console.error('Error loading products in component:', error);
          this.errorMessage = 'Failed to load products. Please try again.';
        }
      });
      
    this.subscriptions.push(productsSub);
  }

  searchProducts(updateUrl = true): void {
    if (!this.searchQuery.trim()) {
      this.loadProducts();
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    this.title = `Search results for "${this.searchQuery}"`;
    
    console.log('Starting searchProducts() with query:', this.searchQuery);
    
    if (updateUrl) {
      this.currentPage = 0;
      this.updateQueryParams();
    }
    
    const searchSub = this.productService.searchProducts(this.searchQuery)
      .pipe(finalize(() => {
        console.log('Search request completed (success or error)');
        this.loading = false;
      }))
      .subscribe({
        next: (response) => {
          console.log('Search response received in component:', response);
          if (response && response.results) {
            console.log('Setting search results:', response.results);
            this.products = response.results;
            this.totalProducts = response.totalResults;
            this.totalPages = Math.ceil(response.totalResults / this.pageSize);
          } else {
            this.errorMessage = 'No search results found. Please try a different search term.';
            console.warn('Search response has no results property:', response);
            this.products = [];
          }
        },
        error: (error) => {
          console.error('Error searching products in component:', error);
          this.errorMessage = 'Failed to search products. Please try again.';
          this.products = [];
        }
      });
      
    this.subscriptions.push(searchSub);
  }

  filterByCategory(updateUrl = true): void {
    if (!this.selectedCategory) {
      this.loadProducts();
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    this.title = this.selectedCategory;
    
    console.log('Starting filterByCategory() with category:', this.selectedCategory);
    
    if (updateUrl) {
      this.currentPage = 0;
      this.updateQueryParams();
    }
    
    const categorySub = this.productService.getProductsByCategory(this.selectedCategory)
      .pipe(finalize(() => {
        console.log('Category filter request completed (success or error)');
        this.loading = false;
      }))
      .subscribe({
        next: (response) => {
          console.log('Category response received in component:', response);
          if (response && response.content) {
            console.log('Setting category products:', response.content);
            this.products = response.content;
            this.totalProducts = response.totalProducts;
            this.totalPages = Math.ceil(response.totalProducts / this.pageSize);
          } else {
            this.errorMessage = 'No products found in this category.';
            console.warn('Category response has no content property:', response);
            this.products = [];
          }
        },
        error: (error) => {
          console.error('Error filtering products by category in component:', error);
          this.errorMessage = 'Failed to load category products. Please try again.';
          this.products = [];
        }
      });
      
    this.subscriptions.push(categorySub);
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }
    
    this.currentPage = page;
    this.updateQueryParams();
    
    window.scrollTo(0, 0);
  }
  
  retry(): void {
    this.errorMessage = '';
    
    if (this.searchQuery) {
      this.searchProducts(false);
    } else if (this.selectedCategory) {
      this.filterByCategory(false);
    } else {
      this.loadProducts();
    }
  }

  private updateQueryParams(): void {
    const queryParams: any = { page: this.currentPage > 0 ? this.currentPage : null };
    
    if (this.searchQuery) {
      queryParams.search = this.searchQuery;
    }
    
    if (this.selectedCategory) {
      queryParams.category = this.selectedCategory;
    }
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }
}
