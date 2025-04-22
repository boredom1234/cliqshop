import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="user-layout">
      <aside class="user-sidebar">
        <div class="user-sidebar__header">My Account</div>
        <nav class="user-sidebar__nav">
          <a routerLink="/user/profile" routerLinkActive="active">Profile</a>
          <a routerLink="/user/orders" routerLinkActive="active">My Orders</a>
          <a routerLink="/" class="back-to-site">Back to Shop</a>
        </nav>
      </aside>

      <div class="user-content">
        <header class="user-header">
          <h1 class="user-header__title">User Dashboard</h1>
          <div class="user-header__actions">
            <span class="user-name" *ngIf="userName">{{ userName }}</span>
          </div>
        </header>

        <main class="user-main">
          <ng-content></ng-content>
        </main>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .user-layout {
      display: flex;
      min-height: 100vh;
      width: 100%;
      background-color: #f9f9f9;
    }

    .user-sidebar {
      background: $color-white;
      color: $color-black;
      padding: 0;
      width: 250px;
      min-width: 250px;
      height: 100%;
      position: sticky;
      top: 0;
      overflow-y: auto;
      border-right: 1px solid $color-gray-200;
      align-self: flex-start;
    }

    .user-sidebar__header {
      padding: $spacing-lg $spacing-lg;
      font-size: $font-size-lg;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-bottom: 1px solid $color-gray-200;
      color: $color-black;
      height: 72px;
      display: flex;
      align-items: center;
    }

    .user-sidebar__nav {
      display: flex;
      flex-direction: column;
      padding: $spacing-lg 0;

      a {
        color: $color-black;
        text-decoration: none;
        padding: $spacing-sm $spacing-lg;
        transition: all 0.2s ease;
        border-left: 3px solid transparent;
        font-size: $font-size-sm;
        letter-spacing: 0.05em;
        text-transform: uppercase;

        &:hover, &.active {
          background: rgba(0, 0, 0, 0.05);
          color: $color-black;
          border-left: 3px solid $color-black;
          font-weight: 500;
        }

        &.back-to-site {
          margin-top: $spacing-xl;
          color: $color-gray-700;
          font-size: $font-size-xs;
        }
      }
    }

    .user-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      width: calc(100% - 250px);
      min-height: 100vh;
    }

    .user-header {
      background: $color-white;
      padding: $spacing-lg $spacing-xl;
      border-bottom: 1px solid $color-gray-200;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      position: sticky;
      top: 0;
      z-index: 10;
      height: 72px;
    }

    .user-header__title {
      font-size: $font-size-xl;
      margin: 0;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: $color-black;
    }

    .user-main {
      padding: $spacing-xl;
      background: $color-white;
      flex: 1;
      width: 100%;
    }

    .user-name {
      font-weight: 400;
      font-size: $font-size-sm;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    @media (max-width: $breakpoint-md) {
      .user-layout {
        flex-direction: column;
      }

      .user-sidebar {
        width: 100%;
        height: auto;
        position: relative;
        min-height: auto;
      }

      .user-content {
        width: 100%;
      }

      .user-main {
        padding: $spacing-md;
      }
    }
  `]
})
export class UserLayoutComponent implements OnInit, OnDestroy {
  userName: string | undefined;
  private userSubscription: Subscription | null = null;

  constructor(private authService: AuthService) {
    console.log('UserLayoutComponent: initialized');
  }

  ngOnInit(): void {
    console.log('UserLayoutComponent: ngOnInit called');
    // Subscribe to the currentUser$ Observable
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      console.log('UserLayoutComponent: Current user updated:', user);
      this.userName = user?.name;
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription when component is destroyed
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
} 