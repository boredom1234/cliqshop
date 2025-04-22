import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const user = this.authService.currentUser;
    if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
      return true;
    }
    
    this.router.navigate(['/auth/login']);
    return false;
  }
}
