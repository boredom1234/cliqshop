import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, UserProfile, ProfileUpdateRequest } from '../services/user.service';
import { UserLayoutComponent } from '../user-layout/user-layout.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, UserLayoutComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;
  loading = true;
  error = '';
  
  // UI state variables
  updateProfileMode = false;
  changePasswordMode = false;
  profileUpdateSuccess = '';
  profileUpdateError = '';
  passwordChangeSuccess = '';
  passwordChangeError = '';
  profileUpdateLoading = false;
  
  // Forms
  profileForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {
    console.log('ProfileComponent initialized');

    // Initialize profile form
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required]]
    });

    // Initialize password form
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    console.log('ProfileComponent ngOnInit called');
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    this.error = '';
    console.log('ProfileComponent: Loading user profile...');

    this.userService.getUserDetails().subscribe({
      next: (profile) => {
        console.log('ProfileComponent: Received profile data:', profile);
        this.userProfile = profile;
        this.loading = false;
        
        // Update the form with the user's current data
        this.updateFormWithUserData();
      },
      error: (err) => {
        console.error('ProfileComponent: Error loading profile:', err);
        this.error = err.error?.message || err.message || 'An unexpected error occurred';
        this.loading = false;
      }
    });
  }

  // Format date string to a readable format
  formatDate(dateString: string | undefined): string {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Invalid date';
    }
  }

  // Toggle profile update mode
  toggleUpdateProfileMode(): void {
    this.updateProfileMode = !this.updateProfileMode;
    this.changePasswordMode = false;
    this.profileUpdateSuccess = '';
    this.profileUpdateError = '';
    
    if (this.updateProfileMode) {
      // Reset the form with the current user data
      this.updateFormWithUserData();
    }
  }

  // Toggle password change mode
  toggleChangePasswordMode(): void {
    this.changePasswordMode = !this.changePasswordMode;
    this.updateProfileMode = false;
    this.passwordChangeSuccess = '';
    this.passwordChangeError = '';
    
    if (this.changePasswordMode) {
      // Reset the password form
      this.passwordForm.reset();
    }
  }

  // Update form with current user data
  updateFormWithUserData(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        name: this.userProfile.name || '',
        address: this.userProfile.address || '',
        city: this.userProfile.city || '',
        state: this.userProfile.state || '',
        postalCode: this.userProfile.postalCode || '',
        country: this.userProfile.country || '',
        phoneNumber: this.userProfile.phoneNumber || ''
      });
    }
  }

  // Submit the profile update form
  submitProfileUpdate(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.profileUpdateLoading = true;
    this.profileUpdateSuccess = '';
    this.profileUpdateError = '';

    const updateData: ProfileUpdateRequest = {
      name: this.profileForm.value.name,
      address: this.profileForm.value.address,
      city: this.profileForm.value.city,
      state: this.profileForm.value.state,
      postalCode: this.profileForm.value.postalCode,
      country: this.profileForm.value.country,
      phoneNumber: this.profileForm.value.phoneNumber
    };

    this.userService.updateProfile(updateData).subscribe({
      next: (updatedProfile) => {
        console.log('Profile updated successfully:', updatedProfile);
        this.userProfile = updatedProfile;
        this.profileUpdateSuccess = 'Profile updated successfully!';
        this.profileUpdateLoading = false;
        this.updateProfileMode = false;
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.profileUpdateError = err.error?.message || err.message || 'Failed to update profile';
        this.profileUpdateLoading = false;
      }
    });
  }

  // Submit the password change form
  submitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.profileUpdateLoading = true;
    this.passwordChangeSuccess = '';
    this.passwordChangeError = '';

    const updateData: ProfileUpdateRequest = {
      name: this.userProfile?.name || '',
      address: this.userProfile?.address || '',
      city: this.userProfile?.city || '',
      state: this.userProfile?.state || '',
      postalCode: this.userProfile?.postalCode || '',
      country: this.userProfile?.country || '',
      phoneNumber: this.userProfile?.phoneNumber || '',
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.userService.updateProfile(updateData).subscribe({
      next: () => {
        console.log('Password changed successfully');
        this.passwordChangeSuccess = 'Password changed successfully!';
        this.profileUpdateLoading = false;
        this.changePasswordMode = false;
        this.passwordForm.reset();
      },
      error: (err) => {
        console.error('Error changing password:', err);
        this.passwordChangeError = err.error?.message || err.message || 'Failed to change password';
        this.profileUpdateLoading = false;
      }
    });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup): { notMatching: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      return { notMatching: true };
    }
    
    return null;
  }
}
