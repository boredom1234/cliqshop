import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-admin-product-add',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './admin-product-add.component.html',
  styleUrl: './admin-product-add.component.scss'
})
export class AdminProductAddComponent {
  productForm: FormGroup;
  loading = false;
  error = '';
  success = false;
  categories = [
    'Men',
    'Women',
    'Accessories'
  ];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private router: Router
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

    this.adminService.addProduct(this.productForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.success = true;
          setTimeout(() => {
            this.router.navigate(['/admin/products']);
          }, 1500);
        } else {
          this.error = response.message || 'Failed to add product. Please try again.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to add product. Please try again.';
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
}
