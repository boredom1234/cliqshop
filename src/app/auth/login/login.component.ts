import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    
    console.log('Login Component initialized');
    console.log('Current user logged in:', this.authService.isLoggedIn);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      console.log('Form validation failed');
      return;
    }

    const { email, password } = this.loginForm.value;
    
    console.log('Login attempt for:', email);
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Login response received:', response);
        
        // Log detailed response to help debug
        console.log('Response success:', response.success);
        console.log('Response message:', response.message);
        console.log('Response has data?', !!response.data);
        
        if (response.data) {
          console.log('Response data token:', response.data.token ? 'Present' : 'Missing');
          console.log('Response data user:', response.data.user);
        } else {
          console.log('Response direct token:', response.token ? 'Present' : 'Missing');
          console.log('Response direct user:', response.user);
        }
        
        if (response.success) {
          console.log('Login successful, preparing to redirect with force refresh');
          
          // Check auth state after a small delay to ensure storage is updated
          setTimeout(() => {
            console.log('Checking auth state before redirect');
            console.log('Is logged in?', this.authService.isLoggedIn);
            console.log('Current user:', this.authService.currentUser);
            console.log('Is admin?', this.authService.isAdmin);
            
            // If user is admin, redirect to admin dashboard
            if (this.authService.isAdmin) {
              console.log('Redirecting to admin dashboard with force refresh');
              window.location.href = '/admin/dashboard';
            } else {
              // Otherwise redirect to home page
              console.log('Redirecting to home page with force refresh');
              window.location.href = '/';
            }
          }, 300); // Slightly longer delay to ensure storage is updated
        } else {
          console.warn('Login API returned success: false', response);
          this.errorMessage = response.message || 'Login failed. Please check your credentials.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);
        console.error('Error status:', error.status);
        console.error('Error details:', error.error);
        this.errorMessage = error.error?.message || 'An unexpected error occurred during login.';
      }
    });
  }

  // Check if a form control has errors and has been touched
  hasError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Get the error message for a form control
  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    
    if (!control) return '';
    
    if (control.errors?.['required']) return 'This field is required';
    if (control.errors?.['email']) return 'Please enter a valid email address';
    
    return 'Invalid input';
  }
}
