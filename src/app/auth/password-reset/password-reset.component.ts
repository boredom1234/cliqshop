import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.scss'
})
export class PasswordResetComponent implements OnInit {
  resetForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  token = '';
  tokenFromUrl = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetForm = this.fb.group({
      token: ['', Validators.required],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.mustMatch('password', 'confirmPassword')
    });
  }

  ngOnInit() {
    // Get token from URL query params
    this.route.queryParams.subscribe(params => {
      const urlToken = params['token'] || '';
      
      if (urlToken) {
        this.token = urlToken;
        this.tokenFromUrl = true;
        this.resetForm.get('token')?.setValue(urlToken);
      } else {
        this.tokenFromUrl = false;
      }
    });
  }

  onSubmit() {
    // Mark all fields as touched to trigger validation
    Object.keys(this.resetForm.controls).forEach(key => {
      const control = this.resetForm.get(key);
      control?.markAsTouched();
    });

    // stop here if form is invalid
    if (this.resetForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const token = this.resetForm.value.token;
    const newPassword = this.resetForm.value.password;

    this.authService.resetPassword(token, newPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = response.message || 'Password reset successful!';
          
          // Clear the form
          this.resetForm.reset();
          
          // Navigate to login page after a short delay
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Failed to reset password.';
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

  // Check if a form control has errors and has been touched
  hasError(controlName: string): boolean {
    const control = this.resetForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Get the error message for a form control
  getErrorMessage(controlName: string): string {
    const control = this.resetForm.get(controlName);
    
    if (!control) return '';
    
    if (control.errors?.['required']) return 'This field is required';
    if (control.errors?.['minlength']) return 'Password must be at least 8 characters long';
    if (control.errors?.['pattern']) return 'Password must include uppercase, lowercase, number, and special character';
    if (control.errors?.['mustMatch']) return 'Passwords must match';
    
    return 'Invalid input';
  }

  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        // return if another validator has already found an error on the matchingControl
        return;
      }

      // set error on matchingControl if validation fails
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }
}
