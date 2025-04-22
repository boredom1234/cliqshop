import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  otpSent = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator to check that passwords match
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      formGroup.get('confirmPassword')?.setErrors(null);
      return null;
    }
  }

  // Request OTP for email verification
  requestOtp() {
    const email = this.registerForm.get('email')?.value;
    
    if (!email || !this.registerForm.get('email')?.valid) {
      this.registerForm.get('email')?.markAsTouched();
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.requestOtp(email).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.otpSent = true;
          this.successMessage = response.message || 'OTP sent successfully to your email.';
        } else {
          this.errorMessage = response.message || 'Failed to send OTP.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'An unexpected error occurred.';
      }
    });
  }

  // Complete registration with OTP verification
  onSubmit() {
    if (this.registerForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    const { 
      email, 
      otp, 
      password, 
      name, 
      address, 
      city,
      state,
      postalCode,
      country,
      phoneNumber 
    } = this.registerForm.value;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.verifyOtpAndRegister(
      email, 
      otp, 
      password, 
      name, 
      address, 
      city,
      state,
      postalCode,
      country,
      phoneNumber
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Registration successful. Redirecting to home page...';
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Registration failed.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'An unexpected error occurred.';
      }
    });
  }

  // Check if a form control has errors and has been touched
  hasError(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Get the error message for a form control
  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    
    if (!control) return '';
    
    if (control.errors?.['required']) return 'This field is required';
    if (control.errors?.['email']) return 'Please enter a valid email address';
    if (control.errors?.['minlength']) {
      if (controlName === 'password') {
        return 'Password must be at least 8 characters long';
      }
      if (controlName === 'otp') {
        return 'OTP must be 6 digits';
      }
      return `Minimum length is ${control.errors['minlength'].requiredLength} characters`;
    }
    if (control.errors?.['maxlength']) return `Maximum length is ${control.errors['maxlength'].requiredLength} characters`;
    if (control.errors?.['passwordMismatch']) return 'Passwords do not match';
    
    return 'Invalid input';
  }
}
