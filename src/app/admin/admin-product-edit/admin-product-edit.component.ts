import { Component, OnInit, Renderer2, Inject, ComponentFactoryResolver, ApplicationRef, Injector, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService, AdminProduct } from '../services/admin.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-admin-product-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './admin-product-edit.component.html',
  styleUrl: './admin-product-edit.component.scss'
})
export class AdminProductEditComponent implements OnInit, OnDestroy {
  productForm: FormGroup;
  loading = false;
  loadingProduct = true;
  error = '';
  success = false;
  productId: number = 0;
  notFound = false;
  imagePreviewUrl: string = '';
  imageLoadError: boolean = false;
  showDeleteModal = false;
  isDeleting = false;
  deleteSuccess = false;
  categories = [
    'Men',
    'Women',
    'Accessories'
  ];
  
  // Portal host element reference
  private modalHost: HTMLElement | null = null;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private router: Router,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    private appRef: ApplicationRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: ['', [Validators.required, Validators.min(0.01)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      imageUrl: ['', [Validators.required, Validators.pattern('^https?://.*$')]],
      active: [true]
    });

    // Monitor changes to the imageUrl field to update the preview
    this.productForm.get('imageUrl')?.valueChanges.subscribe(url => {
      if (url) {
        this.updateImagePreview(url);
      } else {
        this.imagePreviewUrl = '';
        this.imageLoadError = false;
      }
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productId = +params['id'];
      this.loadProduct();
    });
  }
  
  ngOnDestroy(): void {
    // Clean up any modal elements if component is destroyed
    this.removeModalFromDOM();
  }

  loadProduct(): void {
    this.loadingProduct = true;
    this.notFound = false;
    
    // Here we would typically have a specific endpoint to get a single product by ID
    // For now, we'll use the getProducts and filter by ID as a workaround
    this.adminService.getProducts().subscribe({
      next: (response) => {
        if (response.success) {
          const product = response.data.content.find(p => p.id === this.productId);
          
          if (product) {
            this.productForm.patchValue({
              name: product.name,
              description: product.description,
              price: product.price,
              stock: product.stock,
              category: product.category,
              imageUrl: product.imageUrl,
              active: product.active
            });
            
            // Initialize image preview
            this.updateImagePreview(product.imageUrl);
          } else {
            this.notFound = true;
          }
        } else {
          this.error = response.message || 'Failed to load products';
          this.notFound = true;
        }
        
        this.loadingProduct = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load product.';
        this.loadingProduct = false;
      }
    });
  }

  updateImagePreview(url: string): void {
    this.imagePreviewUrl = url;
    this.imageLoadError = false;
  }

  refreshImagePreview(): void {
    const url = this.productForm.get('imageUrl')?.value;
    if (url) {
      // Add a cache-busting query parameter
      this.imagePreviewUrl = `${url}${url.includes('?') ? '&' : '?'}cache=${new Date().getTime()}`;
      this.imageLoadError = false;
    }
  }

  handleImageError(event: any): void {
    console.error('Image failed to load:', event);
    this.imageLoadError = true;
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      // Mark all fields as touched to trigger validation errors
      Object.keys(this.productForm.controls).forEach(key => {
        const control = this.productForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = false;

    this.adminService.updateProduct(this.productId, this.productForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.success = true;
          setTimeout(() => {
            this.router.navigate(['/admin/products']);
          }, 1500);
        } else {
          this.error = response.message || 'Failed to update product. Please try again.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to update product. Please try again.';
      }
    });
  }

  // Helper method to check if a field is invalid and touched
  isFieldInvalid(field: string): boolean {
    const control = this.productForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Helper method to get error message for a field
  getErrorMessage(field: string): string {
    const control = this.productForm.get(field);
    
    if (!control) {
      return '';
    }
    
    if (control.errors?.['required']) {
      return 'This field is required';
    }
    
    if (control.errors?.['minlength']) {
      return `Minimum length is ${control.errors['minlength'].requiredLength} characters`;
    }
    
    if (control.errors?.['min']) {
      return `Value must be at least ${control.errors['min'].min}`;
    }
    
    if (control.errors?.['pattern']) {
      return 'Please enter a valid URL (starting with http:// or https://)';
    }
    
    return 'Invalid input';
  }

  confirmDelete(): void {
    this.showDeleteModal = true;
    
    // Add class to body to prevent scrolling when modal is open
    this.renderer.addClass(this.document.body, 'modal-open');
    
    // Create a modal element at the document body level
    this.createModalInDOM();
  }
  
  cancelDelete(): void {
    this.showDeleteModal = false;
    
    // Remove class from body when modal is closed
    this.renderer.removeClass(this.document.body, 'modal-open');
    
    // Remove the modal from DOM
    this.removeModalFromDOM();
  }
  
  private createModalInDOM(): void {
    // First ensure no existing modal is present
    this.removeModalFromDOM();
    
    // Create a container for the modal
    this.modalHost = this.document.createElement('div');
    this.modalHost.className = 'global-modal-container';
    this.modalHost.style.position = 'fixed';
    this.modalHost.style.top = '0';
    this.modalHost.style.left = '0';
    this.modalHost.style.width = '100vw';
    this.modalHost.style.height = '100vh';
    this.modalHost.style.display = 'flex';
    this.modalHost.style.justifyContent = 'center';
    this.modalHost.style.alignItems = 'center';
    this.modalHost.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.modalHost.style.zIndex = '9';
    
    // Add to the document body, which is above any component hierarchy
    this.document.body.appendChild(this.modalHost);
    
    // Create the modal content
    const modalContent = this.document.createElement('div');
    modalContent.className = 'global-modal-content';
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '4px';
    modalContent.style.maxWidth = '400px';
    modalContent.style.width = '90%';
    modalContent.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.5)';
    modalContent.style.position = 'relative';
    modalContent.style.zIndex = '1000000';
    
    // Add modal HTML content
    modalContent.innerHTML = `
      <h2 style="margin-top: 0; margin-bottom: 16px; font-weight: 500;">Confirm Delete</h2>
      <p style="margin-bottom: 16px;">Are you sure you want to delete this product?</p>
      <p style="margin-bottom: 16px; color: #dc3545; font-size: 14px;">This action cannot be undone.</p>
      <div style="display: flex; justify-content: flex-end; gap: 16px;">
        <button id="modal-cancel-btn" style="padding: 8px 16px; border-radius: 4px; cursor: pointer; background: white; color: #495057; border: 1px solid #ced4da;">Cancel</button>
        <button id="modal-delete-btn" style="padding: 8px 16px; border-radius: 4px; cursor: pointer; background: #dc3545; color: white; border: 1px solid #dc3545;">
          ${this.isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    `;
    
    this.modalHost.appendChild(modalContent);
    
    // Add event listeners
    this.modalHost.addEventListener('click', (e) => {
      if (e.target === this.modalHost) {
        this.cancelDelete();
      }
    });
    
    const cancelBtn = modalContent.querySelector('#modal-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancelDelete());
    }
    
    const deleteBtn = modalContent.querySelector('#modal-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteProduct());
    }
  }
  
  private removeModalFromDOM(): void {
    if (this.modalHost && this.document.body.contains(this.modalHost)) {
      this.document.body.removeChild(this.modalHost);
      this.modalHost = null;
    }
  }
  
  deleteProduct(): void {
    this.isDeleting = true;
    this.error = '';
    
    // Update the delete button text if the modal is visible
    if (this.modalHost) {
      const deleteBtn = this.modalHost.querySelector('#modal-delete-btn');
      if (deleteBtn) {
        deleteBtn.textContent = 'Deleting...';
        (deleteBtn as HTMLButtonElement).disabled = true;
      }
    }
    
    this.adminService.deleteProduct(this.productId).subscribe({
      next: (response) => {
        this.isDeleting = false;
        if (response.success) {
          this.deleteSuccess = true;
          this.showDeleteModal = false;
          
          // Remove modal-open class and modal element
          this.renderer.removeClass(this.document.body, 'modal-open');
          this.removeModalFromDOM();
          
          // Show success message briefly before redirecting
          setTimeout(() => {
            this.router.navigate(['/admin/products']);
          }, 1500);
        } else {
          this.error = response.message || 'Failed to delete product. Please try again.';
          this.showDeleteModal = false;
          
          // Remove modal-open class and modal element
          this.renderer.removeClass(this.document.body, 'modal-open');
          this.removeModalFromDOM();
        }
      },
      error: (err) => {
        this.isDeleting = false;
        this.showDeleteModal = false;
        
        // Remove modal-open class and modal element
        this.renderer.removeClass(this.document.body, 'modal-open');
        this.removeModalFromDOM();
        
        // Check for specific error about product being used by customers
        const errorMessage = err.error?.message || '';
        if (errorMessage.toLowerCase().includes('used by') || 
            errorMessage.toLowerCase().includes('in use') || 
            errorMessage.toLowerCase().includes('customer') ||
            errorMessage.toLowerCase().includes('foreign key constraint') ||
            errorMessage.toLowerCase().includes('constraint fails') ||
            errorMessage.toLowerCase().includes('cart_items')) {
          this.error = 'This product cannot be deleted because it is being used by a customer.';
        } else {
          this.error = errorMessage || 'Failed to delete product. Please try again.';
        }
      }
    });
  }
}
