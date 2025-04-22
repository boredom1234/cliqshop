import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.scss'
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  verifyForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  resendDisabled = false;
  resendText = 'Resend Code';
  countdownTimer!: Subscription;
  countdown = 60;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.verifyForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    // Get email from session storage (set during registration)
    const email = sessionStorage.getItem('registrationEmail') || '';
    
    if (!email) {
      this.router.navigate(['/auth/register']);
      return;
    }

    this.verifyForm.patchValue({ email });
  }

  onSubmit() {
    // Mark all fields as touched to trigger validation
    Object.keys(this.verifyForm.controls).forEach(key => {
      const control = this.verifyForm.get(key);
      control?.markAsTouched();
    });

    // stop here if form is invalid
    if (this.verifyForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

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
    } = this.verifyForm.value;

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
          this.successMessage = response.message || 'Account created successfully!';
          
          // Clear session storage
          sessionStorage.removeItem('registrationEmail');
          
          // Clear form
          this.verifyForm.reset();
          
          // Redirect to login page
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Verification failed.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'An unexpected error occurred.';
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  resendCode() {
    const email = this.verifyForm.value.email;
    
    if (!email) {
      this.errorMessage = 'Email address is missing. Please go back to registration.';
      return;
    }

    this.resendDisabled = true;
    this.startResendCountdown();

    this.authService.requestOtp(email).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = response.message || 'Verification code resent to your email.';
          this.errorMessage = '';
        } else {
          this.errorMessage = response.message || 'Failed to resend code.';
          this.successMessage = '';
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to resend code. Please try again later.';
        this.successMessage = '';
      }
    });
  }

  // Check if a form control has errors and has been touched
  hasError(controlName: string): boolean {
    const control = this.verifyForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Get the error message for a form control
  getErrorMessage(controlName: string): string {
    const control = this.verifyForm.get(controlName);
    
    if (!control) return '';
    
    if (control.errors?.['required']) return 'This field is required';
    if (control.errors?.['email']) return 'Please enter a valid email address';
    if (control.errors?.['pattern']) {
      if (controlName === 'otp') return 'OTP must be 6 digits';
      return 'Password must include uppercase, lowercase, number, and special character';
    }
    if (control.errors?.['minlength']) return 'Password must be at least 8 characters long';
    
    return 'Invalid input';
  }

  startResendCountdown() {
    this.countdown = 60;
    this.updateResendText();
    
    if (this.countdownTimer) {
      this.countdownTimer.unsubscribe();
    }
    
    this.countdownTimer = interval(1000).pipe(
      take(60)
    ).subscribe(() => {
      this.countdown--;
      this.updateResendText();
      
      if (this.countdown === 0) {
        this.resendDisabled = false;
        this.resendText = 'Resend Code';
      }
    });
  }

  updateResendText() {
    this.resendText = `Resend in ${this.countdown}s`;
  }

  ngOnDestroy() {
    if (this.countdownTimer) {
      this.countdownTimer.unsubscribe();
    }
  }
}
